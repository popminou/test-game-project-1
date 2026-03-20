# CLAUDE.md - Project Workflow Guide

## Project Overview

This is a risk-like game where 2-4 players compete for territorial domination of a map. Using turn-based mechanics, players will manage resources, create and move armies, and fight battles to accumulate the most victory points to win the game.

## Quick Start

```bash
yarn install    # Install dependencies
yarn dev        # Start dev servers (server + client with hot reload)
```

## Project Layout

- `packages/iso/` — Shared types and constants. Both server and client import from `@test-project/iso`.
- `packages/server/` — Express API. Entry point: `src/index.ts`. Runs on port 3001.
- `packages/client/` — React + Vite. Entry point: `src/main.tsx`. Runs on port 5173.

## Key Conventions

- **Yarn workspaces**: Dependencies are hoisted to the root. Use `yarn workspace @test-project/<pkg> add <dep>` to add package-specific deps.
- **TypeScript project references**: Run `yarn typecheck` to validate all packages. Each package has its own `tsconfig.json`.
- **Shared code goes in `iso`**: Any types, interfaces, or utilities shared between server and client belong in `packages/iso/src/`.
- **API routes**: Define route paths in `packages/iso/src/index.ts` (`API_ROUTES`) so they stay in sync between server and client.

## Common Tasks

| Task                     | Command                                                     |
| ------------------------ | ----------------------------------------------------------- |
| Add a server dependency  | `yarn workspace @test-project/server add <package>`         |
| Add a client dependency  | `yarn workspace @test-project/client add <package>`         |
| Add a shared type        | Edit `packages/iso/src/index.ts`, then rebuild or restart   |
| Run linter               | `yarn lint` or `yarn lint:fix`                              |
| Format code              | `yarn format`                                               |
| Type-check everything    | `yarn typecheck`                                            |
| Production build         | `yarn build`                                                |
| Start production server  | `yarn start`                                                |

## Code Style

- ESLint (flat config) + Prettier enforced at the root.
- Strict TypeScript with `strict: true`.
- Single quotes, semicolons, trailing commas.

## Adding a New API Endpoint

1. Add the route path to `API_ROUTES` in `packages/iso/src/index.ts`.
2. Add request/response types in the same file.
3. Implement the handler in `packages/server/src/index.ts`.
4. Consume it in the client using the shared route constant and types.

## Debugging

- Server logs print to the terminal running `yarn dev`.
- Client errors show in the browser console and as Vite overlay.
- The Vite dev server proxies `/api/*` requests to the Express server, so no CORS issues in dev.
