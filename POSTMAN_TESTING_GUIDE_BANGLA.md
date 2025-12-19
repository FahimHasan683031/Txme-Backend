# Postman Collection ব্যবহার গাইড (বাংলা)

## 📦 যে Collections তৈরি করা হয়েছে

1. **chat.postman_collection.json** - Chat API টেস্টিং
2. **message.postman_collection.json** - Message API টেস্টিং

## 🚀 Postman এ কিভাবে Import করবেন

### ধাপ ১: Postman খুলুন
- Postman application চালু করুন

### ধাপ ২: Collections Import করুন
1. **Import** button এ ক্লিক করুন (উপরে বামে)
2. **File** tab select করুন
3. এই ফাইলগুলো select করুন:
   - `src/app/modules/chat/chat.postman_collection.json`
   - `src/app/modules/message/message.postman_collection.json`
4. **Import** এ ক্লিক করুন

### ধাপ ৩: Environment Variables সেট করুন

Import করার পর এই variables গুলো set করতে হবে:

#### প্রয়োজনীয় Variables:
1. **baseUrl** - আপনার API এর base URL (default: `http://localhost:5000`)
2. **authToken** - আপনার authentication token (Bearer token)
3. **chatId** - Chat ID (chat তৈরি করার পর auto-save হবে)
4. **participantId** - অন্য user এর ID যার সাথে chat করবেন

#### Variables কিভাবে Set করবেন:
1. Collection এর নামে ক্লিক করুন
2. **Variables** tab এ যান
3. প্রতিটি variable এর **Current Value** set করুন
4. **Save** এ ক্লিক করুন

## 📝 Testing এর ধারাবাহিকতা

### Chat Module Testing

**যে ক্রমে চালাবেন:**

1. **Create User-to-User Chat**
   - প্রথমে `participantId` variable set করুন
   - আপনার এবং অন্য user এর মধ্যে chat তৈরি হবে
   - `chatId` automatically save হবে

2. **Create Admin Support Chat**
   - Admin support chat তৈরি করবে
   - কোনো parameter লাগবে না

3. **Get All Chats**
   - আপনার সব chats দেখাবে
   - Unread counts সহ

4. **Get All Chats with Search**
   - Participant এর নাম দিয়ে search করুন

5. **Get Admin Support Chats** (শুধু Admin এর জন্য)
   - ADMIN বা SUPER_ADMIN role লাগবে
   - সব support requests দেখাবে

6. **Delete Chat**
   - Saved `chatId` ব্যবহার করবে
   - Chat এবং সব messages মুছে যাবে

### Message Module Testing

**যে ক্রমে চালাবেন:**

1. **Send Text Message**
   - প্রথমে `chatId` variable set করুন
   - Text message পাঠাবে
   - `messageId` automatically save হবে

2. **Send Image Message**
   - একটা image file upload করুন
   - `image` field এ file select করুন

3. **Send Text + Image Message**
   - Text এবং image দুটোই পাঠাবে

4. **Get Messages (Paginated)**
   - Chat থেকে messages নিয়ে আসবে
   - Default: page 1, limit 50

5. **Get Messages - Page 2**
   - Pagination এর উদাহরণ

6. **Mark Messages as Read**
   - সব unread messages read হিসেবে mark করবে
   - Unread count update হবে

7. **Get Total Unread Count**
   - মোট unread messages দেখাবে
   - Notification badge এর জন্য ব্যবহার করুন

8. **Test Flow - Send and Read**
   - সম্পূর্ণ workflow test

## 🔑 Auth Token কিভাবে পাবেন

### পদ্ধতি ১: API দিয়ে Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response থেকে token copy করে `authToken` variable এ set করুন।

### পদ্ধতি ২: Browser থেকে
1. আপনার application এ login করুন
2. Developer Tools খুলুন (F12)
3. Application/Storage → Local Storage এ যান
4. Auth token copy করুন
5. Postman এর `authToken` variable এ paste করুন

## 📊 Automated Tests

প্রতিটি request এ automated tests আছে যা verify করে:

### Chat Tests:
- ✅ Response status code (200)
- ✅ Success flag true আছে কিনা
- ✅ Chat এ required fields আছে কিনা
- ✅ Participants array আছে কিনা
- ✅ Admin support flag সঠিক আছে কিনা
- ✅ Unread count আছে কিনা

### Message Tests:
- ✅ Response status code (200)
- ✅ Message successfully পাঠানো হয়েছে কিনা
- ✅ Message এ required fields আছে কিনা
- ✅ Sender readBy array তে আছে কিনা
- ✅ Pagination info আছে কিনা
- ✅ Unread count number কিনা

## 🎯 Testing Scenarios

### Scenario 1: User-to-User Chat
```
1. Create User-to-User Chat (participantId set করুন)
2. Send Text Message (saved chatId ব্যবহার করুন)
3. Get Messages
4. Mark Messages as Read
5. Get Total Unread Count
```

### Scenario 2: Admin Support
```
1. Create Admin Support Chat
2. Send Text Message
3. (Admin হিসেবে) Get Admin Support Chats
4. (Admin হিসেবে) Reply পাঠান
5. Mark Messages as Read
```

### Scenario 3: Read/Unread Tracking
```
1. Get Total Unread Count (count টা note করুন)
2. Send Text Message
3. Get Total Unread Count (বাড়বে)
4. Mark Messages as Read
5. Get Total Unread Count (কমবে)
```

### Scenario 4: Image Messages
```
1. Send Image Message (file upload করুন)
2. Send Text + Image Message
3. Get Messages (images আছে কিনা verify করুন)
```

## 🔍 Test Results দেখা

Request চালানোর পর:
1. **Test Results** tab এ ক্লিক করুন
2. কোন tests pass/fail হয়েছে দেখুন
3. বিস্তারিত logs এর জন্য **Console** check করুন

## 💡 গুরুত্বপূর্ণ Tips

1. **পুরো Collection চালানো**: সব requests একসাথে চালাতে পারবেন
   - Collection এ ক্লিক করুন → **Run** এ ক্লিক করুন
   - যে requests চালাবেন select করুন
   - **Run [Collection Name]** এ ক্লিক করুন

2. **Responses Save করা**: Postman automatically responses save করে

3. **Environment**: বিভিন্ন environments তৈরি করুন:
   - Development (localhost)
   - Staging
   - Production

4. **Pre-request Scripts**: কিছু requests automatically variables set করে

5. **Console Logs**: Debugging এর জন্য Postman console check করুন
   - View → Show Postman Console

## 🐛 সমস্যা সমাধান

### সমস্যা: 401 Unauthorized
- **সমাধান**: Valid token দিয়ে `authToken` variable update করুন

### সমস্যা: 404 Not Found
- **সমাধান**: `baseUrl` সঠিক আছে কিনা check করুন

### সমস্যা: chatId পাওয়া যাচ্ছে না
- **সমাধান**: প্রথমে "Create Chat" request চালান chatId generate করার জন্য

### সমস্যা: participantId required
- **সমাধান**: Valid user ID দিয়ে `participantId` variable set করুন

### সমস্যা: File upload কাজ করছে না
- **সমাধান**: `image` field এ actual file select করেছেন কিনা নিশ্চিত করুন

## 📱 একাধিক User দিয়ে Testing

Users এর মধ্যে chat test করতে:

1. **User A**: 
   - Login করুন এবং token নিন
   - User A এর token দিয়ে collection তৈরি করুন
   - User B এর ID দিয়ে chat তৈরি করুন

2. **User B**:
   - Login করুন এবং token নিন
   - User B এর token দিয়ে আরেকটা collection তৈরি করুন
   - Same chat এ messages পাঠান

3. **Verify করুন**:
   - Unread counts check করুন
   - Mark as read test করুন
   - Real-time updates verify করুন

## 🎨 Collection Variables তালিকা

| Variable | বর্ণনা | উদাহরণ |
|----------|---------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGciOiJIUzI1NiIs... |
| chatId | Chat ID | 507f1f77bcf86cd799439011 |
| participantId | অন্য user এর ID | 507f1f77bcf86cd799439012 |
| messageId | Message ID | 507f1f77bcf86cd799439013 |
| adminSupportChatId | Admin support chat ID | 507f1f77bcf86cd799439014 |

## 📚 আরও তথ্য

- [Postman Documentation](https://learning.postman.com/)
- [API Documentation (English)](../../../CHAT_MESSAGE_SYSTEM.md)
- [Implementation Guide (Bengali)](../../../CHAT_SYSTEM_BANGLA.md)

## ✅ দ্রুত শুরু করার Checklist

- [ ] দুটো collections import করুন
- [ ] `baseUrl` variable set করুন
- [ ] Auth token নিয়ে `authToken` set করুন
- [ ] Chat তৈরির জন্য `participantId` set করুন
- [ ] "Create User-to-User Chat" চালান
- [ ] "Send Text Message" চালান
- [ ] "Get Messages" চালান
- [ ] "Mark Messages as Read" চালান
- [ ] "Get Total Unread Count" চালান

## 🎓 Testing এর ধাপ (বিস্তারিত)

### ১. প্রথম বার Setup
```
1. Postman খুলুন
2. Collections import করুন
3. Variables set করুন (baseUrl, authToken)
4. একজন user এর ID নিয়ে participantId set করুন
```

### ২. Chat তৈরি করুন
```
1. "Create User-to-User Chat" request চালান
2. Response এ chatId পাবেন
3. এটা automatically save হবে
```

### ৩. Message পাঠান
```
1. "Send Text Message" request চালান
2. Text field এ আপনার message লিখুন
3. Response এ message details পাবেন
```

### ৪. Messages দেখুন
```
1. "Get Messages" request চালান
2. সব messages list আকারে পাবেন
3. Pagination info ও পাবেন
```

### ৫. Read/Unread Test করুন
```
1. "Get Total Unread Count" চালান (count note করুন)
2. নতুন message পাঠান
3. আবার "Get Total Unread Count" চালান (বেড়ে যাবে)
4. "Mark Messages as Read" চালান
5. আবার count check করুন (কমে যাবে)
```

## 🔥 Advanced Tips

### Collection Runner ব্যবহার
1. Collection এ right-click করুন
2. "Run collection" select করুন
3. সব requests একসাথে চালাতে পারবেন
4. Results summary দেখতে পারবেন

### Environment তৈরি করুন
1. Environments tab এ যান
2. "Create Environment" ক্লিক করুন
3. Development, Staging, Production আলাদা করুন
4. প্রতিটিতে আলাদা baseUrl set করুন

### Tests Customize করুন
1. Request এ ক্লিক করুন
2. "Tests" tab এ যান
3. আপনার নিজের tests লিখতে পারবেন
4. JavaScript দিয়ে লিখতে হবে

শুভ Testing! 🚀
