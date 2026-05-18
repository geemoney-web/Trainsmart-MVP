# Phase 1: Foundation & RTO Dashboard - Research

**Researched:** 2026-05-18
**Domain:** Monorepo scaffolding, NestJS + Prisma + PostgreSQL, JWT auth, Next.js + shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** NestJS (TypeScript) backend
- **D-02:** Prisma as the ORM with PostgreSQL
- **D-03:** Single monorepo: `apps/web` (Next.js) + `apps/api` (NestJS)
- **D-04:** All API routes prefixed `/api/v1/*` from day one
- **D-05:** In-house JWT auth with NestJS Passport — email/password, JWT access + refresh tokens, no external auth service
- **D-06:** Backend generates presigned S3 URLs; frontend uploads directly to object storage (Phase 6+, schema must support it)
- **D-07:** Cards grid layout for the RTO dashboard (not table rows)
- **D-08:** Each RTO card shows: RTO name, ASQA code, operating states, traffic-light status badge, unresolved alert count, upcoming validations count
- **D-09:** Traffic-light status badge is hidden in Phase 1 (Phase 5 feature only)
- **D-10:** All 8 workspace tabs present from day one (empty stubs): Qualifications, Trainers, TAS, Validations, Documents, Tasks, Alerts, Notes
- **D-11:** shadcn/ui (Radix UI + Tailwind) as the component system
- **D-12:** Dark sidebar layout — dark left navigation, light content area
- **D-13:** TanStack Query (React Query) for all server state; React context for local UI state only

### Claude's Discretion
- Exact Prisma schema field names and indexes (follow: UUID PKs, snake_case, timestamps, soft delete with `deleted_at`)
- NestJS module structure (one module per domain: RTO, Auth, User)
- JWT token expiry durations (access: 15m, refresh: 7d is sensible default)
- shadcn/ui theme colour tokens — dark sidebar colour palette
- Card grid responsive breakpoints

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RTO-01 | Staff can create a new RTO profile with name, identifiers, contacts, and operating states | Prisma schema design, NestJS CRUD module pattern, React Hook Form + Zod validation |
| RTO-02 | Creating an RTO automatically provisions default folders, compliance registers, validation schedules, documents area, and task area | NestJS service lifecycle hook, Prisma transaction for atomic provisioning |
| RTO-03 | Staff can view a list of all RTOs on the main dashboard | TanStack Query list fetching, card grid component pattern |
| RTO-04 | Each RTO has an isolated workspace containing qualifications, units, TAS, trainers, validations, documents, tasks, notes, and alerts | Next.js nested routing, tab navigation with URL-based state |
| DASH-01 | Dashboard displays all RTOs with traffic-light compliance status (placeholder in Phase 1) | Card component with status_color field stub, hidden badge per D-09 |
| DASH-02 | Dashboard shows unresolved alert count per RTO | Prisma relation count, aggregated in API response |
| DASH-03 | Dashboard shows upcoming validation deadlines across all RTOs | Prisma date range query, separate dashboard endpoint |
| DASH-04 | Dashboard shows superseded qualifications requiring attention | Placeholder count in Phase 1 (data model ready, no sync yet) |
| DASH-05 | Dashboard shows TAS review items due | Placeholder count in Phase 1 (TAS model stubbed) |
| DASH-06 | Dashboard shows trainer compliance alerts | Placeholder count in Phase 1 (trainer model stubbed) |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire technical foundation for the TrainSmart platform: a pnpm + Turborepo monorepo containing a NestJS API and a Next.js frontend, wired to PostgreSQL via Prisma. The primary deliverable is a working dashboard that lists RTOs as cards and an RTO workspace shell with 8 tabbed sections — all data-model scaffolding for future phases must be present from day one.

The stack is well-understood and mature. NestJS 11, Prisma 7, Next.js 16, and shadcn/ui 4 are all active and recently updated (all modified within the last 90 days as of research date). The recommended monorepo structure places Prisma in a dedicated `packages/database` package, exported as `@repo/db`, consumed by `apps/api`. shadcn/ui's built-in Sidebar component (added late 2024) handles the dark sidebar layout pattern natively. TanStack Query v5 requires a client-side providers wrapper (`use client`) and a `HydrationBoundary` per route for SSR prefetching.

The one environmental gap to note: `pnpm` and `docker` are not currently installed on the development machine. These are required for monorepo development and local PostgreSQL, respectively. The plan must include setup tasks for both before any app code is written.

**Primary recommendation:** Scaffold with `create-turbo@latest`, then add NestJS under `apps/api` and Next.js under `apps/web`, with Prisma isolated in `packages/database`. Use database-level UUID generation (`gen_random_uuid()`) with `@db.Uuid` throughout the schema. Use two Passport strategies (AccessTokenStrategy + RefreshTokenStrategy) with access tokens in Authorization headers and refresh tokens in httpOnly cookies.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JWT authentication & token issuance | API (NestJS) | — | Tokens must be issued server-side; no client logic handles secrets |
| Refresh token storage (hashed) | Database (PostgreSQL) | — | Refresh tokens stored hashed per user row for revocation capability |
| RTO CRUD operations | API (NestJS) | — | Business logic, validation, and relational integrity live in API |
| Workspace auto-provisioning on RTO create | API (NestJS) | — | Atomic Prisma transaction; no client involvement |
| RTO dashboard card grid | Frontend (Next.js client) | API (NestJS) | Client renders cards; API provides aggregated counts per RTO |
| Dashboard aggregate counts (alerts, validations) | API (NestJS) | Database | Counts computed via Prisma `_count` relations or raw aggregation |
| Workspace tab routing | Frontend (Next.js App Router) | — | URL segment per tab (`/rto/[id]/qualifications`) |
| Dark sidebar navigation | Frontend (Next.js, client component) | — | shadcn Sidebar component runs client-side (state, cookies) |
| Prisma schema + migrations | Database package (`packages/database`) | — | Single source of truth for schema; shared to API |
| PostgreSQL connection pooling | API (NestJS PrismaService) | — | Singleton PrismaClient per process |
| Form validation (create RTO modal) | Frontend (React Hook Form + Zod) | API (class-validator) | Client validates UX; API validates trust boundary |
| API route prefix `/api/v1/*` | API (NestJS global prefix) | — | Set once in `main.ts` with `app.setGlobalPrefix('api/v1')` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/core` | 11.1.21 | NestJS application core | Official NestJS framework core; actively maintained by NestJS team [VERIFIED: npm registry] |
| `@nestjs/common` | 11.1.21 | Decorators, pipes, guards, interceptors | Ships with NestJS; required for all modules [VERIFIED: npm registry] |
| `@nestjs/platform-express` | 11.1.21 | Express HTTP adapter for NestJS | Default adapter; well-tested, cookie-parser compatible [VERIFIED: npm registry] |
| `prisma` (CLI) | 7.8.0 | Prisma schema management and migrations | Schema-first ORM with migration tooling; PostgreSQL first-class [VERIFIED: npm registry] |
| `@prisma/client` | 7.8.0 | Type-safe database client | Generated from schema; fully typed queries [VERIFIED: npm registry] |
| `next` | 16.2.6 | React framework (App Router) | Locked decision D-03; App Router is the current standard [VERIFIED: npm registry] |
| `react` | 19.x | UI library | Required by Next.js 16 [VERIFIED: npm registry] |
| `turbo` | 2.9.14 | Monorepo task orchestration | Vercel-maintained; standard for pnpm workspaces monorepos [VERIFIED: npm registry] |

### Authentication

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/passport` | 11.0.5 | Passport.js integration for NestJS | Official NestJS package; strategy + guard pattern [VERIFIED: npm registry] |
| `@nestjs/jwt` | 11.0.2 | JWT signing and verification for NestJS | Official NestJS package; wraps jsonwebtoken [VERIFIED: npm registry] |
| `passport` | latest | Authentication middleware | Peer dependency of @nestjs/passport [VERIFIED: npm registry] |
| `passport-jwt` | 4.0.1 | JWT extraction strategy for Passport | Standard JWT strategy used across NestJS ecosystem [VERIFIED: npm registry] |
| `bcryptjs` | 3.0.3 | Password hashing | Pure JS bcrypt; no native build dependencies (simpler than `bcrypt`) [VERIFIED: npm registry] |

### Validation & Config

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `class-validator` | 0.15.1 | DTO validation decorators | NestJS recommended; integrates with ValidationPipe [VERIFIED: npm registry] |
| `class-transformer` | 0.5.1 | DTO serialization/deserialization | Required alongside class-validator for NestJS pipes [VERIFIED: npm registry] |
| `@nestjs/config` | 4.0.4 | Environment variable management | Official NestJS config module; ConfigService + validation [VERIFIED: npm registry] |
| `zod` | 4.4.3 | Frontend schema validation | Pairs with React Hook Form for client-side form validation [VERIFIED: npm registry] |
| `react-hook-form` | 7.76.0 | Form state management | Industry standard; minimal re-renders, Zod integration [VERIFIED: npm registry] |
| `@hookform/resolvers` | 5.2.2 | Connects React Hook Form to Zod | Required bridge between the two libraries [VERIFIED: npm registry] |

### UI

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `shadcn` (CLI) | 4.7.0 | shadcn/ui component scaffolding | Copies components into project — zero vendor lock-in (D-11) [VERIFIED: npm registry] |
| `tailwindcss` | 4.3.0 | Utility CSS framework | Required by shadcn/ui [VERIFIED: npm registry] |
| `lucide-react` | 1.16.0 | Icon library | Default icons used by shadcn/ui components [VERIFIED: npm registry] |
| `@tanstack/react-query` | 5.100.10 | Server state management | Locked decision D-13; v5 is current major [VERIFIED: npm registry] |

### Security & Middleware

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `helmet` | 8.1.0 | HTTP security headers for Express/NestJS | OWASP-recommended; one-line setup in NestJS `main.ts` [VERIFIED: npm registry] |
| `cookie-parser` | 1.4.7 | Cookie parsing middleware for Express | Required for httpOnly refresh token cookies [VERIFIED: npm registry] |
| `cors` | 2.8.6 | CORS middleware | Required for cross-origin requests from Next.js to NestJS API [VERIFIED: npm registry] |

### API Documentation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/swagger` | 11.4.3 | OpenAPI/Swagger documentation | Recommended for internal API documentation; auto-generates from decorators [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `bcryptjs` | `bcrypt` | `bcrypt` requires native build (node-gyp); `bcryptjs` is pure JS, simpler CI/CD |
| `turbo` | Nx | Turborepo is lighter for 2-app monorepos; Nx better for large enterprise mono repos with many shared libs |
| `zod` (frontend only) | `class-validator` on frontend too | Zod is cleaner for React; class-validator is ideal for NestJS DTO layer |
| `@nestjs/platform-express` | `@nestjs/platform-fastify` | Fastify is faster but cookie-parser and some middleware differ; Express is the safe default |

**Installation (monorepo root):**
```bash
# Install pnpm globally first
npm install -g pnpm

# Create monorepo
pnpm dlx create-turbo@latest trainsmart --package-manager pnpm

# apps/api — NestJS
cd apps/api && pnpm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/passport @nestjs/jwt @nestjs/config @nestjs/swagger passport passport-jwt bcryptjs class-validator class-transformer helmet cookie-parser cors reflect-metadata rxjs

# apps/web — Next.js (already created by create-turbo or create-next-app)
cd apps/web && pnpm install @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add sidebar card badge button dialog form input label tabs

# packages/database — Prisma
mkdir -p packages/database && cd packages/database
pnpm install prisma @prisma/client
```

**Version verification:** All versions above confirmed against npm registry on 2026-05-18.

---

## Package Legitimacy Audit

> Note: slopcheck ran against PyPI (Python registry) due to tool behavior — this is the documented cross-ecosystem confusion pitfall. All packages flagged [SLOP] by slopcheck were PyPI false positives. Manual verification was performed against the npm registry.

| Package | Registry | Age | Source Repo | npm Modified | Disposition |
|---------|----------|-----|-------------|-------------|-------------|
| `@nestjs/core` | npm | ~8 yrs | github.com/nestjs/nest | 2026-05-14 | Approved [VERIFIED: npm registry] |
| `@nestjs/common` | npm | ~8 yrs | github.com/nestjs/nest | 2026-05-14 | Approved [VERIFIED: npm registry] |
| `@nestjs/platform-express` | npm | ~8 yrs | github.com/nestjs/nest | 2026-05-14 | Approved [VERIFIED: npm registry] |
| `@nestjs/passport` | npm | ~7 yrs | github.com/nestjs/passport | 2025-01-23 | Approved [VERIFIED: npm registry] |
| `@nestjs/jwt` | npm | ~7 yrs | github.com/nestjs/jwt | 2025-12-05 | Approved [VERIFIED: npm registry] |
| `@nestjs/config` | npm | ~6 yrs | github.com/nestjs/config | 2026-04-09 | Approved [VERIFIED: npm registry] |
| `@nestjs/swagger` | npm | ~7 yrs | github.com/nestjs/swagger | 2026-05-14 | Approved [VERIFIED: npm registry] |
| `prisma` | npm | ~5 yrs | github.com/prisma/prisma | 2026-05-15 | Approved [VERIFIED: npm registry] |
| `@prisma/client` | npm | ~5 yrs | github.com/prisma/prisma | 2026-05-15 | Approved [VERIFIED: npm registry] |
| `passport-jwt` | npm | ~10 yrs | github.com/mikenicholson/passport-jwt | 2025-01-10 | Approved [VERIFIED: npm registry] |
| `bcryptjs` | npm | ~10 yrs | github.com/dcodeIO/bcrypt.js | 2026-04-24 | Approved [VERIFIED: npm registry] |
| `class-validator` | npm | ~8 yrs | github.com/typestack/class-validator | 2026-02-26 | Approved [VERIFIED: npm registry] |
| `class-transformer` | npm | ~8 yrs | github.com/typestack/class-transformer | 2022-12-09 | Approved — stable, no active churn needed [VERIFIED: npm registry] |
| `next` | npm | ~10 yrs | github.com/vercel/next.js | 2026-05-17 | Approved [VERIFIED: npm registry] |
| `@tanstack/react-query` | npm | ~6 yrs | github.com/TanStack/query | 2026-05-11 | Approved [VERIFIED: npm registry] |
| `shadcn` | npm | ~3 yrs | github.com/shadcn-ui/ui | 2026-05-05 | Approved [VERIFIED: npm registry] |
| `tailwindcss` | npm | ~8 yrs | github.com/tailwindlabs/tailwindcss | 2026-02-05 | Approved [VERIFIED: npm registry] |
| `lucide-react` | npm | ~4 yrs | github.com/lucide-icons/lucide | 2026-05-14 | Approved [VERIFIED: npm registry] |
| `react-hook-form` | npm | ~6 yrs | github.com/react-hook-form/react-hook-form | 2026-05-16 | Approved [VERIFIED: npm registry] |
| `zod` | npm | ~5 yrs | github.com/colinhacks/zod | 2026-05-05 | Approved [VERIFIED: npm registry] |
| `helmet` | npm | ~10 yrs | github.com/helmetjs/helmet | 2026-04-24 | Approved [VERIFIED: npm registry] |
| `cookie-parser` | npm | ~12 yrs | github.com/expressjs/cookie-parser | 2024-10-08 | Approved [VERIFIED: npm registry] |
| `cors` | npm | ~10 yrs | github.com/expressjs/cors | 2026-01-22 | Approved [VERIFIED: npm registry] |
| `turbo` | npm | ~4 yrs | github.com/vercel/turborepo | 2026-05-16 | Approved [VERIFIED: npm registry] |
| `@hookform/resolvers` | npm | ~5 yrs | github.com/react-hook-form/resolvers | 2026-04-30 | Approved [VERIFIED: npm registry] |

**Packages removed due to slopcheck [SLOP] verdict:** none — all SLOP flags were PyPI false positives for npm packages.
**Packages flagged as suspicious [SUS]:** none.
**Postinstall scripts reviewed:** `@nestjs/core` has `opencollective || exit 0` (telemetry opt-in, safe). `prisma` and `turbo` have no suspicious postinstall scripts.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Staff)
     |
     | HTTPS
     v
Next.js App Router (apps/web)
  - layout.tsx        — SidebarProvider + dark sidebar wrapper
  - /                 — Dashboard (RTO card grid)
  - /rto/[id]/[tab]   — RTO Workspace (tabbed shell)
  - providers.tsx     — QueryClientProvider ('use client')
     |
     | REST /api/v1/* (fetch via TanStack Query)
     v
NestJS API (apps/api)
  - AuthModule        — POST /api/v1/auth/login, /refresh, /logout
  - RtoModule         — GET/POST/PATCH/DELETE /api/v1/rtos
  - UsersModule       — internal user management
  - GlobalJwtGuard    — protects all routes except /auth/login
     |
     | Prisma Client
     v
packages/database
  - schema.prisma     — single source of truth
  - PrismaService     — singleton client exported to API
     |
     | TCP 5432
     v
PostgreSQL
  - UUID PKs (gen_random_uuid())
  - Soft deletes (deleted_at)
  - Timestamps (created_at, updated_at)
```

### Recommended Project Structure

```
trainsmart/
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/               # AuthModule: login, refresh, strategies, guards
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── access-token.strategy.ts
│   │   │   │   │   └── refresh-token.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       ├── access-token.guard.ts
│   │   │   │       └── refresh-token.guard.ts
│   │   │   ├── rto/                # RtoModule: CRUD + workspace provisioning
│   │   │   │   ├── rto.module.ts
│   │   │   │   ├── rto.service.ts
│   │   │   │   ├── rto.controller.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-rto.dto.ts
│   │   │   │       └── update-rto.dto.ts
│   │   │   ├── users/              # UsersModule: internal user lookup
│   │   │   ├── prisma/             # PrismaService (re-exports from packages/database)
│   │   │   ├── common/             # Shared pipes, decorators, interceptors
│   │   │   └── main.ts             # Bootstrap: global prefix, guards, helmet, cors
│   │   ├── test/
│   │   └── package.json
│   └── web/                        # Next.js frontend
│       ├── app/
│       │   ├── layout.tsx          # Root layout with SidebarProvider
│       │   ├── (auth)/
│       │   │   └── login/page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx      # Dashboard shell with dark sidebar
│       │   │   ├── page.tsx        # RTO dashboard card grid
│       │   │   └── rto/
│       │   │       └── [id]/
│       │   │           └── [tab]/
│       │   │               └── page.tsx  # RTO workspace (tab router)
│       ├── components/
│       │   ├── ui/                 # shadcn/ui generated components
│       │   ├── layout/
│       │   │   ├── app-sidebar.tsx # Dark sidebar with navigation
│       │   │   └── providers.tsx   # QueryClientProvider ('use client')
│       │   └── rto/
│       │       ├── rto-card.tsx    # RTO dashboard card
│       │       └── rto-workspace.tsx
│       ├── lib/
│       │   ├── api.ts              # Fetch wrapper for /api/v1/*
│       │   └── query-client.ts     # makeQueryClient singleton factory
│       └── package.json
├── packages/
│   └── database/                   # Shared Prisma package
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   ├── client.ts           # PrismaClient singleton
│       │   └── index.ts            # Re-exports client + generated types
│       └── package.json            # name: "@repo/db"
├── pnpm-workspace.yaml
├── turbo.json
└── package.json                    # Root: "packageManager": "pnpm@x.x.x"
```

### Pattern 1: Prisma Schema — Core RTO Entities

**What:** Database schema for RTOs with UUID PKs, soft deletes, and relation stubs for future phases.
**When to use:** Week 1, before any API code. Schema is the foundation.

```prisma
// Source: [CITED: prisma.io/docs/orm/reference/prisma-schema-reference] + [CITED: wanago.io/2024/01/01/api-nestjs-uuid-prisma-postgresql/]

generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email          String    @unique
  password_hash  String
  full_name      String
  refresh_token  String?   // stored hashed; null = logged out
  created_at     DateTime  @default(now()) @db.Timestamptz
  updated_at     DateTime  @updatedAt @db.Timestamptz
  deleted_at     DateTime? @db.Timestamptz

  @@index([email])
  @@map("users")
}

model Rto {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String
  asqa_code        String    @unique
  operating_states String[]  // e.g. ["NSW", "VIC"]
  contact_name     String?
  contact_email    String?
  contact_phone    String?
  status_color     String    @default("gray") // "green"|"amber"|"red"|"gray" — computed in Phase 5
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @updatedAt @db.Timestamptz
  deleted_at       DateTime? @db.Timestamptz

  // Relation stubs — populated by future phases
  qualifications   RtoQualification[]
  trainers         Trainer[]
  tas_documents    TasDocument[]
  validations      Validation[]
  documents        Document[]
  tasks            Task[]
  alerts           ComplianceAlert[]
  notes            Note[]

  @@index([asqa_code])
  @@index([deleted_at]) // fast soft-delete filter
  @@map("rtos")
}

// Minimal stubs for foreign key integrity — fleshed out in later phases
model RtoQualification {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("rto_qualifications")
}

model Trainer {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  full_name  String
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("trainers")
}

model TasDocument {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("tas_documents")
}

model Validation {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto          Rto       @relation(fields: [rto_id], references: [id])
  rto_id       String    @db.Uuid
  planned_date DateTime? @db.Timestamptz
  status       String    @default("Scheduled")
  created_at   DateTime  @default(now()) @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz
  @@map("validations")
}

model Document {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  file_key   String    // S3 object key — never store file bytes in DB
  file_name  String
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("documents")
}

model Task {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  title      String
  status     String    @default("Open")
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("tasks")
}

model ComplianceAlert {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  resolved   Boolean   @default(false)
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("compliance_alerts")
}

model Note {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  content    String
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("notes")
}
```

### Pattern 2: NestJS JWT Auth — Two-Strategy Setup

**What:** AccessTokenStrategy guards all routes; RefreshTokenStrategy guards `/auth/refresh` only.
**When to use:** Authentication module setup.

```typescript
// Source: [CITED: elvisduru.com/blog/nestjs-jwt-authentication-refresh-token]

// strategies/access-token.strategy.ts
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }
  async validate(payload: JwtPayload) {
    return payload; // attached to req.user
  }
}

// strategies/refresh-token.strategy.ts
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }
  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
    return { ...payload, refreshToken };
  }
}

// guards/access-token.guard.ts
@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {}

// guards/refresh-token.guard.ts
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
```

```typescript
// auth.service.ts — token issuance
async getTokens(userId: string, email: string) {
  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(
      { sub: userId, email },
      { secret: this.configService.get('JWT_ACCESS_SECRET'), expiresIn: '15m' }
    ),
    this.jwtService.signAsync(
      { sub: userId, email },
      { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }
    ),
  ]);
  return { accessToken, refreshToken };
}

async updateRefreshToken(userId: string, refreshToken: string) {
  const hashed = await bcrypt.hash(refreshToken, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { refresh_token: hashed },
  });
}
```

### Pattern 3: NestJS main.ts Bootstrap

```typescript
// Source: [CITED: docs.nestjs.com/security/authentication]
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());
  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // required for cookies
  });

  // Global JWT guard — all routes protected except those with @Public() decorator
  app.useGlobalGuards(app.get(AccessTokenGuard));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,        // auto-transform query params to typed DTOs
  }));

  await app.listen(3001);
}
```

### Pattern 4: shadcn/ui Dark Sidebar Layout

```typescript
// Source: [CITED: ui.shadcn.com/docs/components/sidebar]

// app/(dashboard)/layout.tsx
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </SidebarProvider>
  );
}

// components/layout/app-sidebar.tsx
// shadcn Sidebar uses CSS variables for dark mode:
// --sidebar-background: 240 5.9% 10%   (dark)
// --sidebar-foreground: 240 4.8% 95.9% (light text)
// Set variant="sidebar" and the dark class on the html element
```

### Pattern 5: TanStack Query v5 — App Router Providers

```typescript
// Source: [CITED: tanstack.com/query/v5/docs/react/guides/advanced-ssr]

// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 60 seconds
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client per request
    return makeQueryClient();
  }
  // Browser: reuse the same client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// components/layout/providers.tsx
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// app/layout.tsx — wrap with Providers
import { Providers } from '@/components/layout/providers';
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pattern 6: RTO Workspace Tab Routing

**What:** URL segment-based tab routing so each tab is directly linkable and bookmarkable.
**When to use:** RTO workspace at `/rto/[id]/[tab]`.

```typescript
// Source: [CITED: dev.to/yinks/how-to-make-radix-ui-tabs-url-based-in-nextjs]

// app/(dashboard)/rto/[id]/[tab]/page.tsx
const TABS = ['qualifications', 'trainers', 'tas', 'validations',
               'documents', 'tasks', 'alerts', 'notes'] as const;

export default function RtoWorkspacePage({
  params: { id, tab }
}: { params: { id: string; tab: string } }) {
  return (
    <Tabs value={tab}>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t} value={t} asChild>
            <Link href={`/rto/${id}/${t}`}>{capitalize(t)}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={tab}>
        {/* Tab stub — populated in later phases */}
        <p className="text-muted-foreground">
          {capitalize(tab)} — coming in a future phase
        </p>
      </TabsContent>
    </Tabs>
  );
}

// Default redirect: /rto/[id] → /rto/[id]/qualifications
// app/(dashboard)/rto/[id]/page.tsx
import { redirect } from 'next/navigation';
export default function RtoIndexPage({ params: { id } }) {
  redirect(`/rto/${id}/qualifications`);
}
```

### Pattern 7: Turborepo + pnpm Workspace Config

```yaml
# pnpm-workspace.yaml
# Source: [CITED: turborepo.dev/docs/crafting-your-repository/structuring-a-repository]
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "dependsOn": ["db:generate"],
      "persistent": true,
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

```json
// packages/database/package.json
{
  "name": "@repo/db",
  "version": "0.0.1",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@prisma/client": "^7.8.0"
  },
  "devDependencies": {
    "prisma": "^7.8.0"
  }
}
```

```typescript
// packages/database/src/index.ts
// Source: [CITED: prisma.io/docs/guides/deployment/turborepo]
export { prisma } from './client';
export * from '../generated/client';

// packages/database/src/client.ts
import { PrismaClient } from '../generated/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Anti-Patterns to Avoid

- **Storing refresh tokens in localStorage:** Exposes to XSS. Use httpOnly cookies or hashed storage in DB.
- **Global NestJS guard with no Public decorator escape hatch:** Every route will be protected including login. Add `@Public()` decorator pattern for the auth controller.
- **Importing apps/api directly from apps/web:** Never cross-import between apps. Communication is HTTP only.
- **Running Prisma migrate through PgBouncer:** Prisma migrations use direct connections; if PgBouncer is added later, keep a `DIRECT_URL` env var for migrations [CITED: prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer].
- **UUID generation in Prisma application layer only:** Use `@default(dbgenerated("gen_random_uuid()")) @db.Uuid` not `@default(uuid())` — the former stores as native UUID type (16 bytes) not TEXT (variable) [CITED: wanago.io/2024/01/01/api-nestjs-uuid-prisma-postgresql].
- **Putting sidebar state in URL or Zustand:** shadcn SidebarProvider handles sidebar open/closed state via cookies natively. No custom state management needed.
- **Plural table names vs. Prisma model names:** Use `@@map("rtos")` to control PostgreSQL table name independently of Prisma model name.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing & verification | Custom crypto code | `@nestjs/jwt` wrapping `jsonwebtoken` | Token expiry, algorithm selection, secret rotation are edge-case-heavy |
| Password hashing | `crypto.createHash` | `bcryptjs` | bcrypt includes salt; SHA is not appropriate for passwords |
| HTTP security headers | Manual header setting | `helmet` | 15+ security headers including CSP, HSTS, X-Frame-Options |
| DTO validation | Manual `if` checks | `class-validator` + NestJS `ValidationPipe` | Handles nested objects, custom constraints, transform/strip |
| Sidebar component | Custom drawer component | shadcn Sidebar | Cookie persistence, mobile sheet fallback, keyboard shortcut already built in |
| Form validation | Custom validation logic | `react-hook-form` + `zod` | Error state, async validation, submission handling — substantial complexity |
| Environment validation | Manual `process.env` reads | `@nestjs/config` with Joi/Zod schema | Fails fast at boot with descriptive errors on missing env vars |

**Key insight:** The NestJS + Prisma ecosystem has solved every cross-cutting concern (auth, validation, config, security headers). Hand-rolling any of these during Phase 1 will slow down the project and introduce security gaps.

---

## Common Pitfalls

### Pitfall 1: Prisma Client Not Generated Before Build

**What goes wrong:** `turbo build` or `turbo dev` fails with "Cannot find module `../generated/client`" because the Prisma client is generated, not committed to git.
**Why it happens:** The `generated/` directory is in `.gitignore`; new devs or CI runs don't have it.
**How to avoid:** In `turbo.json`, set `"dependsOn": ["db:generate"]` for both `build` and `dev` tasks. Add `db:generate` as a root-level turbo task that runs the `packages/database` generate script.
**Warning signs:** TypeScript errors on `@repo/db` imports immediately after clone.

### Pitfall 2: CORS Blocking Cookies

**What goes wrong:** Frontend cannot receive or send cookies (refresh token) to the API despite correct configuration.
**Why it happens:** CORS default blocks credentials. Must explicitly set `credentials: true` server-side AND `credentials: 'include'` in client fetch calls.
**How to avoid:** In NestJS `main.ts`: `app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })`. In frontend fetch: `{ credentials: 'include' }`.
**Warning signs:** 401 on every request after login; cookies not appearing in browser DevTools for the API domain.

### Pitfall 3: Global JWT Guard Blocks Auth Routes

**What goes wrong:** The login endpoint returns 401 because the global AccessTokenGuard intercepts it before any token exists.
**Why it happens:** `app.useGlobalGuards(AccessTokenGuard)` protects all routes including `/auth/login`.
**How to avoid:** Implement a `@Public()` custom decorator that sets metadata, then modify `AccessTokenGuard` to check for this metadata before calling `super.canActivate()`. Apply `@Public()` to `AuthController.login`.
**Warning signs:** `POST /api/v1/auth/login` returns 401 immediately after bootstrap.

### Pitfall 4: Unique Constraint Violations on Soft-Deleted Records

**What goes wrong:** Creating a new RTO with the same ASQA code as a soft-deleted one fails with a unique constraint violation.
**Why it happens:** PostgreSQL unique indexes count all rows including those with `deleted_at IS NOT NULL`.
**How to avoid:** For the ASQA code uniqueness, use a partial unique index: `@@index([asqa_code], where: "deleted_at IS NULL")` — or handle at application layer by checking for soft-deleted duplicates before insert. [CITED: thisdot.co/blog/how-to-implement-soft-delete-with-prisma-using-partial-indexes]
**Warning signs:** Unique constraint errors when re-creating RTOs after soft deletion.

### Pitfall 5: TanStack Query v5 Breaking Changes from v4

**What goes wrong:** Code copied from v4 tutorials breaks — `useQuery` options like `onSuccess`/`onError` are removed in v5; `isLoading` vs `isPending` semantics changed.
**Why it happens:** v5 was a major rewrite. Many community examples are still v4.
**How to avoid:** Always check the v5 docs at tanstack.com/query/v5/. Key changes: use `isPending` instead of `isLoading` for initial fetch state; use `queryClient.invalidateQueries({ queryKey })` not `queryClient.invalidateQueries(queryKey)`.
**Warning signs:** TypeScript errors on `onSuccess`/`onError` callback options.

### Pitfall 6: pnpm Hoisting Issues with NestJS reflect-metadata

**What goes wrong:** NestJS decorators fail with "Reflect.metadata is not a function" in the monorepo.
**Why it happens:** `reflect-metadata` must be imported once before any decorator runs. In a pnpm workspace, it may be installed in the wrong location or not hoisted correctly.
**How to avoid:** Add `reflect-metadata` to `apps/api/package.json` directly (not just as peer dep). Import it as the very first line of `apps/api/src/main.ts`: `import 'reflect-metadata';`. Also ensure `tsconfig.json` has `"emitDecoratorMetadata": true`.
**Warning signs:** Decorator-related runtime errors immediately on API startup.

### Pitfall 7: Next.js App Router — Providers Must Be Client Components

**What goes wrong:** `QueryClientProvider` causes "cannot use hooks in Server Component" error.
**Why it happens:** `QueryClientProvider` uses React context, which requires a client boundary.
**How to avoid:** Create a `providers.tsx` file with `'use client'` at the top. Wrap only providers inside it. Import `Providers` from `app/layout.tsx` (which is a server component) — this is valid because the providers component boundary is explicit.
**Warning signs:** Build error "You're importing a component that needs context. It only works in a Client Component."

---

## Code Examples

### RTO Create DTO (NestJS)

```typescript
// Source: [CITED: docs.nestjs.com/pipes#class-validator]
import { IsString, IsEmail, IsOptional, IsArray, MinLength } from 'class-validator';

export class CreateRtoDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  asqa_code: string;

  @IsArray()
  @IsString({ each: true })
  operating_states: string[];

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;
}
```

### RTO Service — List with Counts (NestJS + Prisma)

```typescript
// Pattern: soft-delete filter + relation count in one query
async findAll() {
  return this.prisma.rto.findMany({
    where: { deleted_at: null },
    include: {
      _count: {
        select: {
          alerts: { where: { resolved: false, deleted_at: null } },
          validations: {
            where: {
              planned_date: { gte: new Date() },
              deleted_at: null
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}
```

### RTO Card Component (Next.js + shadcn)

```tsx
// RTO dashboard card with placeholder status badge
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RtoCardProps {
  rto: {
    id: string;
    name: string;
    asqa_code: string;
    operating_states: string[];
    _count: { alerts: number; validations: number };
  };
}

export function RtoCard({ rto }: RtoCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{rto.name}</CardTitle>
          {/* Status badge hidden in Phase 1 — D-09 */}
        </div>
        <p className="text-sm text-muted-foreground">{rto.asqa_code}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {rto.operating_states.map((state) => (
            <Badge key={state} variant="outline" className="text-xs">{state}</Badge>
          ))}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{rto._count.alerts} alerts</span>
          <span>{rto._count.validations} upcoming validations</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NestJS monorepo via `nest generate app` | pnpm workspaces + Turborepo for cross-framework monorepos | 2022+ | Better for NestJS + Next.js hybrid; Turborepo handles build caching |
| Prisma `@default(uuid())` (string UUID) | `@default(dbgenerated("gen_random_uuid()")) @db.Uuid` | Prisma 3.x+ | Native UUID column type; 16 bytes vs variable TEXT |
| React Query v4 `onSuccess`/`onError` callbacks | TanStack Query v5 `queryClient.invalidateQueries` + effect hooks | Q4 2023 | Callbacks removed in v5; significant API change |
| shadcn/ui manual sidebar implementation | shadcn Sidebar component (`pnpm dlx shadcn@latest add sidebar`) | Late 2024 | Production-ready sidebar with mobile, cookies, keyboard shortcut |
| Class-based JWT strategies per endpoint | Two-strategy Passport pattern (access + refresh) | Standard since NestJS 8+ | Clean separation; refresh endpoint gets its own guard |
| `next/router` (Pages Router) | `next/navigation` (App Router) | Next.js 13+ | `useRouter`, `redirect()` are from different packages |

**Deprecated/outdated:**
- `@types/passport-jwt`: No longer needed if using `@nestjs/passport` 11.x with full TypeScript types built in — verify before adding.
- `NestJS Fastify for cookies`: Fastify cookie plugin differs from Express `cookie-parser`; since D-05 specifies standard JWT, stick with Express adapter.
- `next-auth` / `Auth.js`: Not applicable — D-05 locks in-house JWT auth.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | pnpm will be installed at project start (not currently on machine) | Environment Availability | Build tasks fail; npm workspaces is fallback but turbo integration is pnpm-optimized |
| A2 | Docker (for local PostgreSQL) will be available or a cloud PostgreSQL instance used | Environment Availability | Database not available; all API work blocked |
| A3 | Next.js 16.x works with React 19 (peer dependency) | Standard Stack | Module resolution errors at install; downgrade to Next.js 15 + React 18 if needed |
| A4 | `class-transformer` 0.5.1 (last updated 2022) is still compatible with NestJS 11 | Standard Stack | Validation pipe errors; unlikely given no breaking changes in the intervening versions |

---

## Open Questions (RESOLVED)

1. **Local PostgreSQL setup strategy**
   - What we know: `psql` and `docker` are not installed on the development machine
   - What's unclear: Will the developer install Docker for local Postgres, or use a cloud/managed PostgreSQL instance (e.g., Supabase, Railway, Neon)?
   - Recommendation: Plan Wave 0 to include a `docker-compose.yml` for local PostgreSQL AND document the `DATABASE_URL` env var for cloud alternatives. Either path works.
   - RESOLVED: Plan 01-01 Task 0 (checkpoint:human-action) covers both paths — docker-compose.yml provided for local Postgres; DATABASE_URL env var documented for cloud alternatives.

2. **pnpm installation method**
   - What we know: pnpm is not currently installed; Turborepo strongly prefers pnpm
   - What's unclear: Is npm-managed global install acceptable (`npm install -g pnpm`) or is `corepack enable` preferred?
   - Recommendation: Use `corepack enable && corepack prepare pnpm@latest --activate` — this is the Node.js-native way to manage package managers without global installs.
   - RESOLVED: Plan 01-01 Task 0 uses `corepack enable && corepack prepare pnpm@latest --activate` as the installation method.

3. **Tailwind CSS v4 vs v3 with shadcn/ui**
   - What we know: `tailwindcss` npm latest is 4.3.0; shadcn/ui CLI (`shadcn@4.7.0`) generates for v4
   - What's unclear: Some shadcn components may still reference v3 CSS variable patterns in community guides
   - Recommendation: Use `pnpm dlx shadcn@latest init` which auto-detects Tailwind version. Avoid copying CSS from pre-v4 tutorials.
   - RESOLVED: Plan 01-03 Task 1 uses `pnpm dlx shadcn@latest init` — Tailwind version auto-detected; v4 confirmed as the target.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | v24.14.1 | — |
| npm | Package install | Yes | 11.11.0 | — |
| pnpm | Monorepo workspaces | No | — | Install via `corepack enable` before Wave 1 |
| Docker | Local PostgreSQL | No | — | Use managed Postgres (Neon, Supabase, Railway) OR install Docker Desktop |
| PostgreSQL client (psql) | Migration verification | No | — | Use `npx prisma studio` for visual inspection; `prisma migrate status` for migration state |
| NestJS CLI | `nest new`, `nest generate` | No (not global) | — | Use `pnpm dlx @nestjs/cli` for one-off commands; or install globally with `pnpm add -g @nestjs/cli` |
| Turborepo (turbo) | Build orchestration | Via npx | 2.9.14 | Install as root devDependency |
| Git | Version control | Yes | 2.53.0 | — |

**Missing dependencies with no fallback:**
- pnpm — required for workspaces; must install before any monorepo work
- PostgreSQL (via Docker or cloud) — required for all API work; no code-only fallback

**Missing dependencies with fallback:**
- Docker — can use cloud PostgreSQL instead; plan should document both paths
- NestJS CLI global — use `pnpm dlx @nestjs/cli@latest` for scaffolding commands

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (NestJS default) + Vitest or Jest (Next.js via `@jest/globals`) |
| Config file | `apps/api/jest.config.ts` (generated by NestJS CLI) |
| Quick run command | `pnpm --filter @trainsmart/api test` |
| Full suite command | `turbo run test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RTO-01 | POST /api/v1/rtos creates RTO with valid payload | Integration (NestJS E2E) | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| RTO-01 | POST /api/v1/rtos rejects invalid ASQA code | Unit (DTO validation) | `pnpm --filter @trainsmart/api test` | ❌ Wave 0 |
| RTO-02 | Creating RTO provisions all 8 sub-entity stubs | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| RTO-03 | GET /api/v1/rtos returns list with counts | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| DASH-02 | Alert count in RTO response is accurate | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| D-05 | Login returns access + refresh tokens | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| D-05 | Expired access token triggers 401 | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |
| D-05 | Refresh token rotates correctly | Integration | `pnpm --filter @trainsmart/api test:e2e` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @trainsmart/api test -- --testPathPattern=<module>`
- **Per wave merge:** `pnpm --filter @trainsmart/api test` (all unit tests)
- **Phase gate:** `turbo run test` (full suite across all packages) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/test/app.e2e-spec.ts` — baseline E2E setup (generated by NestJS CLI, verify)
- [ ] `apps/api/test/auth.e2e-spec.ts` — covers D-05 auth flow
- [ ] `apps/api/test/rto.e2e-spec.ts` — covers RTO-01, RTO-02, RTO-03
- [ ] `apps/api/src/rto/rto.service.spec.ts` — unit tests for RTO service methods
- [ ] Test database setup — separate `TEST_DATABASE_URL` in `.env.test`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | NestJS Passport + bcryptjs password hashing; email/password flow |
| V3 Session Management | Yes | JWT access (15m) + refresh (7d) with httpOnly cookie for refresh token |
| V4 Access Control | Yes | Global AccessTokenGuard; @Public() decorator for auth routes |
| V5 Input Validation | Yes | `class-validator` ValidationPipe (API) + Zod (frontend forms) |
| V6 Cryptography | Yes | `bcryptjs` for password hashing; JWT signing with HS256 (configurable secret per D-05) |

### Known Threat Patterns for NestJS + Next.js Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing access tokens from localStorage | Information Disclosure | Store access token in memory only (not localStorage); refresh via httpOnly cookie |
| CSRF on refresh token endpoint | Tampering | `sameSite: 'strict'` on refresh token cookie; CORS restricted to frontend origin |
| Mass assignment via unvalidated DTOs | Tampering | `whitelist: true` + `forbidNonWhitelisted: true` on ValidationPipe |
| Brute-force login | Elevation of Privilege | Rate limiting on `/auth/login` (consider `@nestjs/throttler`) |
| SQL injection via Prisma | Tampering | Prisma parameterises all queries; no raw SQL in Phase 1 |
| Sensitive data in JWT payload | Information Disclosure | Only store `{ sub: userId, email }` in payload — no roles, no PII beyond email |
| Clickjacking | Spoofing | `helmet` sets `X-Frame-Options: DENY` automatically |
| Missing HTTPS in production | Information Disclosure | Docker/VPS deployment must terminate TLS; flag for deployment docs |

---

## Sources

### Primary (HIGH confidence)
- [npm registry] — All package versions verified with `npm view <package> version` on 2026-05-18
- [prisma.io/docs/guides/deployment/turborepo] — Turborepo + Prisma monorepo setup, package structure, turbo.json pipeline
- [prisma.io/docs/guides/use-prisma-in-pnpm-workspaces] — pnpm workspace Prisma setup, output path, cross-package exports
- [ui.shadcn.com/docs/components/sidebar] — SidebarProvider, dark mode CSS variables, collapsible variants
- [turborepo.dev/docs/crafting-your-repository/structuring-a-repository] — pnpm-workspace.yaml, turbo.json structure
- [wanago.io/2024/01/01/api-nestjs-uuid-prisma-postgresql/] — UUID PK patterns, `@db.Uuid` vs string UUID

### Secondary (MEDIUM confidence)
- [elvisduru.com/blog/nestjs-jwt-authentication-refresh-token] — NestJS dual-strategy JWT implementation; verified against official NestJS auth docs
- [tanstack.com/query/v5/docs/framework/react/guides/ssr] — TanStack Query v5 SSR/App Router setup patterns
- [dev.to/yinks/how-to-make-radix-ui-tabs-url-based-in-nextjs] — URL-based tab routing with Radix UI Tabs + Next.js Link
- [thisdot.co/blog/how-to-implement-soft-delete-with-prisma-using-partial-indexes] — Soft delete with partial indexes

### Tertiary (LOW confidence)
- None — all key claims verified via official documentation or registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry with current versions and source repos
- Architecture: HIGH — patterns sourced from official NestJS, Prisma, shadcn/ui, and TanStack documentation
- Pitfalls: HIGH — all pitfalls sourced from official docs or verified community patterns with known root causes
- Environment availability: HIGH — directly probed on development machine

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (30 days; stack is stable but NestJS/Next.js release frequently)
