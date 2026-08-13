# Athlete Tracker

Smart Athlete Performance & Management System — a full-stack MERN (TypeScript) app for managing athletes, tracking performance, handling fees/payments, and organizing events, with role-based access for Admins, Coaches, and Athletes.

## Features

- **Authentication** — JWT access + refresh tokens, role-based access control (Admin / Coach / Athlete)
- **Athlete management** — add, edit, search, and filter athlete profiles with photo uploads
- **Performance tracking** — record and analyze performance data over time
- **Fees & payments** — track payment status per athlete, manage fee records
- **Events** — create and manage events athletes can be linked to
- **Dashboard** — summary stats for admins/coaches
- **Real-time notifications** — via Socket.IO
- **Email** — password reset emails via Nodemailer

## Tech Stack

**Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.IO, JWT, Winston (logging), Jest (testing)

**Frontend:** React, TypeScript, React Router, Axios, Tailwind CSS, Recharts, Socket.IO client

## Project Structure

```
athlete-tracker-mern/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   └── server.ts
│   └── reset-admin.js
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── services/
    └── public/
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a connection URI

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd athlete-tracker-mern
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env` with real values — at minimum set `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` (generate your own random secrets, don't reuse the example values).

Seed the database with an initial admin and coach account:

```bash
npm run seed
```

Start the backend in dev mode:

```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
npm start
```

App runs on `http://localhost:3000` by default.

### Default seeded credentials

| Role  | Username         | Password    |
|-------|------------------|-------------|
| Admin | admin            | Admin@1234  |
| Coach | coach_sudhersun  | Coach@1234  |

Change these immediately after first login.

## Available Scripts

**Backend** (`backend/`)
- `npm run dev` — start with hot reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled build
- `npm run seed` — seed initial admin/coach and settings
- `npm test` — run test suite

**Frontend** (`frontend/`)
- `npm start` — start dev server
- `npm run build` — production build

## Notes

- `reset-admin.js` (`node reset-admin.js` from `backend/`) lists all users and resets the admin password if you get locked out.
- Uploaded athlete photos are stored in `backend/uploads/` (not committed to the repo).
