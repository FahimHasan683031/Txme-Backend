# Postman Collection Usage Guide

## 📦 Collections Created

1. **chat.postman_collection.json** - Chat API testing
2. **message.postman_collection.json** - Message API testing

## 🚀 How to Import in Postman

### Step 1: Open Postman
- Launch Postman application

### Step 2: Import Collections
1. Click **Import** button (top left)
2. Select **File** tab
3. Navigate to:
   - `src/app/modules/chat/chat.postman_collection.json`
   - `src/app/modules/message/message.postman_collection.json`
4. Click **Import**

### Step 3: Setup Environment Variables

After importing, you need to set these variables:

#### Required Variables:
1. **baseUrl** - Your API base URL (default: `http://localhost:5000`)
2. **authToken** - Your authentication token (Bearer token)
3. **chatId** - Chat ID (will be auto-saved after creating a chat)
4. **participantId** - Another user's ID to create chat with

#### How to Set Variables:
1. Click on the collection name
2. Go to **Variables** tab
3. Set the **Current Value** for each variable
4. Click **Save**

## 📝 Testing Workflow

### Chat Module Testing

**Order of execution:**

1. **Create User-to-User Chat**
   - Set `participantId` variable first
   - Creates a chat between you and another user
   - Auto-saves `chatId` for later use

2. **Create Admin Support Chat**
   - Creates admin support chat
   - No parameters needed

3. **Get All Chats**
   - Retrieves all your chats
   - Shows unread counts

4. **Get All Chats with Search**
   - Search chats by participant name

5. **Get Admin Support Chats** (Admin only)
   - Requires ADMIN or SUPER_ADMIN role
   - Shows all support requests

6. **Delete Chat**
   - Uses saved `chatId`
   - Deletes chat and all messages

### Message Module Testing

**Order of execution:**

1. **Send Text Message**
   - Set `chatId` variable first
   - Sends a text message
   - Auto-saves `messageId`

2. **Send Image Message**
   - Upload an image file
   - Select file in the `image` field

3. **Send Text + Image Message**
   - Sends both text and image

4. **Get Messages (Paginated)**
   - Retrieves messages from a chat
   - Default: page 1, limit 50

5. **Get Messages - Page 2**
   - Example of pagination

6. **Mark Messages as Read**
   - Marks all unread messages as read
   - Updates unread count

7. **Get Total Unread Count**
   - Shows total unread messages
   - Use for notification badge

8. **Test Flow - Send and Read**
   - Complete workflow test

## 🔑 Getting Auth Token

### Method 1: Login via API
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```
Copy the token from response and set it in `authToken` variable.

### Method 2: From Browser
1. Login to your application
2. Open Developer Tools (F12)
3. Go to Application/Storage → Local Storage
4. Copy the auth token
5. Paste in Postman `authToken` variable

## 📊 Automated Tests

Each request includes automated tests that verify:

### Chat Tests:
- ✅ Response status code (200)
- ✅ Success flag is true
- ✅ Chat has required fields
- ✅ Participants array exists
- ✅ Admin support flag is correct
- ✅ Unread count is present

### Message Tests:
- ✅ Response status code (200)
- ✅ Message sent successfully
- ✅ Message has required fields (chatId, sender, text, readBy)
- ✅ Sender is in readBy array
- ✅ Pagination info is present
- ✅ Unread count is a number

## 🎯 Testing Scenarios

### Scenario 1: User-to-User Chat
```
1. Create User-to-User Chat (set participantId)
2. Send Text Message (use saved chatId)
3. Get Messages
4. Mark Messages as Read
5. Get Total Unread Count
```

### Scenario 2: Admin Support
```
1. Create Admin Support Chat
2. Send Text Message
3. (As Admin) Get Admin Support Chats
4. (As Admin) Send Reply
5. Mark Messages as Read
```

### Scenario 3: Read/Unread Tracking
```
1. Get Total Unread Count (note the count)
2. Send Text Message
3. Get Total Unread Count (should increase)
4. Mark Messages as Read
5. Get Total Unread Count (should decrease)
```

### Scenario 4: Image Messages
```
1. Send Image Message (upload file)
2. Send Text + Image Message
3. Get Messages (verify images are present)
```

## 🔍 Viewing Test Results

After running a request:
1. Click on **Test Results** tab
2. See which tests passed/failed
3. Check **Console** for detailed logs

## 💡 Tips

1. **Run Collection**: You can run all requests in sequence
   - Click on collection → Click **Run**
   - Select requests to run
   - Click **Run [Collection Name]**

2. **Save Responses**: Postman auto-saves responses as examples

3. **Environment**: Create different environments for:
   - Development (localhost)
   - Staging
   - Production

4. **Pre-request Scripts**: Some requests auto-set variables

5. **Console Logs**: Check Postman console for debugging
   - View → Show Postman Console

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
- **Solution**: Update `authToken` variable with valid token

### Issue: 404 Not Found
- **Solution**: Check `baseUrl` is correct

### Issue: chatId not found
- **Solution**: Run "Create Chat" request first to generate chatId

### Issue: participantId required
- **Solution**: Set `participantId` variable with a valid user ID

### Issue: File upload fails
- **Solution**: Make sure to select actual file in the `image` field

## 📱 Testing with Multiple Users

To test chat between users:

1. **User A**: 
   - Login and get token
   - Create collection with User A token
   - Create chat with User B's ID

2. **User B**:
   - Login and get token
   - Create another collection with User B token
   - Send messages in the same chat

3. **Verify**:
   - Check unread counts
   - Test mark as read
   - Verify real-time updates

## 🎨 Collection Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| baseUrl | API base URL | http://localhost:5000 |
| authToken | Bearer token | eyJhbGciOiJIUzI1NiIs... |
| chatId | Chat ID | 507f1f77bcf86cd799439011 |
| participantId | Other user ID | 507f1f77bcf86cd799439012 |
| messageId | Message ID | 507f1f77bcf86cd799439013 |
| adminSupportChatId | Admin support chat ID | 507f1f77bcf86cd799439014 |

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [API Documentation](../../../CHAT_MESSAGE_SYSTEM.md)
- [Bengali Guide](../../../CHAT_SYSTEM_BANGLA.md)

## ✅ Quick Start Checklist

- [ ] Import both collections
- [ ] Set `baseUrl` variable
- [ ] Get auth token and set `authToken`
- [ ] Set `participantId` for chat creation
- [ ] Run "Create User-to-User Chat"
- [ ] Run "Send Text Message"
- [ ] Run "Get Messages"
- [ ] Run "Mark Messages as Read"
- [ ] Run "Get Total Unread Count"

Happy Testing! 🚀
