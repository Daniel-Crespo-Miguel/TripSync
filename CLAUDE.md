# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

There are no tests configured in this project.

## Architecture

**TripSync** is a collaborative travel planning app. Users create trip groups and manage shared itineraries, expenses, activities, chat, weather, and transport.

### Stack
- React 18 + TypeScript, built with Vite
- Bootstrap 5 for UI (no Tailwind)
- Firebase Auth + Firestore for auth and real-time data
- React Router v7 for navigation

### Routing structure (`App.tsx`)
- Public: `/`, `/login`, `/register`
- Protected: `/dashboard`, `/crear-viaje`
- Group routes (`/grupo/:id/*`) are wrapped in `GroupProvider` and use `GroupTabs` as layout, providing tab navigation between: `itinerario`, `actividades`, `gastos`, `chat`, `clima`, `transporte`

### State management
`GroupContext` (`src/contexts/GroupContext.tsx`) is the main state layer for group-scoped pages. It loads the current group from Firestore by `:id`, and provides `grupo`, `user`, `loading`, `error`, and `handleAddInvitado`.

### Firebase
`src/firebase/firebaseConfig.ts` exports `auth` and `db` (Firestore). All Firebase config is sourced from `VITE_FIREBASE_*` environment variables in `.env`.

### Styling
Each page has its own CSS file in `src/styles/` (e.g. `expenses.css`, `chat.css`). Global styles are in `src/styles/global.css` and `src/index.css`.
