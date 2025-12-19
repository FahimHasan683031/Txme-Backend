# Postman Collections - Quick Reference

## 📦 Files Created

### Postman Collection Files
1. **`src/app/modules/chat/chat.postman_collection.json`**
   - Chat API testing collection
   - 6 requests with automated tests
   - Tests: Create chat, Admin support, Get chats, Delete chat

2. **`src/app/modules/message/message.postman_collection.json`**
   - Message API testing collection
   - 8 requests with automated tests
   - Tests: Send messages, Get messages, Mark as read, Unread count

### Documentation Files
3. **`POSTMAN_TESTING_GUIDE.md`** (English)
   - Complete usage guide
   - Step-by-step instructions
   - Troubleshooting tips

4. **`POSTMAN_TESTING_GUIDE_BANGLA.md`** (Bengali)
   - বাংলায় সম্পূর্ণ গাইড
   - ধাপে ধাপে নির্দেশনা
   - সমস্যা সমাধান

## 🚀 Quick Start (3 Steps)

### Step 1: Import Collections
```
Postman → Import → Select Files:
- chat.postman_collection.json
- message.postman_collection.json
```

### Step 2: Set Variables
```
Collection → Variables → Set Current Value:
- baseUrl: http://localhost:5000
- authToken: your_token_here
- participantId: other_user_id
```

### Step 3: Run Tests
```
1. Create User-to-User Chat
2. Send Text Message
3. Get Messages
4. Mark Messages as Read
5. Get Total Unread Count
```

## 📋 Chat Collection Requests

| # | Request Name | Method | Endpoint | Description |
|---|--------------|--------|----------|-------------|
| 1 | Create User-to-User Chat | POST | /api/chat | Create chat between users |
| 2 | Create Admin Support Chat | POST | /api/chat/admin-support | Create support chat |
| 3 | Get All Chats | GET | /api/chat | Get all chats with unread count |
| 4 | Get All Chats with Search | GET | /api/chat?search=... | Search chats |
| 5 | Get Admin Support Chats | GET | /api/chat/admin-support/all | Admin panel (admin only) |
| 6 | Delete Chat | DELETE | /api/chat/:id | Delete chat |

## 📋 Message Collection Requests

| # | Request Name | Method | Endpoint | Description |
|---|--------------|--------|----------|-------------|
| 1 | Send Text Message | POST | /api/message | Send text message |
| 2 | Send Image Message | POST | /api/message | Send image message |
| 3 | Send Text + Image | POST | /api/message | Send both |
| 4 | Get Messages (Paginated) | GET | /api/message/:id | Get messages |
| 5 | Get Messages - Page 2 | GET | /api/message/:id?page=2 | Pagination example |
| 6 | Mark Messages as Read | PATCH | /api/message/mark-read/:chatId | Mark as read |
| 7 | Get Total Unread Count | GET | /api/message/unread/count | Get unread count |
| 8 | Test Flow - Send and Read | POST | /api/message | Complete flow test |

## 🔑 Required Variables

| Variable | Required For | Example Value |
|----------|--------------|---------------|
| baseUrl | All requests | http://localhost:5000 |
| authToken | All requests | eyJhbGciOiJIUzI1NiIs... |
| chatId | Message requests | Auto-saved after creating chat |
| participantId | Create chat | 507f1f77bcf86cd799439011 |

## ✅ Automated Tests Included

### Chat Tests Check:
- ✅ Status code is 200
- ✅ Response has success: true
- ✅ Chat has required fields
- ✅ Participants array exists
- ✅ Unread count is present
- ✅ Admin support flag is correct

### Message Tests Check:
- ✅ Status code is 200
- ✅ Message sent successfully
- ✅ Message has chatId, sender, text, readBy
- ✅ Sender is in readBy array
- ✅ Pagination info exists
- ✅ Unread count is a number

## 🎯 Common Testing Scenarios

### Scenario 1: Basic Chat Flow
```
1. Set participantId variable
2. Run: Create User-to-User Chat
3. Run: Send Text Message
4. Run: Get Messages
5. Verify: Messages appear correctly
```

### Scenario 2: Unread Count Testing
```
1. Run: Get Total Unread Count (note count)
2. Run: Send Text Message (from another user)
3. Run: Get Total Unread Count (should increase)
4. Run: Mark Messages as Read
5. Run: Get Total Unread Count (should decrease)
```

### Scenario 3: Admin Support
```
1. Run: Create Admin Support Chat
2. Run: Send Text Message
3. (Switch to admin token)
4. Run: Get Admin Support Chats
5. Run: Send Text Message (admin reply)
```

### Scenario 4: Image Upload
```
1. Run: Send Image Message
   - Select image file in 'image' field
2. Run: Get Messages
3. Verify: Image URL is present
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Update authToken with valid token |
| 404 Not Found | Check baseUrl is correct |
| chatId not found | Run "Create Chat" first |
| participantId required | Set participantId variable |
| File upload fails | Select actual file in image field |

## 📊 Test Results Interpretation

### Green (Passed)
- ✅ All tests passed
- API working correctly
- Continue to next request

### Red (Failed)
- ❌ Check error message
- Verify variables are set
- Check auth token is valid
- Review request body/params

## 💡 Pro Tips

1. **Use Collection Runner**
   - Run all tests at once
   - See overall pass/fail rate
   - Export results

2. **Create Environments**
   - Development
   - Staging
   - Production
   - Switch easily between them

3. **Save Responses**
   - Use as examples
   - Compare with new responses
   - Documentation purposes

4. **Monitor Console**
   - View → Show Postman Console
   - See detailed logs
   - Debug issues

5. **Export Collections**
   - Share with team
   - Version control
   - Backup

## 📚 Related Documentation

- **API Docs**: `CHAT_MESSAGE_SYSTEM.md`
- **Bengali Guide**: `CHAT_SYSTEM_BANGLA.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **English Testing Guide**: `POSTMAN_TESTING_GUIDE.md`
- **Bengali Testing Guide**: `POSTMAN_TESTING_GUIDE_BANGLA.md`

## 🎓 Learning Path

### Beginner
1. Import collections
2. Set basic variables
3. Run one request at a time
4. Check test results

### Intermediate
1. Use Collection Runner
2. Create environments
3. Customize tests
4. Test multiple scenarios

### Advanced
1. Write custom tests
2. Use pre-request scripts
3. Chain requests with variables
4. Automate with Newman (CLI)

## 🔄 Testing Workflow

```
┌─────────────────────────────────────┐
│  1. Import Collections              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Set Variables                   │
│     - baseUrl                       │
│     - authToken                     │
│     - participantId                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Create Chat                     │
│     → chatId auto-saved             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Send Message                    │
│     → messageId auto-saved          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  5. Get Messages                    │
│     → Verify messages               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  6. Mark as Read                    │
│     → Update unread count           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  7. Check Unread Count              │
│     → Verify count updated          │
└─────────────────────────────────────┘
```

## ✨ Summary

- **2 Collections** with **14 total requests**
- **All requests** have automated tests
- **Variables** auto-save for easy workflow
- **Documentation** in English and Bengali
- **Ready to use** - just import and set variables!

Happy Testing! 🚀
