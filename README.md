# TaskFlow — Project Management Dashboard

A full-stack Kanban-style project management dashboard built with the MERN stack (MongoDB, Express, React, Node.js).

## ✨ Features

### Boards, Lists & Task Cards
- **Kanban Boards** — Create multiple project boards with custom gradient backgrounds
- **Lists** — Organize work into columns (e.g., To Do, In Progress, Done)
- **Task Cards** — Rich cards with title, description, priority, labels, due dates, and assignees
- **Drag & Drop** — Reorder cards within lists and move cards between lists using native HTML5 drag-and-drop

### Role-Based Access Control
- **Admin** — Full control: create/edit/delete boards, lists, cards; manage members and roles
- **Member** — Can create/edit lists and cards, but cannot manage board settings or members
- **Viewer** — Read-only access to the board; cannot create, edit, or delete anything

### Data Persistence
- MongoDB for persistent storage (via local MongoDB or MongoDB Atlas)
- Automatic fallback to in-memory MongoDB if no database is available
- JWT-based authentication with secure token storage

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI) — *optional, falls back to in-memory DB*

### 1. Install Server Dependencies
```bash
cd server
npm install
```

### 2. Install Client Dependencies
```bash
cd client
npm install
```

### 3. Configure Environment
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/projectboard_week4
JWT_SECRET=week4_kanban_secret_key_change_in_production
```

### 4. Start the Server
```bash
cd server
npm run dev
```

### 5. Start the Client
```bash
cd client
npm run dev
```

### 6. Open in Browser
Visit **http://localhost:5173**

## 📁 Project Structure

```
assignment_week4/
├── server/
│   ├── config/db.js          # MongoDB connection (with in-memory fallback)
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── boardAccess.js     # Role-based board access
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Board.js           # Board with members & roles
│   │   ├── List.js            # List model
│   │   └── Card.js            # Card model
│   ├── routes/
│   │   ├── auth.js            # Register, login, user search
│   │   ├── boards.js          # Board CRUD + member management
│   │   ├── lists.js           # List CRUD + reorder
│   │   └── cards.js           # Card CRUD + reorder
│   ├── server.js              # Express entry point
│   └── .env                   # Environment variables
├── client/
│   ├── src/
│   │   ├── api/axios.js       # Axios with JWT interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   ├── CardModal/
│   │   │   ├── MembersModal/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Auth/          # Login & Register
│   │   │   ├── Boards/        # Board listing & creation
│   │   │   └── Kanban/        # Kanban board with drag-and-drop
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Design system
│   ├── index.html
│   └── vite.config.js
└── README.md
```

## 🎨 Tech Stack
- **Frontend**: React 18, React Router, Axios, Vite, Vanilla CSS
- **Backend**: Express.js, Mongoose, JWT, bcryptjs
- **Database**: MongoDB (with mongodb-memory-server fallback)
