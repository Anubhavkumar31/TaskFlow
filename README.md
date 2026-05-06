# TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

## Live Demo

- **Frontend:** [your-frontend-url.vercel.app](https://your-frontend-url.vercel.app)
- **Backend API:** [your-backend-url.railway.app](https://your-backend-url.railway.app)

**Demo accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Member | alice@demo.com | member123 |
| Member | bob@demo.com | member123 |

---

## Features

- **Authentication** — Register/Login with JWT. Passwords hashed with bcrypt.
- **Role-based access** — Admins create projects, manage members, create/delete tasks. Members update task status only.
- **Project management** — Create projects, add/remove members by email.
- **Task management** — Create tasks with title, description, due date, assignee. Kanban board (Todo / In Progress / Done).
- **Overdue tracking** — Tasks past due date highlighted red on dashboard and board.
- **Dashboard** — Live stats: total tasks, done, in progress, overdue. Recent task feed.

---

## Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication + bcryptjs
- Zod validation

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios

**Deployment**
- Backend: Railway
- Frontend: Vercel
- Database: Railway PostgreSQL

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Railway free tier)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Backend setup
```bash
cd server
npm install

# Copy env file and fill in your values
copy .env.example .env
```

Edit `server/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key-here"
PORT=5000
```

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Start server
npm run dev
```

### 3. Frontend setup
```bash
cd ../client
npm install

# Copy env file
copy .env.example .env
```

Edit `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Open http://localhost:5173

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | Auth | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/projects | Auth | Get all projects for user |
| POST | /api/projects | Admin | Create project |
| GET | /api/projects/:id | Auth | Get project + tasks + members |
| DELETE | /api/projects/:id | Admin | Delete project |
| POST | /api/projects/:id/members | Admin | Add member by email |
| DELETE | /api/projects/:id/members/:userId | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/tasks/dashboard | Auth | Get dashboard stats |
| GET | /api/tasks/project/:projectId | Auth | Get tasks for project |
| POST | /api/tasks/project/:projectId | Admin | Create task |
| PATCH | /api/tasks/:id | Auth | Update task (status/details) |
| DELETE | /api/tasks/:id | Admin | Delete task |

---

## Database Schema

```
User         — id, name, email, password, role (ADMIN/MEMBER)
Project      — id, name, description, adminId
ProjectMember— projectId, userId (join table)
Task         — id, title, description, status, dueDate, projectId, assigneeId
```

---

## Deployment (Railway)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_URL`
5. Add to `package.json` scripts: `"start": "node src/index.js"`
6. Railway runs `npm install` then `npm start` automatically
7. Run migrations: add `"postinstall": "prisma generate && prisma migrate deploy"` to server package.json

Deploy frontend to Vercel:
1. Import GitHub repo → set root to `client`
2. Set `VITE_API_URL` to your Railway backend URL

---

## Project Structure

```
team-task-manager/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   └── taskController.js
│       ├── middleware/
│       │   └── auth.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── projects.js
│       │   └── tasks.js
│       ├── lib/
│       │   └── prisma.js
│       └── index.js
└── client/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── ProjectDetail.jsx
```
