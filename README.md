# HalistaChat - Full-Stack Real-Time WebChat Application

A modern, responsive, and feature-rich real-time CRUD webchat application built with the **MERN** stack (MongoDB, Express.js, React, Node.js), **TypeScript**, and **Socket.IO**. Designed for high performance, ease of use, clean code architecture...

---

## 🚀 Key Features & Full CRUD Capabilities

### 1. Authentication & User Management (CRUD)
- **Create (Register)**: Sign up with Full Name, Email, and Password. Passwords are securely hashed with `bcryptjs` (salt rounds: 10) before storage.
- **Read (Login & Profile)**: Authenticate with Email & Password. Stateless session management using signed JSON Web Tokens (JWT) stored in HTTP cookies. View current user profile via `/api/v1/me`.
- **Read (Directory)**: Browse all registered contacts in real time to start new chats.
- **Update (Profile)**: Edit profile name and update avatar/photo with client-side canvas compression.

### 2. Chat & Conversation Management (CRUD)
- **Create (New Conversation)**: Start a 1-on-1 chat with any registered user.
- **Read (Conversations List)**: Real-time sidebar listing all active chats, latest message snippets, relative timestamps, and unread message counter badges.
- **Delete (Conversation)**: Delete an entire chat conversation along with its full message history. Instantly broadcasts via Socket.IO so both participants' sidebars update immediately.

### 3. Messaging (CRUD) & Real-Time Interaction
- **Create (Send Message)**: Send instant text messages and photo attachments (via Multer with Cloudinary / local uploads fallback). Broadcasted instantly via Socket.IO.
- **Read (Message History & Seen Receipts)**: Load complete chronological chat history. Automatically marks unread incoming messages as read (`seen: true`) and triggers double-check receipts to the sender.
- **Update (Edit Message)**: Senders can edit their sent text messages inline. Socket.IO broadcasts `messageUpdated` with an `(edited)` indicator so both users see the updated text live.
- **Delete (Delete for Everyone)**: Senders can delete their sent messages. Socket.IO broadcasts `messageDeleted` to remove the message in real time from both screens and updates the chat's latest message snippet.
- **Live Presence & Typing Indicators**: Real-time online/offline presence detection and live typing status (`userTyping` / `userStoppedTyping`).

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Axios, Cookies |
| **Backend** | Node.js, Express.js (REST API), TypeScript, Socket.IO (WebSockets) |
| **Database** | MongoDB with Mongoose ODM |
| **Security** | `bcryptjs` (Password Hashing), `jsonwebtoken` (JWT Session Tokens) |
| **File Handling** | Multer, Cloudinary (with fallback to local `/uploads` directory) |

---

## 🎯 System Design & Architecture Highlights

1. **Self-Contained Real-Time Engine**: Built on Socket.IO for low-latency, event-driven messaging, live typing indicators, and presence tracking using active socket room routing.
2. **Stateless Authentication**: Uses industry-standard JWT tokens with `bcryptjs` salt rounds for secure password verification and stateless session authorization via Express middleware.
3. **Optimized Data Layer**: Direct MongoDB schema indexing on `chatId` and `sender` fields ensures sub-millisecond query performance for message history retrieval and unread counters.
4. **Clean Monolithic MERN Design**: A unified full-stack architecture that is lightweight, reliable, easy to deploy, and straightforward to explain in technical interviews.

---

## 📁 Project Structure

```
HalistaChat/
├── backend/               # Node.js + Express + Socket.IO REST & WebSocket API
│   ├── src/
│   │   ├── config/        # db.ts, socket.ts, generateToken.ts, cloudinary.ts
│   │   ├── controllers/   # userController.ts, chatController.ts
│   │   ├── middleware/    # isAuth.ts, multer.ts
│   │   ├── models/        # User.ts, Chat.ts, Message.ts
│   │   ├── routes/        # userRoutes.ts, chatRoutes.ts
│   │   └── index.ts       # Server entry point
│   ├── .env               # Private MongoDB & JWT credentials (git-ignored)
│   ├── .env.example       # Public placeholder template for GitHub
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # React 19 + TypeScript + Vite + Tailwind CSS Client
│   ├── src/
│   │   ├── components/    # ChatHeader, ChatMessages, ChatSidebar, MessageInput
│   │   ├── context/       # AppContext.tsx, SocketContext.tsx
│   │   ├── pages/         # LoginPage.tsx, ChatPage.tsx, ProfilePage.tsx
│   │   └── App.tsx        # Application routes
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── README.md              # Project documentation and interview talking points
└── .gitignore             # Root security rules protecting .env and build folders
```

---

## ⚡ How to Run Locally

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
> The backend will start on **`http://localhost:5000`** and connect to MongoDB.

### 2. Start the Frontend Client
```bash
cd frontend
npm run dev
```
> The frontend will start on **`http://localhost:5173`**. Open your browser and navigate to the link.

---

## 🎓 Interview Talking Points (How to Explain this Project)

When discussing HalistaChat during an interview, highlight the following points:

1. **"What is HalistaChat?"**
   > *"HalistaChat is a full-stack real-time messaging platform built using the MERN stack with TypeScript. It supports full CRUD operations on messages (create, read, edit, delete), chat conversations, and user profiles, combined with bi-directional real-time communication via Socket.IO."*

2. **"How does real-time communication work?"**
   > *"When an authenticated user connects, their socket ID is registered in an active connection map on the Node.js server. When a message is sent via REST API, the server persists it to MongoDB, updates the latest message pointer on the Chat model, and uses Socket.IO to broadcast the message event directly to the recipient's socket and chat room. I also implemented event handlers for live typing indicators, message editing, deletion, and read receipts."*

3. **"How is authentication handled?"**
   > *"Authentication uses secure email and password registration. Passwords are salted and hashed using bcrypt before database insertion. Upon successful verification, the backend signs a JSON Web Token containing the user payload, which the frontend stores in secure cookies for stateless request authorization via Express middleware."*

4. **"Why did you choose this architecture?"**
   > *"I prioritized a clean, decoupled MERN architecture with an event-driven Socket.IO layer and stateless JWT authentication. This ensures minimal operational overhead, zero complex external dependencies, high scalability, and sub-millisecond real-time event delivery."*
