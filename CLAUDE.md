# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Light Archives (Elpisgarten) is a full-stack FFXIV roleplaying portal for the Light EU datacenter, forked from Chaos Archives. It enables character profiles, roleplay stories, events, communities, and a community newspaper (The Harborwatch).

## Build & Development Commands

### Client (Vue 3 + Quasar)
```bash
cd client
quasar dev          # Development server
quasar build        # Production build
yarn lint           # ESLint
```

### Server (NestJS)
```bash
cd server
yarn start:dev      # Development with hot reload
yarn build          # Build for production
yarn lint           # ESLint with auto-fix
yarn test           # Jest tests
yarn test:watch     # Jest watch mode
yarn test:cov       # Jest with coverage
yarn docker:build   # Build Docker image
yarn docker:deploy  # Deploy via docker-compose
```

### News App
```bash
cd news
quasar dev          # Development server
quasar build        # Production build
```

## Architecture

### Monorepo Structure
- **client/** - Vue 3 + Quasar frontend (main portal)
- **news/** - Quasar app for The Harborwatch newspaper
- **client-common/** - Shared frontend utilities
- **wsclient/** - WebSocket client library
- **server/** - NestJS backend monorepo

### Server Monorepo Layout
```
server/
├── apps/
│   ├── chaosarchives/    # Main API (port 8111)
│   │   └── src/
│   │       ├── api/      # REST endpoints
│   │       │   ├── internal/  # Internal APIs
│   │       │   └── rpp/       # RPP character update API
│   │       └── websocket/     # Socket.io handlers
│   └── steward/          # Discord bot (port 8112)
│       └── src/
│           ├── bot/      # Discord commands
│           └── webhook/  # Webhook handlers
└── libs/
    ├── configuration/    # Environment config
    ├── entity/          # TypeORM entities
    ├── shared/          # DTOs, enums, validation
    ├── security/        # Auth/authorization
    └── auth/            # Auth logic
```

### Import Aliases (Server)
- `@app/configuration` - Configuration library
- `@app/entity` - Database entities
- `@app/shared` - Shared DTOs and types
- `@app/security` - Security utilities

## Technology Stack

**Frontend:** Vue 3, Quasar 2, TypeScript, Vuex 4, Vue Router 4, Axios, Socket.io Client

**Backend:** NestJS 10, TypeORM 0.3, MariaDB, Redis, Socket.io, Passport (Discord OAuth2), AWS S3, Sharp

## Deployment

- Frontend: Build with `quasar build`, deploy `dist/spa` to web root
- Backend: Docker container on port 8111
- Proxy `/api/*` to backend, `/socket.io/*` as WebSocket

## Key Patterns

- Discord OAuth2 for authentication
- TypeORM with MariaDB for persistence
- Socket.io for real-time RPP character updates
- AWS S3 for image storage with Sharp processing
