# Postman Collections - Simple Guide

## Collections তৈরি হয়েছে

সব collections একদম simple - শুধু routes, কোনো test scripts নেই।

### 1. Chat API
**File**: `src/app/modules/chat/chat.postman_collection.json`
- Create Chat
- Create Admin Support
- Get Chats
- Get Admin Support Chats
- Delete Chat

### 2. Message API
**File**: `src/app/modules/message/message.postman_collection.json`
- Send Message
- Get Messages
- Mark as Read
- Get Unread Count

### 3. Wallet API
**File**: `src/app/modules/wallet/wallet.postman_collection.json`
- Top Up
- Send Money
- Withdraw

### 4. Review API
**File**: `src/app/modules/review/review.postman_collection.json`
- Create Review
- Get My Reviews
- Update Review
- Delete Review

## কিভাবে ব্যবহার করবেন

### 1. Import করুন
```
Postman → Import → 4টা JSON file select করুন
```

### 2. Variables Set করুন
প্রতিটা collection এ:
- `baseUrl`: http://localhost:5000
- `authToken`: আপনার token

### 3. Request চালান
- Body তে data fill করুন
- Send এ click করুন

এই যা! সহজ এবং simple। 🚀
