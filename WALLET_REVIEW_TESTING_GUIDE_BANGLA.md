# Wallet & Review Postman Collections - বাংলা গাইড

## 📦 যে Collections তৈরি হয়েছে

### 1. Wallet Collection
**File**: `src/app/modules/wallet/wallet.postman_collection.json`
- **8টি requests** automated tests সহ
- Top up, Send money, Withdraw করার সুবিধা
- Validation tests

### 2. Review Collection  
**File**: `src/app/modules/review/review.postman_collection.json`
- **12টি requests** automated tests সহ
- Review তৈরি, দেখা, আপডেট, মুছে ফেলা
- Pagination support
- Validation tests

---

## 🚀 দ্রুত শুরু করুন

### Import করুন
```
Postman → Import → Files Select করুন:
- wallet.postman_collection.json
- review.postman_collection.json
```

### Variables Set করুন

#### Wallet Collection Variables:
| Variable | বর্ণনা | উদাহরণ |
|----------|---------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGci... |
| receiverId | যাকে টাকা পাঠাবেন তার ID | 507f1f77bcf86cd799439011 |
| currentBalance | Auto-saved balance | 1000 |

#### Review Collection Variables:
| Variable | বর্ণনা | উদাহরণ |
|----------|---------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGci... |
| reviewId | Review তৈরি হলে auto-save | 507f1f77bcf86cd799439012 |
| revieweeId | যাকে review দিবেন | 507f1f77bcf86cd799439013 |
| serviceId | Service এর ID | 507f1f77bcf86cd799439014 |

---

## 💰 Wallet API Tests

### Requests এর তালিকা

| # | Request Name | Method | Endpoint | বর্ণনা |
|---|--------------|--------|----------|---------|
| 1 | Top Up Wallet | POST | /api/wallet/topup | Wallet এ টাকা add করুন |
| 2 | Top Up - Small Amount | POST | /api/wallet/topup | ছোট amount test |
| 3 | Send Money to Another User | POST | /api/wallet/send | টাকা পাঠান |
| 4 | Send Money - Large Amount | POST | /api/wallet/send | বড় amount test |
| 5 | Withdraw Money | POST | /api/wallet/withdraw | টাকা withdraw করুন |
| 6 | Withdraw - Small Amount | POST | /api/wallet/withdraw | ছোট withdrawal test |
| 7 | Test Invalid Amount | POST | /api/wallet/topup | Validation test |
| 8 | Test Complete Flow | POST | /api/wallet/topup | সম্পূর্ণ workflow |

### Request উদাহরণ

#### 1. Wallet এ টাকা Add করুন (Top Up)
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

#### 2. টাকা পাঠান
```json
POST /api/wallet/send
{
  "receiverId": "507f1f77bcf86cd799439011",
  "amount": 100
}
```

#### 3. টাকা Withdraw করুন
```json
POST /api/wallet/withdraw
{
  "amount": 200
}
```

### Testing Scenarios

#### Scenario 1: Basic Wallet Operations
```
1. authToken variable set করুন
2. চালান: Top Up Wallet (amount: 1000)
3. Response এ balance check করুন
4. চালান: Send Money (আগে receiverId set করুন)
5. চালান: Withdraw Money
```

#### Scenario 2: Balance Tracking
```
1. চালান: Top Up Wallet
2. Balance note করুন (currentBalance এ auto-save হবে)
3. চালান: Send Money
4. Verify করুন balance কমেছে
5. চালান: Withdraw
6. Final balance verify করুন
```

#### Scenario 3: Validation Testing
```
1. চালান: Test Invalid Amount (Negative)
2. 400/422 error আসবে
3. Error message verify করুন
```

### Automated Tests

প্রতিটি wallet request test করে:
- ✅ Status code 200 আছে কিনা
- ✅ Response এ success: true আছে কিনা
- ✅ Balance number কিনা
- ✅ Balance সঠিকভাবে update হয়েছে কিনা
- ✅ Success message সঠিক কিনা
- ✅ Invalid amounts এর জন্য validation error

---

## ⭐ Review API Tests

### Requests এর তালিকা

| # | Request Name | Method | Endpoint | বর্ণনা |
|---|--------------|--------|----------|---------|
| 1 | Create Review - 5 Star | POST | /api/review | 5-star review তৈরি |
| 2 | Create Review - 4 Star | POST | /api/review | 4-star review তৈরি |
| 3 | Create Review - With Comment | POST | /api/review | Comment সহ review |
| 4 | Get My Reviews | GET | /api/review/my-reviews | নিজের reviews দেখুন |
| 5 | Get My Reviews - Page 2 | GET | /api/review/my-reviews?page=2 | Pagination test |
| 6 | Update Review - Change Rating | PATCH | /api/review/:id | Rating update |
| 7 | Update Review - Change Comment | PATCH | /api/review/:id | Comment update |
| 8 | Update Review - Both | PATCH | /api/review/:id | দুটোই update |
| 9 | Delete Review | DELETE | /api/review/:id | Review মুছুন |
| 10 | Test Invalid Rating (0) | POST | /api/review | Validation test |
| 11 | Test Invalid Rating (6) | POST | /api/review | Validation test |
| 12 | Test Complete Flow | POST | /api/review | সম্পূর্ণ workflow |

### Request উদাহরণ

#### 1. Review তৈরি করুন
```json
POST /api/review
{
  "reviewee": "507f1f77bcf86cd799439011",
  "service": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "অসাধারণ সার্ভিস!"
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
    "comment": "অসাধারণ সার্ভিস!"
  }
}
```

#### 2. নিজের Reviews দেখুন
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

#### 3. Review Update করুন
```json
PATCH /api/review/:id
{
  "rating": 4,
  "comment": "Updated review"
}
```

#### 4. Review মুছে ফেলুন
```json
DELETE /api/review/:id
```

### Testing Scenarios

#### Scenario 1: Review তৈরি এবং দেখা
```
1. authToken, revieweeId, serviceId variables set করুন
2. চালান: Create Review - 5 Star
3. reviewId note করুন (auto-save হবে)
4. চালান: Get My Reviews
5. Verify করুন review list এ আছে
```

#### Scenario 2: Review Update করা
```
1. প্রথমে একটা review তৈরি করুন (request 1)
2. চালান: Update Review - Change Rating
3. চালান: Get My Reviews
4. Verify করুন rating পরিবর্তন হয়েছে
5. চালান: Update Review - Change Comment
6. Verify করুন comment update হয়েছে
```

#### Scenario 3: সম্পূর্ণ CRUD Flow
```
1. চালান: Test Complete Flow (review তৈরি হবে)
2. চালান: Get My Reviews (দেখুন)
3. চালান: Update Review - Both (পরিবর্তন করুন)
4. চালান: Delete Review (মুছে ফেলুন)
5. চালান: Get My Reviews (verify করুন মুছে গেছে)
```

#### Scenario 4: Validation Testing
```
1. চালান: Test Invalid Rating (0)
2. 400/422 error আসবে
3. চালান: Test Invalid Rating (6)
4. 400/422 error আসবে
5. Error messages verify করুন
```

### Automated Tests

প্রতিটি review request test করে:
- ✅ Status code 200 আছে কিনা
- ✅ Response এ success: true আছে কিনা
- ✅ Review এ required fields আছে কিনা
- ✅ Rating 1-5 এর মধ্যে আছে কিনা
- ✅ ReviewId auto-save হয়েছে কিনা
- ✅ Pagination info আছে কিনা
- ✅ Invalid ratings এর জন্য validation error

---

## 🎯 Testing এর ধারাবাহিকতা

### Wallet Testing Workflow
```
┌─────────────────────────────────────┐
│  1. Top Up Wallet (1000 টাকা)       │
│     → Balance: 1000                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Send Money (100 টাকা)           │
│     → Balance: 900                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Withdraw (200 টাকা)             │
│     → Balance: 700                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Final Balance Verify            │
│     → 700 টাকা হওয়া উচিত           │
└─────────────────────────────────────┘
```

### Review Testing Workflow
```
┌─────────────────────────────────────┐
│  1. Review তৈরি করুন (5 stars)     │
│     → reviewId save হবে             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. My Reviews দেখুন                │
│     → Review আছে কিনা verify করুন  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Review Update করুন (4 stars)   │
│     → Rating পরিবর্তন হবে           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Review মুছে ফেলুন               │
│     → Review remove হবে             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  5. আবার My Reviews দেখুন          │
│     → Verify করুন মুছে গেছে        │
└─────────────────────────────────────┘
```

---

## 🔧 Setup নির্দেশনা

### 1. Collections Import করুন
```bash
# Postman এ
1. Import এ ক্লিক করুন
2. wallet.postman_collection.json select করুন
3. review.postman_collection.json select করুন
4. Import এ ক্লিক করুন
```

### 2. Variables Set করুন

#### Wallet এর জন্য:
```javascript
baseUrl: http://localhost:5000
authToken: <আপনার_auth_token>
receiverId: <অন্য_user_এর_id>
```

#### Review এর জন্য:
```javascript
baseUrl: http://localhost:5000
authToken: <আপনার_auth_token>
revieweeId: <যাকে_review_দিবেন_তার_id>
serviceId: <service_এর_id>
```

### 3. Auth Token পান
```bash
# API দিয়ে Login করুন
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response থেকে token copy করুন
# authToken variable এ set করুন
```

---

## 🐛 সমস্যা সমাধান

### Wallet সমস্যা

| সমস্যা | সমাধান |
|--------|---------|
| Insufficient balance | প্রথমে wallet এ টাকা add করুন |
| Invalid receiverId | receiverId variable এ valid user ID set করুন |
| Negative amount error | Amount positive হতে হবে |
| Unauthorized | authToken update করুন |

### Review সমস্যা

| সমস্যা | সমাধান |
|--------|---------|
| নিজেকে review করতে পারবেন না | revieweeId আপনার ID থেকে আলাদা হতে হবে |
| Invalid rating | Rating 1-5 এর মধ্যে হতে হবে |
| Review not found | reviewId সঠিক আছে কিনা check করুন |
| Missing revieweeId/serviceId | এই variables আগে set করুন |

---

## 💡 গুরুত্বপূর্ণ Tips

### Wallet Testing
1. **Balance Track করুন**: currentBalance variable ব্যবহার করুন
2. **বিভিন্ন Amounts Test করুন**: ছোট, বড়, negative
3. **একাধিক Users**: বিভিন্ন receivers এর সাথে test করুন
4. **Error Cases**: Insufficient balance scenarios test করুন

### Review Testing
1. **Auto-save IDs**: reviewId automatically save হয়
2. **Pagination**: বিভিন্ন page sizes test করুন
3. **Rating Range**: সব ratings 1-5 test করুন
4. **Partial Update**: শুধু rating বা শুধু comment update করতে পারবেন
5. **Ownership**: শুধু নিজের reviews update/delete করতে পারবেন

---

## 📊 Test Results

### Expected Pass Rates
- **Wallet Collection**: 8/8 tests pass হওয়া উচিত
- **Review Collection**: 12/12 tests pass হওয়া উচিত (validation errors ছাড়া 10)

### সব Tests একসাথে চালান
```
1. Collection এর নামে ক্লিক করুন
2. "Run" এ ক্লিক করুন
3. সব requests select করুন
4. "Run [Collection Name]" এ ক্লিক করুন
5. Results summary দেখুন
```

---

## ✅ Testing Checklist

### Wallet Module
- [ ] Collection import করেছেন
- [ ] baseUrl এবং authToken set করেছেন
- [ ] receiverId set করেছেন
- [ ] Top Up Wallet চালিয়েছেন
- [ ] Send Money চালিয়েছেন
- [ ] Withdraw Money চালিয়েছেন
- [ ] সব tests pass হয়েছে

### Review Module
- [ ] Collection import করেছেন
- [ ] baseUrl এবং authToken set করেছেন
- [ ] revieweeId এবং serviceId set করেছেন
- [ ] Create Review চালিয়েছেন
- [ ] Get My Reviews চালিয়েছেন
- [ ] Update Review চালিয়েছেন
- [ ] Delete Review চালিয়েছেন
- [ ] Validation scenarios test করেছেন
- [ ] সব tests pass হয়েছে

---

## 🎓 API Endpoints তালিকা

### Wallet API
```
POST   /api/wallet/topup     - টাকা add করুন
POST   /api/wallet/send      - টাকা পাঠান
POST   /api/wallet/withdraw  - টাকা withdraw করুন
```

### Review API
```
POST   /api/review           - Review তৈরি করুন
GET    /api/review/my-reviews - নিজের reviews দেখুন
PATCH  /api/review/:id       - Review update করুন
DELETE /api/review/:id       - Review মুছুন
```

---

শুভ Testing! 🚀
