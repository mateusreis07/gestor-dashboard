# Backend Migration: Node.js + Supabase + Prisma

## Overview
Migrate the current LocalStorage-based data persistence to a robust backend infrastructure using Node.js, Prisma ORM, and Supabase (PostgreSQL). This will enable multi-user support, data persistence across devices, and better scalability.

## Project Type
- **BACKEND** (Primary)
- **WEB** (Integration)

## Success Criteria
- [ ] Node.js server running with Express/Fastify.
- [ ] Supabase PostgreSQL database connected via Prisma.
- [ ] Database schema matches current data models (Team, Ticket, Chamado, Manager).
- [ ] API endpoints created for Authentication, Teams, and Data Management.
- [ ] Frontend successfully communicates with Backend (No more LocalStorage for core data).

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js (Simple, robust, widely used)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma (Type-safe database access)
- **Language**: TypeScript

## File Structure
```
/
├── server/                 # New Backend Directory
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
└── src/                    # Existing Frontend
    └── services/           # New API Service layer
```

## Task Breakdown

### Phase 1: Backend Setup & Database Design
- [ ] **Setup Server Project**: Initialize `server/` with `package.json`, `tsconfig.json`, and basic Express app. (Agent: backend-specialist)
- [ ] **Configure Prisma**: Initialize Prisma, connect to Supabase (User must provide URL), and define `schema.prisma`. (Agent: database-architect)
- [ ] **Run Migrations**: Apply initial schema to Supabase. (Agent: database-architect)

### Phase 2: API Implementation
- [ ] **Auth API**: Implement `/api/auth/login` (Admin & Team) and `/api/auth/register` (Admin). (Agent: backend-specialist)
- [ ] **Teams API**: CRUD for Teams (`/api/teams`). (Agent: backend-specialist)
- [ ] **Data API**: Endpoints to save/load Tickets, Chamados, and Monthly Stats. (Agent: backend-specialist)

### Phase 3: Frontend Integration
- [ ] **API Client**: Create `src/services/api.ts` to replace `storage.ts` logic. (Agent: frontend-specialist)
- [ ] **Update AuthContext**: Switch from LocalStorage auth to API-based auth (JWT or Session). (Agent: frontend-specialist)
- [ ] **Update Dashboards**: Replace `loadTeamTickets`, `saveMonthData`, etc., with async API calls. (Agent: frontend-specialist)

### Phase 4: Migration & Verification
- [ ] **Data Migration Script**: Optional script to dump LocalStorage to JSON and push to API (One-time run). (Agent: script-writer)
- [ ] **Verification**: Full E2E test of login, data import, and dashboard visualization. (Agent: test-engineer)

## Phase X: Verification Checklist
- [ ] Server starts without errors.
- [ ] Prisma Studio shows correct schema.
- [ ] Frontend authenticates against real DB.
- [ ] Data persists after page refresh/browser clear.
