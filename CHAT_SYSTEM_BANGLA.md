# চ্যাট এবং মেসেজ সিস্টেম - আপডেট সারাংশ

## যা যা পরিবর্তন করা হয়েছে

### ✅ সম্পূর্ণ নতুন ফিচার

1. **যেকোনো ইউজার যেকোনো ইউজারকে মেসেজ করতে পারবে**
   - CUSTOMER, PROVIDER, ADMIN সবাই একে অপরকে মেসেজ করতে পারবে
   - আগে শুধু CUSTOMER রা মেসেজ করতে পারতো

2. **Admin Support System**
   - ইউজাররা admin support chat তৈরি করতে পারবে
   - একাধিক admin staff সব support chat দেখতে এবং reply করতে পারবে
   - Admin panel এ আলাদা করে সব support chat দেখা যাবে

3. **Read/Unread Message Tracking**
   - প্রতিটি মেসেজের জন্য track করা হবে কে কে পড়েছে
   - Unread message count দেখানো হবে প্রতিটি chat এ
   - Total unread count পাওয়া যাবে notification badge এর জন্য

4. **Chat List Improvements**
   - Last message দেখানো হবে প্রতিটি chat এ
   - Unread count badge দেখানো হবে
   - সবচেয়ে recent message অনুযায়ী sort হবে

## Database Changes

### Chat Model এ নতুন ফিল্ড
- `isAdminSupport`: admin support chat চিহ্নিত করার জন্য
- `lastMessage`: শেষ মেসেজের reference
- `lastMessageAt`: শেষ মেসেজের সময়
- `timestamps`: createdAt, updatedAt

### Message Model এ নতুন ফিল্ড
- `readBy`: যারা মেসেজ পড়েছে তাদের ID array

## নতুন API Endpoints

### Chat APIs
1. `POST /api/chat` - নতুন chat তৈরি
2. `POST /api/chat/admin-support` - admin support chat তৈরি
3. `GET /api/chat` - সব chat দেখা (unread count সহ)
4. `GET /api/chat/admin-support/all` - সব support chat (admin only)
5. `DELETE /api/chat/:id` - chat মুছে ফেলা

### Message APIs
1. `POST /api/message` - মেসেজ পাঠানো
2. `GET /api/message/:id` - chat এর মেসেজ দেখা (paginated)
3. `PATCH /api/message/mark-read/:chatId` - মেসেজ read হিসেবে mark করা
4. `GET /api/message/unread/count` - total unread count পাওয়া

## কিভাবে কাজ করে

### User to User Chat
1. User A, User B কে মেসেজ করতে চায়
2. `POST /api/chat` এ request করে `{ participant: "userB_id" }`
3. Chat তৈরি হয় বা existing chat return হয়
4. এরপর message পাঠাতে পারে

### Admin Support
1. User admin support চায়
2. `POST /api/chat/admin-support` এ request করে
3. Admin support chat তৈরি হয়
4. Admin panel থেকে সব admin এই chat দেখতে পারে
5. যেকোনো admin reply করতে পারে

### Read/Unread Tracking
1. মেসেজ পাঠানোর সময় sender automatically `readBy` তে add হয়
2. User যখন chat open করে, `PATCH /api/message/mark-read/:chatId` call করে
3. সব unread message `readBy` তে user add হয়
4. Chat list এ unread count automatically update হয়

## Frontend এ কি করতে হবে

### Chat List দেখানো
```javascript
// GET /api/chat
// Response এ প্রতিটি chat এ থাকবে:
{
  _id: "chatId",
  participants: [...],
  lastMessage: {...},
  unreadCount: 5,  // এটা badge এ দেখাতে হবে
  isAdminSupport: false
}
```

### Chat Open করলে
```javascript
// 1. Messages load করো
GET /api/message/:chatId

// 2. Messages read mark করো
PATCH /api/message/mark-read/:chatId

// 3. Socket.IO তে listen করো নতুন message এর জন্য
socket.on(`getMessage::${chatId}`, (message) => {
  // UI তে নতুন message add করো
});
```

### Notification Badge
```javascript
// Total unread count পাও
GET /api/message/unread/count

// Response: { unreadCount: 10 }
// এটা notification badge এ দেখাও
```

### Admin Panel
```javascript
// Admin support chats দেখো
GET /api/chat/admin-support/all

// সব support chat list দেখাও unread count সহ
```

## Important Notes

1. **Socket.IO Integration**: Real-time message এর জন্য socket.io ব্যবহার করতে হবে
2. **Mark as Read**: Chat open করলেই mark-read API call করতে হবে
3. **Pagination**: Message history pagination সহ load করতে হবে
4. **File Upload**: Image message পাঠানোর জন্য multipart/form-data ব্যবহার করতে হবে

## Migration করতে হবে?

যদি আগে থেকে data থাকে:
1. সব chat এ `isAdminSupport: false` add করতে হবে
2. সব message এ `readBy: [sender]` add করতে হবে
3. প্রতিটি chat এ `lastMessage` এবং `lastMessageAt` update করতে হবে

## Testing করার জন্য

1. দুইটা user দিয়ে chat তৈরি করো
2. Message পাঠাও এবং unread count check করো
3. Mark as read করো এবং count 0 হয় কিনা দেখো
4. Admin support chat তৈরি করো
5. Admin panel থেকে support chat দেখো এবং reply করো

## যদি কোনো সমস্যা হয়

1. Database indexes add করো:
   - Chat.participants
   - Message.chatId
   - Message.readBy
   - Chat.lastMessageAt

2. Socket.IO properly configure করা আছে কিনা check করো

3. Auth middleware সব role support করছে কিনা verify করো
