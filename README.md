# CatCare UTM — Campus Cat Management System

A comprehensive web application for managing campus cats and emergency reports at Universiti Teknologi Malaysia (UTM).

## Team Members

| Member | Module | Folder |
|--------|--------|--------|
| Layth Amgad | CCU-S1-01: Authentication | `backend/src/Layth_Amgad-CCU-S1-01-Auth/` |
| Loai Rafaat | CCU-S1-02: Cat Management | `backend/src/Loai_Rafaat-CCU-S1-02-Cats/` |
| Youssef Mostafa | CCU-S1-03: Emergency Reports | `backend/src/Youssef_Mostafa-CCU-S1-03-Emergencies/` |
| Mohamed Abdelgawwad | CCU-S1-04: Foundation | `backend/src/Mohamed_Abdelgawwad-CCU-S1-04-Foundation/` + `frontend/src/lib/`, `frontend/src/components/` |

## Project Structure

```
catcare-utm/
├── backend/                 # Express.js + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── Layth_Amgad-CCU-S1-01-Auth/       # Auth (login, register, JWT)
│   │   ├── Loai_Rafaat-CCU-S1-02-Cats/        # Cat CRUD + photo upload
│   │   ├── Youssef_Mostafa-CCU-S1-03-Emergencies/ # Emergency reports
│   │   ├── Mohamed_Abdelgawwad-CCU-S1-04-Foundation/ # Shared (DB, env, errors, middleware)
│   │   └── server.ts
│   ├── catcare-full-setup.sql
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # UI components (auth, layout, cats, emergencies, dashboard, profile)
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # API client, store, types, mock data
│   ├── public/              # Static assets (logo.svg)
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

## Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Render)
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Logging:** Pino
- **Security:** Helmet, CORS, Rate Limiting

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Animations:** Framer Motion
- **HTTP Client:** Native fetch
- **Notifications:** Sonner

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@utm.my | password123 |
| Student | student@graduate.utm.my | password123 |

## Deployment

### Backend (Render)
- **URL:** https://catcare-backend.onrender.com
- **Database:** Render PostgreSQL (Free Tier)
- **Build Command:** `npm install --include-dev && npm run build`
- **Start Command:** `node dist/server.js`

### Frontend (Vercel)
- **URL:** https://catcare-frontend-inky.vercel.app
- **Framework Preset:** Next.js
- **Connected to:** GitHub repo

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your database credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/cats | No | List cats (paginated) |
| GET | /api/cats/:id | No | Get cat by ID |
| POST | /api/cats | Yes | Create cat (with photo upload) |
| GET | /api/emergencies | No | List emergencies (paginated) |
| GET | /api/emergencies/:id | No | Get emergency by ID |
| POST | /api/emergencies | Yes | Report emergency |
| PATCH | /api/emergencies/:id/status | Yes | Update emergency status |
| GET | /api/emergencies/priority-feed | No | Priority-sorted emergencies |
