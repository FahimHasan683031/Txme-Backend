# Wallet & Review Postman Collections - Testing Guide

## 📦 Collections তৈরি হয়েছে

### 1. Wallet Collection
**File**: `src/app/modules/wallet/wallet.postman_collection.json`
- **8টি requests** automated tests সহ
- Top up, Send money, Withdraw functionality
- Validation tests

### 2. Review Collection  
**File**: `src/app/modules/review/review.postman_collection.json`
- **12টি requests** automated tests সহ
- Create, Get, Update, Delete reviews
- Pagination support
- Validation tests

---

## 🚀 Quick Start

### Import করুন
```
Postman → Import → Select Files:
- wallet.postman_collection.json
- review.postman_collection.json
```

### Variables Set করুন

#### Wallet Collection Variables:
| Variable | Description | Example |
|----------|-------------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGci... |
| receiverId | User ID to send money | 507f1f77bcf86cd799439011 |
| currentBalance | Auto-saved balance | 1000 |

#### Review Collection Variables:
| Variable | Description | Example |
|----------|-------------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGci... |
| reviewId | Auto-saved after create | 507f1f77bcf86cd799439012 |
| revieweeId | User being reviewed | 507f1f77bcf86cd799439013 |
| serviceId | Service ID | 507f1f77bcf86cd799439014 |

---

## 💰 Wallet API Tests

### Requests List

| # | Request Name | Method | Endpoint | Description |
|---|--------------|--------|----------|-------------|
| 1 | Top Up Wallet | POST | /api/wallet/topup | Add money to wallet |
| 2 | Top Up - Small Amount | POST | /api/wallet/topup | Test small amount |
| 3 | Send Money to Another User | POST | /api/wallet/send | Transfer money |
| 4 | Send Money - Large Amount | POST | /api/wallet/send | Test large transfer |
| 5 | Withdraw Money | POST | /api/wallet/withdraw | Withdraw request |
| 6 | Withdraw - Small Amount | POST | /api/wallet/withdraw | Test small withdrawal |
| 7 | Test Invalid Amount | POST | /api/wallet/topup | Validation test |
| 8 | Test Complete Flow | POST | /api/wallet/topup | Full workflow |

### Request Examples

#### 1. Top Up Wallet
```json
POST /api/wallet/topup
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
    "user": "userId",
    "balance": 1000,
    "status": "active"
  }
}
```

#### 2. Send Money
```json
POST /api/wallet/send
{
  "receiverId": "507f1f77bcf86cd799439011",
  "amount": 100
}
```

#### 3. Withdraw Money
```json
POST /api/wallet/withdraw
{
  "amount": 200
}
```

### Testing Scenarios

#### Scenario 1: Basic Wallet Operations
```
1. Set authToken variable
2. Run: Top Up Wallet (amount: 1000)
3. Check balance in response
4. Run: Send Money (set receiverId first)
5. Run: Withdraw Money
```

#### Scenario 2: Balance Tracking
```
1. Run: Top Up Wallet
2. Note the balance (auto-saved in currentBalance)
3. Run: Send Money
4. Verify balance decreased
5. Run: Withdraw
6. Verify final balance
```

#### Scenario 3: Validation Testing
```
1. Run: Test Invalid Amount (Negative)
2. Should return 400/422 error
3. Verify error message
```

### Automated Tests

Each wallet request tests:
- ✅ Status code is 200
- ✅ Response has success: true
- ✅ Balance is a number
- ✅ Balance updates correctly
- ✅ Success message is correct
- ✅ Validation errors for invalid amounts

---

## ⭐ Review API Tests

### Requests List

| # | Request Name | Method | Endpoint | Description |
|---|--------------|--------|----------|-------------|
| 1 | Create Review - 5 Star | POST | /api/review | Create 5-star review |
| 2 | Create Review - 4 Star | POST | /api/review | Create 4-star review |
| 3 | Create Review - With Comment | POST | /api/review | Review with comment |
| 4 | Get My Reviews | GET | /api/review/my-reviews | Get user's reviews |
| 5 | Get My Reviews - Page 2 | GET | /api/review/my-reviews?page=2 | Pagination test |
| 6 | Update Review - Change Rating | PATCH | /api/review/:id | Update rating |
| 7 | Update Review - Change Comment | PATCH | /api/review/:id | Update comment |
| 8 | Update Review - Both | PATCH | /api/review/:id | Update both |
| 9 | Delete Review | DELETE | /api/review/:id | Delete review |
| 10 | Test Invalid Rating (0) | POST | /api/review | Validation test |
| 11 | Test Invalid Rating (6) | POST | /api/review | Validation test |
| 12 | Test Complete Flow | POST | /api/review | Full workflow |

### Request Examples

#### 1. Create Review
```json
POST /api/review
{
  "reviewee": "507f1f77bcf86cd799439011",
  "service": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Excellent service!"
}
```
**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Review submitted successfully",
  "data": {
    "_id": "reviewId",
    "reviewer": "currentUserId",
    "reviewee": "507f1f77bcf86cd799439011",
    "service": "507f1f77bcf86cd799439012",
    "rating": 5,
    "comment": "Excellent service!"
  }
}
```

#### 2. Get My Reviews
```json
GET /api/review/my-reviews?page=1&limit=10
```
**Response:**
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "_id": "reviewId",
        "rating": 5,
        "comment": "Great!",
        "reviewee": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "service": {
          "title": "Service Name"
        }
      }
    ],
    "paginateInfo": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

#### 3. Update Review
```json
PATCH /api/review/:id
{
  "rating": 4,
  "comment": "Updated review"
}
```

#### 4. Delete Review
```json
DELETE /api/review/:id
```

### Testing Scenarios

#### Scenario 1: Create and View Reviews
```
1. Set authToken, revieweeId, serviceId variables
2. Run: Create Review - 5 Star
3. Note the reviewId (auto-saved)
4. Run: Get My Reviews
5. Verify review appears in list
```

#### Scenario 2: Update Review
```
1. Create a review first (request 1)
2. Run: Update Review - Change Rating
3. Run: Get My Reviews
4. Verify rating changed
5. Run: Update Review - Change Comment
6. Verify comment updated
```

#### Scenario 3: Complete CRUD Flow
```
1. Run: Test Complete Flow (creates review)
2. Run: Get My Reviews (view it)
3. Run: Update Review - Both (modify it)
4. Run: Delete Review (remove it)
5. Run: Get My Reviews (verify deleted)
```

#### Scenario 4: Validation Testing
```
1. Run: Test Invalid Rating (0)
2. Should return 400/422 error
3. Run: Test Invalid Rating (6)
4. Should return 400/422 error
5. Verify error messages
```

### Automated Tests

Each review request tests:
- ✅ Status code is 200
- ✅ Response has success: true
- ✅ Review has required fields (rating, reviewee, service)
- ✅ Rating is between 1-5
- ✅ ReviewId auto-saved
- ✅ Pagination info present
- ✅ Validation errors for invalid ratings

---

## 🎯 Common Testing Workflows

### Wallet Testing Workflow
```
┌─────────────────────────────────────┐
│  1. Top Up Wallet (1000 BDT)        │
│     → Balance: 1000                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Send Money (100 BDT)            │
│     → Balance: 900                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Withdraw (200 BDT)              │
│     → Balance: 700                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Verify Final Balance            │
│     → Should be 700 BDT             │
└─────────────────────────────────────┘
```

### Review Testing Workflow
```
┌─────────────────────────────────────┐
│  1. Create Review (5 stars)         │
│     → reviewId saved                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Get My Reviews                  │
│     → Verify review exists          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Update Review (4 stars)         │
│     → Rating changed                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Delete Review                   │
│     → Review removed                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  5. Get My Reviews Again            │
│     → Verify deleted                │
└─────────────────────────────────────┘
```

---

## 🔧 Setup Instructions

### 1. Import Collections
```bash
# In Postman
1. Click Import
2. Select wallet.postman_collection.json
3. Select review.postman_collection.json
4. Click Import
```

### 2. Set Variables

#### For Wallet:
```javascript
baseUrl: http://localhost:5000
authToken: <your_auth_token>
receiverId: <another_user_id>
```

#### For Review:
```javascript
baseUrl: http://localhost:5000
authToken: <your_auth_token>
revieweeId: <user_to_review_id>
serviceId: <service_id>
```

### 3. Get Auth Token
```bash
# Login via API
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Copy token from response
# Set in authToken variable
```

---

## 🐛 Troubleshooting

### Wallet Issues

| Issue | Solution |
|-------|----------|
| Insufficient balance | Top up wallet first |
| Invalid receiverId | Set valid user ID in receiverId variable |
| Negative amount error | Amount must be positive |
| Unauthorized | Update authToken |

### Review Issues

| Issue | Solution |
|-------|----------|
| Cannot review yourself | revieweeId must be different from your ID |
| Invalid rating | Rating must be 1-5 |
| Review not found | Check reviewId is correct |
| Missing revieweeId/serviceId | Set these variables first |

---

## 📊 Test Results

### Expected Pass Rates
- **Wallet Collection**: 8/8 tests should pass
- **Review Collection**: 12/12 tests should pass (10 for validation errors)

### Running All Tests
```
1. Click on collection name
2. Click "Run"
3. Select all requests
4. Click "Run [Collection Name]"
5. View results summary
```

---

## 💡 Pro Tips

### Wallet Testing
1. **Track Balance**: Use currentBalance variable to track changes
2. **Test Limits**: Try different amounts (small, large, negative)
3. **Multiple Users**: Test send money with different receivers
4. **Error Cases**: Test insufficient balance scenarios

### Review Testing
1. **Auto-save IDs**: reviewId auto-saves after creation
2. **Pagination**: Test different page sizes
3. **Rating Range**: Test all ratings 1-5
4. **Update Partial**: You can update only rating or only comment
5. **Ownership**: Can only update/delete your own reviews

---

## 📚 Related Documentation

- **Chat API**: `chat.postman_collection.json`
- **Message API**: `message.postman_collection.json`
- **General Guide**: `POSTMAN_TESTING_GUIDE.md`
- **Bengali Guide**: `POSTMAN_TESTING_GUIDE_BANGLA.md`

---

## ✅ Testing Checklist

### Wallet Module
- [ ] Import collection
- [ ] Set baseUrl and authToken
- [ ] Set receiverId for send money
- [ ] Run Top Up Wallet
- [ ] Run Send Money
- [ ] Run Withdraw Money
- [ ] Verify all tests pass

### Review Module
- [ ] Import collection
- [ ] Set baseUrl and authToken
- [ ] Set revieweeId and serviceId
- [ ] Run Create Review
- [ ] Run Get My Reviews
- [ ] Run Update Review
- [ ] Run Delete Review
- [ ] Test validation scenarios
- [ ] Verify all tests pass

---

## 🎓 Learning Resources

### Wallet API Endpoints
```
POST   /api/wallet/topup     - Add money
POST   /api/wallet/send      - Send money
POST   /api/wallet/withdraw  - Withdraw money
```

### Review API Endpoints
```
POST   /api/review           - Create review
GET    /api/review/my-reviews - Get user's reviews
PATCH  /api/review/:id       - Update review
DELETE /api/review/:id       - Delete review
```

---

Happy Testing! 🚀
