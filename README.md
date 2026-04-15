# ProFlow – Smart Productivity & Team Collaboration Platform

A full-stack, production-ready SaaS productivity platform built with React, Node.js, Express, and MongoDB.

![ProFlow](https://img.shields.io/badge/ProFlow-v1.0.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Auth** | JWT-based register/login, secure password hashing (bcrypt) |
| 📋 **Kanban Board** | Drag-and-drop task management across 4 columns |
| 👥 **Teams** | Create teams, invite via code, assign tasks to members |
| 💬 **Comments** | Chat-style task comments with real-time feel |
| 📊 **Analytics** | Pie, Line, and Bar charts with Chart.js |
| 🔔 **Notifications** | Toast popups + notification panel with unread badges |
| 🌙 **Dark Mode** | Smooth theme toggle with localStorage persistence |
| 👤 **Profile** | Edit profile, upload avatar, change password |

---

## 🚀 Run Locally (Development)

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- npm

### 1. Clone / Navigate to project
```bash
cd g:/dev
```

### 2. Setup & Run Backend
```bash
cd backend
npm install
# Edit .env if needed (default: mongodb://localhost:27017/productivity_db)
npm run dev
```
Backend runs at: **http://localhost:5000**

### 3. Setup & Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

### 4. Open the app
Visit **http://localhost:5173** → Register an account → Start using ProFlow!

---

## 🐳 Run with Docker Compose (Production)

```bash
cd g:/dev
docker-compose up --build -d
```

- Frontend → **http://localhost**
- Backend API → **http://localhost:5000/api**
- MongoDB → `localhost:27017`

To stop:
```bash
docker-compose down
```
To stop and remove volumes:
```bash
docker-compose down -v
```

---

## 📁 Project Structure

```
g:/dev/
├── backend/
│   ├── controllers/       # Business logic
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── server.js          # Entry point
│   ├── .env               # Environment variables
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios instance
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Charts/    # Chart.js wrappers
│   │   │   ├── Layout/    # Sidebar, Navbar
│   │   │   ├── Tasks/     # KanbanBoard, TaskForm
│   │   │   └── UI/        # Modal, TaskCard, Spinner
│   │   ├── context/       # Auth & Theme contexts
│   │   └── pages/         # Dashboard, Tasks, Teams, Profile
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/analytics` | Get analytics data |
| GET | `/api/teams` | Get user teams |
| POST | `/api/teams` | Create team |
| POST | `/api/teams/join` | Join via invite code |
| GET | `/api/comments/:taskId` | Get task comments |
| POST | `/api/comments/:taskId` | Add comment |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/mark-all-read` | Mark all as read |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/productivity_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔧 CI/CD & DevOps

The project is structured to work with any CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins):

- Separate `Dockerfile` for frontend and backend
- `docker-compose.yml` for local/staging orchestration
- Environment-variable-driven configuration (12-factor app)
- Health check endpoint at `GET /api/health`

### Example GitHub Actions workflow hint:
```yaml
- name: Build and push Docker images
  run: |
    docker build -t proflow-backend ./backend
    docker build -t proflow-frontend ./frontend
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Charts | Chart.js + react-chartjs-2 |
| Drag & Drop | @hello-pangea/dnd |
| Icons | Lucide React |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Containerization | Docker + Docker Compose |
