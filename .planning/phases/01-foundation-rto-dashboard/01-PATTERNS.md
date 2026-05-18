# Phase 1: Foundation & RTO Dashboard - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 28 new files (greenfield — zero existing source code)
**Analogs found:** 0 / 28 — no codebase analogs exist; all patterns sourced from RESEARCH.md

---

## Greenfield Notice

This is a greenfield project. The working directory contains only `CLAUDE.md` and a Word document. There are no existing source files to extract analogs from. All pattern excerpts below are sourced directly from the `01-RESEARCH.md` code examples and RESEARCH.md patterns, which the researcher documented from official library documentation (NestJS docs, Prisma docs, shadcn/ui docs, TanStack docs). These are the canonical patterns to copy from.

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `pnpm-workspace.yaml` | config | — | RESEARCH.md Pattern 7 | research-only |
| `turbo.json` | config | — | RESEARCH.md Pattern 7 | research-only |
| `package.json` (root) | config | — | RESEARCH.md Pattern 7 | research-only |
| `packages/database/package.json` | config | — | RESEARCH.md Pattern 7 | research-only |
| `packages/database/prisma/schema.prisma` | model | CRUD | RESEARCH.md Pattern 1 | research-only |
| `packages/database/src/client.ts` | utility | request-response | RESEARCH.md Pattern 7 | research-only |
| `packages/database/src/index.ts` | utility | request-response | RESEARCH.md Pattern 7 | research-only |
| `apps/api/src/main.ts` | config | request-response | RESEARCH.md Pattern 3 | research-only |
| `apps/api/src/app.module.ts` | config | — | RESEARCH.md Architecture | research-only |
| `apps/api/src/auth/auth.module.ts` | config | — | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/auth.service.ts` | service | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/auth.controller.ts` | controller | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/strategies/access-token.strategy.ts` | middleware | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/strategies/refresh-token.strategy.ts` | middleware | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/guards/access-token.guard.ts` | middleware | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/auth/guards/refresh-token.guard.ts` | middleware | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/api/src/common/decorators/public.decorator.ts` | utility | — | RESEARCH.md Pitfall 3 | research-only |
| `apps/api/src/rto/rto.module.ts` | config | — | RESEARCH.md Architecture | research-only |
| `apps/api/src/rto/rto.service.ts` | service | CRUD | RESEARCH.md Code Examples | research-only |
| `apps/api/src/rto/rto.controller.ts` | controller | CRUD | RESEARCH.md Code Examples | research-only |
| `apps/api/src/rto/dto/create-rto.dto.ts` | model | request-response | RESEARCH.md Code Examples | research-only |
| `apps/api/src/rto/dto/update-rto.dto.ts` | model | request-response | RESEARCH.md Code Examples | research-only |
| `apps/api/src/prisma/prisma.service.ts` | service | CRUD | RESEARCH.md Pattern 7 | research-only |
| `apps/web/app/layout.tsx` | component | request-response | RESEARCH.md Pattern 5 | research-only |
| `apps/web/app/(auth)/login/page.tsx` | component | request-response | RESEARCH.md Pattern 2 | research-only |
| `apps/web/app/(dashboard)/layout.tsx` | component | request-response | RESEARCH.md Pattern 4 | research-only |
| `apps/web/app/(dashboard)/page.tsx` | component | request-response | RESEARCH.md Code Examples | research-only |
| `apps/web/app/(dashboard)/rto/[id]/page.tsx` | component | request-response | RESEARCH.md Pattern 6 | research-only |
| `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` | component | request-response | RESEARCH.md Pattern 6 | research-only |
| `apps/web/components/layout/app-sidebar.tsx` | component | event-driven | RESEARCH.md Pattern 4 | research-only |
| `apps/web/components/layout/providers.tsx` | provider | request-response | RESEARCH.md Pattern 5 | research-only |
| `apps/web/components/rto/rto-card.tsx` | component | request-response | RESEARCH.md Code Examples | research-only |
| `apps/web/lib/api.ts` | utility | request-response | RESEARCH.md Architecture | research-only |
| `apps/web/lib/query-client.ts` | utility | request-response | RESEARCH.md Pattern 5 | research-only |

---

## Pattern Assignments

### `packages/database/prisma/schema.prisma` (model, CRUD)

**Source:** RESEARCH.md Pattern 1 — Prisma Schema Core RTO Entities

**Generator + datasource block:**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**UUID PK pattern (apply to every model):**
```prisma
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
```
Use `dbgenerated("gen_random_uuid()")` with `@db.Uuid` — NOT `@default(uuid())`. The former stores native 16-byte UUID in PostgreSQL; the latter stores variable-length TEXT.

**Soft-delete + timestamps pattern (apply to every model):**
```prisma
created_at DateTime  @default(now()) @db.Timestamptz
updated_at DateTime  @updatedAt @db.Timestamptz
deleted_at DateTime? @db.Timestamptz
```

**Soft-delete index pattern (apply to every top-level model):**
```prisma
@@index([deleted_at]) // fast soft-delete filter
```

**Partial unique index for ASQA code (avoids soft-delete conflict):**
```prisma
// On Rto model — unique only among non-deleted rows
@@index([asqa_code], where: "deleted_at IS NULL")
```
See RESEARCH.md Pitfall 4: standard `@unique` counts soft-deleted rows, causing constraint violations on re-create.

**User model (full):**
```prisma
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
```

**Rto model (full):**
```prisma
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

  qualifications   RtoQualification[]
  trainers         Trainer[]
  tas_documents    TasDocument[]
  validations      Validation[]
  documents        Document[]
  tasks            Task[]
  alerts           ComplianceAlert[]
  notes            Note[]

  @@index([asqa_code])
  @@index([deleted_at])
  @@map("rtos")
}
```

**Stub model pattern (apply to all 8 relation stubs):**
```prisma
model RtoQualification {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rto        Rto       @relation(fields: [rto_id], references: [id])
  rto_id     String    @db.Uuid
  created_at DateTime  @default(now()) @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz
  @@map("rto_qualifications")
}
```
Repeat for: `Trainer`, `TasDocument`, `Validation`, `Document`, `Task`, `ComplianceAlert`, `Note` — see RESEARCH.md Pattern 1 for full field lists on each.

**`@@map` naming convention:** PostgreSQL table name is always plural snake_case; Prisma model name is singular PascalCase. Set `@@map()` on every model.

---

### `packages/database/src/client.ts` (utility, request-response)

**Source:** RESEARCH.md Pattern 7 — Turborepo Prisma Singleton

**Singleton pattern (prevents multiple PrismaClient instances in dev hot-reload):**
```typescript
import { PrismaClient } from '../generated/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### `packages/database/src/index.ts` (utility, request-response)

**Source:** RESEARCH.md Pattern 7

```typescript
export { prisma } from './client';
export * from '../generated/client';
```
The `export * from '../generated/client'` line re-exports all Prisma-generated types (model types, enums, `Prisma` namespace) so API consumers get full type safety from `@repo/db`.

---

### `packages/database/package.json` (config)

**Source:** RESEARCH.md Pattern 7

```json
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

---

### `pnpm-workspace.yaml` (config)

**Source:** RESEARCH.md Pattern 7

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### `turbo.json` (config)

**Source:** RESEARCH.md Pattern 7

```json
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
`"dependsOn": ["db:generate"]` on both `build` and `dev` prevents the "Cannot find module `../generated/client`" error (RESEARCH.md Pitfall 1).

---

### `apps/api/src/main.ts` (config, request-response)

**Source:** RESEARCH.md Pattern 3 — NestJS main.ts Bootstrap

**Full bootstrap pattern:**
```typescript
import 'reflect-metadata'; // MUST be first line — see RESEARCH.md Pitfall 6
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());
  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // required for httpOnly refresh token cookie — Pitfall 2
  });

  // Global JWT guard — all routes protected except those with @Public() decorator — Pitfall 3
  app.useGlobalGuards(app.get(AccessTokenGuard));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             // strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,             // auto-transform query params to typed DTOs
  }));

  await app.listen(3001);
}
bootstrap();
```

Key: `import 'reflect-metadata'` must be the very first import (RESEARCH.md Pitfall 6). `app.get(AccessTokenGuard)` (not `new AccessTokenGuard()`) allows NestJS DI to inject ConfigService into the guard.

---

### `apps/api/src/auth/strategies/access-token.strategy.ts` (middleware, request-response)

**Source:** RESEARCH.md Pattern 2 — NestJS JWT Two-Strategy Setup

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type JwtPayload = { sub: string; email: string };

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
```

---

### `apps/api/src/auth/strategies/refresh-token.strategy.ts` (middleware, request-response)

**Source:** RESEARCH.md Pattern 2

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './access-token.strategy';

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
```

---

### `apps/api/src/auth/guards/access-token.guard.ts` (middleware, request-response)

**Source:** RESEARCH.md Pattern 2 + Pitfall 3

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```
The `Reflector` + `IS_PUBLIC_KEY` check is the escape hatch that prevents the global guard from blocking `@Public()` routes like `/auth/login` (RESEARCH.md Pitfall 3).

---

### `apps/api/src/auth/guards/refresh-token.guard.ts` (middleware, request-response)

**Source:** RESEARCH.md Pattern 2

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
```

---

### `apps/api/src/common/decorators/public.decorator.ts` (utility)

**Source:** RESEARCH.md Pitfall 3

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```
Apply `@Public()` to `AuthController.login()` and `AuthController.refresh()`.

---

### `apps/api/src/auth/auth.service.ts` (service, request-response)

**Source:** RESEARCH.md Pattern 2 — token issuance + refresh token hashing

**Token generation pattern:**
```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@repo/db';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { refresh_token: hashed },
    });
  }
}
```

**Password validation pattern:**
```typescript
async validateUser(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, deleted_at: null },
  });
  if (!user) throw new ForbiddenException('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ForbiddenException('Invalid credentials');
  return user;
}
```

---

### `apps/api/src/auth/auth.controller.ts` (controller, request-response)

**Source:** RESEARCH.md Pattern 2 + Pattern 3

**Controller pattern with `@Public()` on login:**
```typescript
import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
    return { accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: Request) {
    // req.user populated by RefreshTokenStrategy.validate()
    return this.authService.refreshTokens(req.user as any);
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout((req.user as any).sub);
  }
}
```

---

### `apps/api/src/rto/dto/create-rto.dto.ts` (model, request-response)

**Source:** RESEARCH.md Code Examples — RTO Create DTO

```typescript
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

---

### `apps/api/src/rto/dto/update-rto.dto.ts` (model, request-response)

**Source:** NestJS convention — PartialType wraps CreateRtoDto making all fields optional

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateRtoDto } from './create-rto.dto';

export class UpdateRtoDto extends PartialType(CreateRtoDto) {}
```

---

### `apps/api/src/rto/rto.service.ts` (service, CRUD)

**Source:** RESEARCH.md Code Examples — RTO Service List with Counts

**findAll with soft-delete filter + relation counts:**
```typescript
import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateRtoDto } from './dto/create-rto.dto';

@Injectable()
export class RtoService {
  async findAll() {
    return prisma.rto.findMany({
      where: { deleted_at: null },
      include: {
        _count: {
          select: {
            alerts: { where: { resolved: false, deleted_at: null } },
            validations: {
              where: {
                planned_date: { gte: new Date() },
                deleted_at: null,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return prisma.rto.findFirst({ where: { id, deleted_at: null } });
  }

  async create(dto: CreateRtoDto) {
    return prisma.$transaction(async (tx) => {
      const rto = await tx.rto.create({ data: dto });
      // Workspace auto-provisioning per RTO-02 — stub records created atomically
      // (expand in later phases with full entity provisioning)
      return rto;
    });
  }

  async update(id: string, dto: UpdateRtoDto) {
    return prisma.rto.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    // Soft delete — never hard delete
    return prisma.rto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
```

Key: soft delete uses `deleted_at: new Date()` not `delete()`. All list queries filter `where: { deleted_at: null }`.

---

### `apps/api/src/rto/rto.controller.ts` (controller, CRUD)

**Source:** NestJS CRUD controller convention + RESEARCH.md Architecture (D-04: all routes `/api/v1/*`)

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RtoService } from './rto.service';
import { CreateRtoDto } from './dto/create-rto.dto';
import { UpdateRtoDto } from './dto/update-rto.dto';

@Controller('rtos')  // resolves to /api/v1/rtos via global prefix in main.ts
export class RtoController {
  constructor(private readonly rtoService: RtoService) {}

  @Get()
  findAll() {
    return this.rtoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rtoService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRtoDto) {
    return this.rtoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRtoDto) {
    return this.rtoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rtoService.remove(id);
  }
}
```

---

### `apps/api/src/prisma/prisma.service.ts` (service, CRUD)

**Source:** RESEARCH.md Pattern 7 — Prisma singleton client

NestJS apps conventionally wrap the Prisma client in an injectable service for DI. Since Prisma is in `packages/database`, the PrismaService re-exports it:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class PrismaService implements OnModuleInit {
  readonly client = prisma;

  async onModuleInit() {
    await prisma.$connect();
  }
}
```
Alternative: import `prisma` directly from `@repo/db` in services without a PrismaService wrapper — both are valid. The wrapper enables mock injection in unit tests.

---

### `apps/web/lib/query-client.ts` (utility, request-response)

**Source:** RESEARCH.md Pattern 5 — TanStack Query v5 App Router Setup

```typescript
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
```

---

### `apps/web/components/layout/providers.tsx` (provider, request-response)

**Source:** RESEARCH.md Pattern 5

```typescript
'use client'; // MUST be present — see RESEARCH.md Pitfall 7
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
```

---

### `apps/web/app/layout.tsx` (component, request-response)

**Source:** RESEARCH.md Pattern 5

```typescript
import { Providers } from '@/components/layout/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```
Root layout is a Server Component. `Providers` is a Client Component. This is valid — the `'use client'` boundary is explicit on `providers.tsx`.

---

### `apps/web/app/(dashboard)/layout.tsx` (component, request-response)

**Source:** RESEARCH.md Pattern 4 — shadcn/ui Dark Sidebar Layout

```typescript
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

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
```

---

### `apps/web/components/layout/app-sidebar.tsx` (component, event-driven)

**Source:** RESEARCH.md Pattern 4

shadcn Sidebar component handles open/closed state via cookies natively — do NOT add Zustand or custom state (RESEARCH.md Anti-Patterns). The sidebar background is controlled by CSS variables:

```typescript
// Dark sidebar CSS variables (set in globals.css or tailwind.config.ts)
// --sidebar-background: 240 5.9% 10%     (dark charcoal)
// --sidebar-foreground: 240 4.8% 95.9%   (near-white text)

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/' },
];

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>TrainSmart</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

---

### `apps/web/app/(dashboard)/page.tsx` (component, request-response)

**Source:** RESEARCH.md Code Examples — RTO Card Component + TanStack Query v5

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { RtoCard } from '@/components/rto/rto-card';

async function fetchRtos() {
  const res = await fetch('/api/v1/rtos', { credentials: 'include' }); // credentials required — Pitfall 2
  if (!res.ok) throw new Error('Failed to fetch RTOs');
  return res.json();
}

export default function DashboardPage() {
  const { data: rtos, isPending, isError } = useQuery({ // isPending not isLoading — Pitfall 5
    queryKey: ['rtos'],
    queryFn: fetchRtos,
  });

  if (isPending) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-destructive">Failed to load RTOs.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">RTO Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rtos.map((rto: any) => (
          <RtoCard key={rto.id} rto={rto} />
        ))}
      </div>
    </div>
  );
}
```

---

### `apps/web/components/rto/rto-card.tsx` (component, request-response)

**Source:** RESEARCH.md Code Examples — RTO Card Component

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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
    <Link href={`/rto/${rto.id}/qualifications`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold">{rto.name}</CardTitle>
            {/* Traffic-light status badge hidden in Phase 1 — D-09 */}
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
    </Link>
  );
}
```

---

### `apps/web/app/(dashboard)/rto/[id]/page.tsx` (component, request-response)

**Source:** RESEARCH.md Pattern 6 — RTO Workspace Tab Routing

```typescript
import { redirect } from 'next/navigation'; // App Router — NOT next/router

export default function RtoIndexPage({ params }: { params: { id: string } }) {
  redirect(`/rto/${params.id}/qualifications`);
}
```
Default redirect: `/rto/[id]` → `/rto/[id]/qualifications`.

---

### `apps/web/app/(dashboard)/rto/[id]/[tab]/page.tsx` (component, request-response)

**Source:** RESEARCH.md Pattern 6 — URL-Based Tab Routing

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const TABS = [
  'qualifications', 'trainers', 'tas', 'validations',
  'documents', 'tasks', 'alerts', 'notes',
] as const;

type Tab = typeof TABS[number];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function RtoWorkspacePage({
  params,
}: {
  params: { id: string; tab: string };
}) {
  if (!TABS.includes(params.tab as Tab)) notFound();

  return (
    <div className="p-6">
      <Tabs value={params.tab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} asChild>
              <Link href={`/rto/${params.id}/${t}`}>{capitalize(t)}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={params.tab} className="mt-6">
          {/* Tab stub — content populated in later phases */}
          <p className="text-muted-foreground">
            {capitalize(params.tab)} — coming in a future phase.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### `apps/web/lib/api.ts` (utility, request-response)

**Source:** RESEARCH.md Architecture — all API calls go to `/api/v1/*` with `credentials: 'include'`

```typescript
const API_BASE = '/api/v1';

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include', // required for httpOnly refresh token cookie — Pitfall 2
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    // Access token expired — attempt silent refresh
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshed.ok) {
      window.location.href = '/login';
      return;
    }
    // Retry original request
    return apiFetch(path, init);
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}
```

---

## Shared Patterns

### Soft-Delete Filter
**Apply to:** Every Prisma `findMany` and `findFirst` query in all services.
```typescript
where: { deleted_at: null }
```
Never omit this filter. All list endpoints silently exclude soft-deleted records.

### Soft-Delete Write
**Apply to:** All `remove()` methods — never call `prisma.model.delete()`.
```typescript
await prisma.model.update({
  where: { id },
  data: { deleted_at: new Date() },
});
```

### `@Public()` Decorator Escape Hatch
**Source:** `apps/api/src/common/decorators/public.decorator.ts`
**Apply to:** `AuthController.login`, `AuthController.refresh`
```typescript
@Public()
@Post('login')
async login(...) {}
```
Any route without `@Public()` is automatically protected by the global `AccessTokenGuard`.

### `credentials: 'include'` on All Frontend Fetch Calls
**Apply to:** Every `fetch()` call in `apps/web`, including inside TanStack Query `queryFn` functions.
```typescript
fetch('/api/v1/...', { credentials: 'include' })
```
Required for httpOnly refresh token cookie to be sent cross-origin (RESEARCH.md Pitfall 2).

### TanStack Query v5 — `isPending` Not `isLoading`
**Apply to:** All `useQuery` consumers.
```typescript
const { data, isPending, isError } = useQuery({ queryKey: [...], queryFn: ... });
```
`isLoading` semantics changed in v5 (RESEARCH.md Pitfall 5). Always use `isPending` for initial fetch state.

### Prisma Transaction for Multi-Entity Creates
**Apply to:** `RtoService.create()` (RTO-02: workspace auto-provisioning).
```typescript
return prisma.$transaction(async (tx) => {
  const rto = await tx.rto.create({ data: dto });
  // Create stub entities within same transaction for atomicity
  return rto;
});
```

### NestJS Module Structure — One Module Per Domain
**Apply to:** `AuthModule`, `RtoModule`, `UsersModule`
Each domain module registers its controller, service, and any strategy/guard providers. Import `PrismaModule` (or reference `@repo/db` directly) as a shared dependency.

---

## No Analog Found

All files in this phase have no codebase analog — this is a greenfield project. The table below lists files that also have no direct RESEARCH.md pattern excerpt; the planner must synthesize these from the architectural description and NestJS/Prisma conventions documented in RESEARCH.md.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/app.module.ts` | config | — | Standard NestJS root module; use `nest new` scaffold output |
| `apps/api/src/auth/auth.module.ts` | config | — | Standard NestJS module registration; no specific excerpt in RESEARCH.md |
| `apps/api/src/rto/rto.module.ts` | config | — | Standard NestJS module registration |
| `apps/web/app/(auth)/login/page.tsx` | component | request-response | Login form with React Hook Form + Zod; RESEARCH.md lists libraries but no login page excerpt |
| `apps/api/src/users/` (module, service) | service | CRUD | RESEARCH.md mentions UsersModule exists but provides no code excerpt; standard NestJS CRUD |

---

## Metadata

**Analog search scope:** Working directory `C:\Users\GeorgeYousifModdex\OneDrive - Moddex\Desktop\Trainsmart app` — confirmed greenfield, only `CLAUDE.md` and Word document present.
**Source files scanned:** 0 source files (greenfield); all patterns sourced from `01-RESEARCH.md`
**Pattern extraction date:** 2026-05-18
**Pattern source confidence:** HIGH — all RESEARCH.md patterns sourced from official NestJS, Prisma, shadcn/ui, and TanStack documentation with specific citations
