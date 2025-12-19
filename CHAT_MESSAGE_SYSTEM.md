# Chat & Message System - Updated Features

## Overview
The chat and message system has been completely updated with the following features:
- ✅ Users can message any other user (CUSTOMER, PROVIDER, ADMIN)
- ✅ Admin support system with multiple admin staff
- ✅ Read/unread message tracking
- ✅ Unread message count display in chat list
- ✅ Real-time message delivery via Socket.IO
- ✅ Support for text and image messages

## Database Schema Changes

### Chat Model
```typescript
{
  participants: Types.ObjectId[];        // Array of user IDs in the chat
  isAdminSupport: boolean;               // Flag for admin support chats
  lastMessage: Types.ObjectId;           // Reference to last message
  lastMessageAt: Date;                   // Timestamp of last message
  status: boolean;                       // Chat active status
  timestamps: true                       // createdAt, updatedAt
}
```

### Message Model
```typescript
{
  chatId: Types.ObjectId;                // Reference to chat
  sender: Types.ObjectId;                // User who sent the message
  text?: string;                         // Message text content
  image?: string;                        // Message image URL
  type: MESSAGE;                         // TEXT, IMAGE, or BOTH
  readBy: Types.ObjectId[];              // Array of users who read the message
  timestamps: true                       // createdAt, updatedAt
}
```

## API Endpoints

### Chat Endpoints

#### 1. Create Chat (User to User)
**POST** `/api/chat`
- **Auth**: CUSTOMER, PROVIDER
- **Body**:
  ```json
  {
    "participant": "userId"
  }
  ```
- **Description**: Creates a chat between current user and another user. Returns existing chat if already exists.

#### 2. Create Admin Support Chat
**POST** `/api/chat/admin-support`
- **Auth**: CUSTOMER, PROVIDER
- **Description**: Creates or retrieves admin support chat for the current user.

#### 3. Get All Chats
**GET** `/api/chat`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Query Params**: `search` (optional)
- **Response**: Returns all chats with:
  - Participant details
  - Last message
  - Unread count for each chat
  - Sorted by most recent message

#### 4. Get Admin Support Chats (Admin Only)
**GET** `/api/chat/admin-support/all`
- **Auth**: ADMIN, SUPER_ADMIN
- **Description**: Returns all admin support chats for admin panel.

#### 5. Delete Chat
**DELETE** `/api/chat/:id`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Description**: Deletes a chat and all its messages.

### Message Endpoints

#### 1. Send Message
**POST** `/api/message`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Body** (multipart/form-data):
  ```json
  {
    "chatId": "chatId",
    "text": "Message text",
    "image": "file upload (optional)",
    "type": "TEXT | IMAGE | BOTH"
  }
  ```
- **Description**: Sends a message in a chat. Automatically marks sender as read.

#### 2. Get Messages
**GET** `/api/message/:id`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Query Params**: 
  - `page` (optional, default: 1)
  - `limit` (optional, default: 50)
- **Response**: Returns paginated messages for a chat.

#### 3. Mark Messages as Read
**PATCH** `/api/message/mark-read/:chatId`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Description**: Marks all unread messages in a chat as read by current user.

#### 4. Get Total Unread Count
**GET** `/api/message/unread/count`
- **Auth**: CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
- **Response**:
  ```json
  {
    "unreadCount": 5
  }
  ```
- **Description**: Returns total unread message count across all chats.

## Features Explained

### 1. User-to-User Messaging
- Any user can message any other user
- Chat is automatically created when first message is sent
- Duplicate chats are prevented

### 2. Admin Support System
- Users can create admin support chats
- Multiple admins can access and respond to support chats
- Admin panel shows all support chats with unread counts
- Support chats are flagged with `isAdminSupport: true`

### 3. Read/Unread Tracking
- Each message has a `readBy` array
- Sender is automatically added to `readBy` when message is sent
- Recipients are added when they mark messages as read
- Unread count is calculated per chat and globally

### 4. Chat List Features
- Shows last message in each chat
- Displays unread count badge
- Sorted by most recent activity
- Shows participant information

### 5. Real-time Updates
- Messages are sent via Socket.IO
- Event: `getMessage::${chatId}`
- Clients should listen to this event for real-time updates

## Usage Examples

### Frontend Integration

#### 1. Create a Chat
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participant: 'otherUserId'
  })
});
```

#### 2. Get Chats with Unread Counts
```javascript
const response = await fetch('/api/chat', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Response includes unreadCount for each chat
const chats = await response.json();
```

#### 3. Send a Message
```javascript
const formData = new FormData();
formData.append('chatId', chatId);
formData.append('text', 'Hello!');
formData.append('type', 'TEXT');

const response = await fetch('/api/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### 4. Mark Messages as Read
```javascript
await fetch(`/api/message/mark-read/${chatId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### 5. Get Unread Count (for badge)
```javascript
const response = await fetch('/api/message/unread/count', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { unreadCount } = await response.json();
// Display in notification badge
```

### Socket.IO Integration

```javascript
import io from 'socket.io-client';

const socket = io('your-server-url');

// Listen for new messages in a specific chat
socket.on(`getMessage::${chatId}`, (message) => {
  // Update UI with new message
  console.log('New message:', message);
});
```

## Admin Panel Integration

### Get All Support Chats
```javascript
const response = await fetch('/api/chat/admin-support/all', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const supportChats = await response.json();
// Display in admin panel with unread counts
```

## Migration Notes

If you have existing data, you may need to:
1. Add `isAdminSupport: false` to existing chats
2. Add `readBy: [sender]` to existing messages
3. Update `lastMessage` and `lastMessageAt` for existing chats

## Best Practices

1. **Always mark messages as read** when user opens a chat
2. **Poll unread count** periodically or use Socket.IO for real-time updates
3. **Handle offline scenarios** - messages should be delivered when user comes online
4. **Implement pagination** for message history
5. **Show typing indicators** using Socket.IO events
6. **Validate file uploads** for security

## Security Considerations

- ✅ Users can only access chats they're participants in
- ✅ Admins have special access to admin support chats
- ✅ File uploads are validated and sanitized
- ✅ All endpoints require authentication
- ✅ Chat deletion removes all associated messages

## Performance Optimizations

- Messages are paginated (default 50 per page)
- Chats are sorted by recent activity
- Unread counts are calculated efficiently using MongoDB aggregation
- Indexes should be added on:
  - `Chat.participants`
  - `Message.chatId`
  - `Message.readBy`
  - `Chat.lastMessageAt`
