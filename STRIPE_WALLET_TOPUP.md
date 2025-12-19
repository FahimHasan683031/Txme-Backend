# Stripe Wallet Top Up Integration

## Overview

Wallet top up এর জন্য Stripe payment integration করা হয়েছে। এটা আপনার existing subscription code থেকে সম্পূর্ণ আলাদা এবং কোনো conflict করবে না।

## Files Created/Modified

### New Files:
1. **`src/app/modules/wallet/wallet.stripe.service.ts`**
   - Stripe payment intent creation
   - Payment verification
   - Successful payment handling

### Modified Files:
1. **`src/app/modules/wallet/wallet.controller.ts`**
   - Added `createTopUpPaymentIntent`
   - Added `verifyTopUpPayment`

2. **`src/app/modules/wallet/wallet.route.ts`**
   - Added `/create-payment-intent` route
   - Added `/verify-payment` route

3. **`src/stripe/handleStripeWebhook.ts`**
   - Added `payment_intent.succeeded` handler for wallet top up

## API Endpoints

### 1. Create Payment Intent
**POST** `/api/wallet/create-payment-intent`

**Request:**
```json
{
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxxxxxxxxxxxx"
  }
}
```

### 2. Verify Payment
**POST** `/api/wallet/verify-payment`

**Request:**
```json
{
  "paymentIntentId": "pi_xxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment verified successfully",
  "data": {
    "status": "succeeded",
    "amount": 1000
  }
}
```

### 3. Regular Top Up (Manual)
**POST** `/api/wallet/topup`

**Request:**
```json
{
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Top up successful",
  "data": {
    "_id": "transaction_id",
    "amount": 1000,
    "type": "topup",
    "status": "success"
  }
}
```

## How It Works

### Payment Flow:

```
┌─────────────────────────────────────┐
│  1. User Requests Top Up            │
│     POST /create-payment-intent     │
│     { amount: 1000 }                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Backend Creates Payment Intent  │
│     - Stripe Payment Intent         │
│     - Returns clientSecret          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Frontend Handles Payment        │
│     - Use Stripe.js                 │
│     - confirmCardPayment()          │
│     - User enters card details      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Stripe Processes Payment        │
│     - Card charged                  │
│     - Sends webhook event           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  5. Webhook Handler                 │
│     - payment_intent.succeeded      │
│     - Adds money to wallet          │
│     - Creates transaction           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  6. Frontend Verifies (Optional)    │
│     POST /verify-payment            │
│     - Check payment status          │
└─────────────────────────────────────┘
```

## Frontend Integration

### Step 1: Install Stripe.js
```bash
npm install @stripe/stripe-js
```

### Step 2: Create Payment Intent
```javascript
const createPaymentIntent = async (amount) => {
  const response = await fetch('/api/wallet/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });
  
  const data = await response.json();
  return data.data.clientSecret;
};
```

### Step 3: Handle Payment with Stripe.js
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('your_publishable_key');

const handlePayment = async (amount) => {
  // 1. Create payment intent
  const clientSecret = await createPaymentIntent(amount);
  
  // 2. Confirm payment
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: cardElement, // Stripe card element
        billing_details: {
          email: userEmail
        }
      }
    }
  );
  
  if (error) {
    console.error('Payment failed:', error);
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!');
    // Optionally verify
    await verifyPayment(paymentIntent.id);
  }
};
```

### Step 4: Verify Payment (Optional)
```javascript
const verifyPayment = async (paymentIntentId) => {
  const response = await fetch('/api/wallet/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ paymentIntentId })
  });
  
  const data = await response.json();
  return data.data;
};
```

## Configuration

### Environment Variables
আপনার `.env` file এ এগুলো already আছে (subscription এর জন্য):

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Currency
Default currency হচ্ছে `usd`। পরিবর্তন করতে চাইলে:

**File**: `src/app/modules/wallet/wallet.stripe.service.ts`
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'bdt', // Change to your currency
  // ...
});
```

## Webhook Setup

### Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Your webhook endpoint already exists (for subscription)
3. Make sure `payment_intent.succeeded` event is enabled
4. The same webhook will handle both subscription and wallet payments

### Local Testing with Stripe CLI:
```bash
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

## Testing

### Test Cards (Stripe Test Mode):
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0025 0000 3155

Any future date for expiry
Any 3 digits for CVC
Any 5 digits for ZIP
```

### Test Flow:
```bash
# 1. Create payment intent
POST /api/wallet/create-payment-intent
{
  "amount": 100
}

# 2. Use clientSecret in frontend with Stripe.js

# 3. After payment, webhook will automatically add money

# 4. Verify payment (optional)
POST /api/wallet/verify-payment
{
  "paymentIntentId": "pi_xxxxx"
}
```

## Security Features

✅ **Payment Intent Metadata**: userId and amount stored securely
✅ **Webhook Signature Verification**: Prevents fake webhooks
✅ **Transaction Atomicity**: Uses MongoDB sessions
✅ **Email Receipts**: Automatic from Stripe
✅ **Amount Validation**: Server-side validation

## Error Handling

### Common Errors:

1. **Insufficient Funds**
```json
{
  "success": false,
  "message": "Your card has insufficient funds"
}
```

2. **Card Declined**
```json
{
  "success": false,
  "message": "Your card was declined"
}
```

3. **Invalid Payment Intent**
```json
{
  "success": false,
  "message": "Invalid payment metadata"
}
```

## Differences from Subscription

| Feature | Subscription | Wallet Top Up |
|---------|-------------|---------------|
| Payment Type | Recurring | One-time |
| Webhook Event | `customer.subscription.created` | `payment_intent.succeeded` |
| Metadata | Subscription details | `type: 'wallet_topup'` |
| Auto-renewal | Yes | No |
| Amount | Fixed plans | User-defined |

## Important Notes

1. **Subscription Code Unchanged**: আপনার existing subscription code একদম same আছে
2. **Separate Handlers**: Wallet এবং subscription আলাদা webhook handlers use করে
3. **Metadata Check**: `metadata.type === 'wallet_topup'` দিয়ে identify করা হয়
4. **Currency**: Default USD, change করতে পারবেন
5. **Amount**: Cents এ convert হয় (multiply by 100)

## Postman Collection Update

Wallet collection এ নতুন requests add করতে পারেন:

```json
{
  "name": "Create Payment Intent",
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/api/wallet/create-payment-intent",
    "body": {
      "mode": "raw",
      "raw": "{\n  \"amount\": 1000\n}"
    }
  }
},
{
  "name": "Verify Payment",
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/api/wallet/verify-payment",
    "body": {
      "mode": "raw",
      "raw": "{\n  \"paymentIntentId\": \"\"\n}"
    }
  }
}
```

## Next Steps

1. ✅ Backend integration complete
2. 🔄 Frontend integration needed:
   - Install @stripe/stripe-js
   - Create payment form
   - Handle card input
   - Confirm payment
3. 🔄 Test with Stripe test cards
4. 🔄 Deploy and configure production webhook

## Support

যদি কোনো সমস্যা হয়:
1. Check Stripe Dashboard → Logs
2. Check webhook events
3. Verify environment variables
4. Test with Stripe CLI locally

---

**সব কিছু ready!** এখন frontend এ Stripe.js integrate করলেই wallet top up কাজ করবে। 🚀
