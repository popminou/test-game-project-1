# Test Project

A full-stack TypeScript monorepo with Express, React, and a shared isomorphic package.

## Structure

```
packages/
  iso/      - Shared types, constants, and utilities (used by both server and client)
  server/   - Express API backend (port 3001)
  client/   - React frontend via Vite (port 5173)
```

## Prerequisites

- Node.js >= 18
- Yarn (classic v1 or modern)

## Setup

```bash
# Install all dependencies
yarn install

# Start both server and client in dev mode (with hot reloading)
yarn dev
```

## Scripts

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `yarn dev`       | Start server and client concurrently with HMR    |
| `yarn build`     | Build iso, client, and server for production      |
| `yarn start`     | Run the production server                         |
| `yarn lint`      | Run ESLint across all packages                    |
| `yarn lint:fix`  | Auto-fix ESLint issues                            |
| `yarn format`    | Format code with Prettier                         |
| `yarn typecheck` | Type-check all packages via TypeScript references |

## Development

- **Server** runs on `http://localhost:3001` with `tsx watch` for instant restarts on file changes.
- **Client** runs on `http://localhost:5173` with Vite HMR. API requests to `/api/*` are proxied to the server.
- **Shared types** in `packages/iso` are referenced by both server and client via yarn workspaces.

## Production

```bash
yarn build
yarn start
```

The built server serves from `packages/server/dist`. The client builds to `packages/client/dist` and can be served by any static file host or by adding `express.static` to the server.
