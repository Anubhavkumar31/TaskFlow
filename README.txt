TaskFlow - Team Task Manager
=============================

Live App: https://taskflow-production-7266.up.railway.app/login
GitHub: https://github.com/Anubhavkumar31/TaskFlow.git


What I built
------------
A full-stack team task management app where users can create projects,
invite team members, assign tasks, and track progress on a Kanban board.
Think simplified Trello — with role-based access so Admins and Members
have different permissions.


Demo accounts (already seeded)
-------------------------------
Admin   → admin@demo.com  / admin123
Member  → alice@demo.com  / member123
Member  → bob@demo.com    / member123

Log in as Admin to see the full experience — creating projects, adding
members, creating and assigning tasks. Then try a Member account to see
the restricted view.


Tech stack
----------
Frontend  — React 18, Vite, Tailwind CSS, React Router v6, Axios
Backend   — Node.js, Express, Zod for validation
Database  — PostgreSQL with Prisma ORM
Auth      — JWT + bcryptjs
Deployed  — Railway (backend, frontend, and database all on Railway)


How to run locally
------------------
You'll need Node.js 18+ and a PostgreSQL database.

1. Clone the repo
   git clone https://github.com/Anubhavkumar31/TaskFlow.git
   cd team-task-manager

2. Set up the backend
   cd server
   npm install

   Create a .env file inside server/:
     DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
     JWT_SECRET="any-secret-string"
     PORT=5000
     CLIENT_URL="http://localhost:5173"

   npx prisma migrate dev --name init
   npm run db:seed
   npm run dev

3. Set up the frontend (new terminal)
   cd client
   npm install

   Create a .env file inside client/:
     VITE_API_URL=http://localhost:5000/api

   npm run dev

4. Open http://localhost:5173


Deployment
----------
Everything is hosted on Railway. The PostgreSQL database is a Railway
plugin, so DATABASE_URL is auto-injected. The backend runs via
"node src/index.js" and Prisma generates the client on postinstall.
Frontend is also served through Railway after building with Vite.

Environment variables on Railway:
  DATABASE_URL  — auto-provided by Railway Postgres
  JWT_SECRET    — set manually in Railway dashboard
  CLIENT_URL    — frontend Railway URL


What each role can do
---------------------
Admin  — create projects, add/remove members, create/assign/delete tasks,
         mark projects as complete or on hold

Member — view projects they've been added to, update the status of tasks
         assigned to them (nothing else)

Access control is enforced on the backend, not just hidden in the UI.


API overview
------------
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me

GET   /api/projects
POST  /api/projects
GET   /api/projects/:id
POST  /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
DELETE /api/projects/:id

GET   /api/tasks/dashboard
GET   /api/tasks/project/:projectId
POST  /api/tasks/project/:projectId
PATCH /api/tasks/:id
DELETE /api/tasks/:id