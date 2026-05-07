# TaskFlow — Team Task Manager

A full-stack team collaboration app for managing projects, assigning tasks, and tracking progress — with role-based access control for Admins and Members.

🔗 **Live Demo:** [taskflow-production-7266.up.railway.app](https://taskflow-production-7266.up.railway.app/login)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Member | alice@demo.com | member123 |
| Member | bob@demo.com | member123 |

---

## Features

- **JWT Authentication** — Secure register/login flow with bcrypt password hashing
- **Role-Based Access Control** — Admins manage projects and tasks; Members update task status only
- **Project Management** — Create projects, invite members by email, mark projects as complete or on hold
- **Task Board** — Kanban-style board with columns: Todo → In Progress → Pending Confirmation → Done
- **Overdue Tracking** — Tasks past their due date are highlighted in red across the board and dashboard
- **Dashboard** — Live stats showing total tasks, completed, in progress, and overdue counts with a recent activity feed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express, Zod validation |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, bcryptjs |
| Deployment | Railway (backend + database + frontend) |

---

## Project Structure

```
team-task-manager/
├── client/                     # React frontend
│   └── src/
│       ├── api/axios.js        # Axios instance with auth headers
│       ├── context/
│       │   ├── AuthContext.jsx # Global auth state
│       │   └── ToastContext.jsx
│       ├── components/
│       │   └── Layout.jsx      # Navbar + page wrapper
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx   # Stats + recent activity
│           ├── Projects.jsx    # Project list
│           └── ProjectDetail.jsx # Kanban board + members
│
└── server/                     # Express backend
    ├── prisma/
    │   ├── schema.prisma       # DB models
    │   └── seed.js             # Demo data
    └── src/
        ├── controllers/        # authController, projectController, taskController
        ├── middleware/auth.js  # JWT verification
        ├── routes/             # auth, projects, tasks
        └── index.js
```

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List all projects for user |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Auth | Get project with tasks & members |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks/dashboard` | Auth | Dashboard stats |
| GET | `/api/tasks/project/:projectId` | Auth | Tasks for a project |
| POST | `/api/tasks/project/:projectId` | Admin | Create task |
| PATCH | `/api/tasks/:id` | Auth | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

---

## Database Schema

```
User           — id, name, email, password, role (ADMIN | MEMBER)
Project        — id, name, description, adminId, completionStatus, completedAt
ProjectMember  — projectId, userId (join table)
Task           — id, title, description, status, dueDate, assigneeId, projectId
```

Task statuses: `TODO` → `IN_PROGRESS` → `PENDING_CONFIRMATION` → `DONE`

Project statuses: `ACTIVE` | `COMPLETED` | `ON_HOLD`

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or a free Railway instance)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Backend
```bash
cd server
npm install
```

Create `server/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

```bash
npx prisma migrate dev --name init   # run migrations
npm run db:seed                      # seed demo accounts
npm run dev                          # start server on :5000
```

### 3. Frontend
```bash
cd ../client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev   # start on http://localhost:5173
```

---

## Environment Variables

### Server
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing tokens |
| `PORT` | Server port (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS |

### Client
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |