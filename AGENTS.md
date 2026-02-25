# Agent Documentation for Notestack

This document provides essential information for AI agents working in this repository. It covers project architecture, commands, conventions, and patterns.

## Project Overview

Notestack is a modern full-stack web application built using [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). It's a monorepo utilizing Bun workspaces.

### Tech Stack
- **Runtime & Package Manager**: Bun
- **Frontend**: Next.js (App Router), React 19, TailwindCSS v4, shadcn/ui
- **Backend**: Hono (Server), oRPC (API layer)
- **Database**: SQLite (local) / Turso (production), Drizzle ORM
- **Authentication**: Better Auth
- **Linting & Formatting**: Biome, Oxlint, Oxfmt

## Repository Structure

The project uses a monorepo structure with Bun workspaces (`apps/*` and `packages/*`):

```text
notestack/
├── apps/
│   ├── web/           # Next.js frontend application (port 3001)
│   └── server/        # Hono + oRPC backend server (port 3000)
├── packages/
│   ├── api/           # Shared API definitions, routers, and context (oRPC)
│   ├── auth/          # Better Auth configuration
│   ├── config/        # Shared configuration (tsconfig)
│   ├── db/            # Drizzle ORM setup, schema, and migrations
│   └── env/           # Environment variable validation (Zod + t3-env)
```

## Essential Commands

Always run these commands from the root of the repository unless specified otherwise.

### Development
- `bun run dev` - Starts both frontend and backend development servers.
- `bun run dev:web` - Starts only the Next.js frontend.
- `bun run dev:server` - Starts only the Hono server.

### Building and Type Checking
- `bun run build` - Builds all applications.
- `bun run check-types` - Runs TypeScript type checking across all workspaces.

### Database (Drizzle & SQLite/Turso)
- `bun run db:local` - Starts the local Turso/SQLite database server.
- `bun run db:push` - Pushes schema changes directly to the database.
- `bun run db:generate` - Generates SQL migration files.
- `bun run db:migrate` - Runs pending database migrations.
- `bun run db:studio` - Opens Drizzle Studio to view/edit database contents.

### Linting and Formatting
- `bun run check` - Runs Oxlint and Oxfmt across the codebase.
*(Note: Biome is also configured via `biome.json`, but `bun run check` currently uses oxlint/oxfmt).*

## Development Guidelines & Conventions

### 1. Workspace Dependencies
- Dependencies between internal packages use the `workspace:*` version specifier.
- External dependencies shared across the workspace use `catalog:` as defined in the root `package.json`.
- When adding dependencies, prefer defining them in the root catalog if they are shared.

### 2. API & Communication (oRPC + Hono)
- **Backend**: The server is built with Hono and uses oRPC for type-safe API communication.
- **Routing**: API routes are defined in `packages/api/src/routers/`.
- **Context**: The request context (including authentication state) is built in `packages/api/src/context.ts`.
- **Endpoints**: The server exposes endpoints at `/api-reference` (REST/OpenAPI) and `/rpc` (RPC).

### 3. Database & Schema
- **Location**: Database schema is defined in `packages/db/src/schema/index.ts`.
- **ORM**: Drizzle ORM is used exclusively.
- **Migrations**: Always run `bun run db:generate` followed by `bun run db:migrate` or `bun run db:push` when altering the schema.

### 4. Authentication (Better Auth)
- Authentication is handled by [Better Auth](https://www.better-auth.com/).
- Configuration lives in `packages/auth/src/auth.ts`.
- The `packages/db` schema must remain in sync with Better Auth's requirements (users, sessions, accounts, verifications tables are already set up).
- The Hono server injects auth context into requests automatically.

### 5. Environment Variables
- Environment variables are strictly validated using `@t3-oss/env-core` and `@t3-oss/env-nextjs` combined with Zod.
- **Server Env**: Defined in `packages/env/src/server.ts`.
- **Client Env**: Defined in `packages/env/src/web.ts`.
- If you need a new environment variable, you **must** add it to the appropriate file in `packages/env/` first.

### 6. Styling
- The frontend uses **TailwindCSS v4**.
- UI components are built using `@base-ui/react` and a shadcn-like approach.

## Important Gotchas for Agents

1. **Imports**: The project uses ES modules (`"type": "module"`). Use `.js` extensions in relative imports if TypeScript struggles, though bundlers usually handle extensionless imports here.
2. **Path Aliases**: The Next.js app uses `@/*` for imports mapping to `apps/web/src/*`.
3. **Running Tasks**: When asked to make schema changes, don't forget to run the `db:generate` and `db:push` scripts so the changes apply to the SQLite database.
4. **Environment Requirements**: Ensure `.env` is properly populated in `apps/server` and `apps/web` (usually based on a `.env.example` if present) when running commands. The database requires `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
5. **Formatting**: Always respect the `biome.json` and `.oxfmtrc.json` formatting rules. Indentation uses tabs by default per Biome config.
