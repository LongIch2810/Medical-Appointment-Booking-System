# Use React

## Status

Accepted

## Context

The admin app needs multiple interactive screens, including dashboards, role permissions, messages, settings, and reusable module pages. The project already uses Vite, TypeScript, React Router, Zustand, and React Query, so the UI layer should fit strict TypeScript, component reuse, and a mature frontend ecosystem.

## Decision

Use React for the admin app interface.

React components must be written as function components with JSX/TSX. Routing belongs in `src/routes/`, route-level screens belong in `src/pages/`, layouts belong in `src/layouts/`, shared client state belongs in `src/store/`, and reusable components belong in `src/components/`.

## Consequences

- UI can be split into small components that are easier to reuse and test.
- React Router handles in-app navigation without full page reloads.
- Zustand is suitable for lightweight UI or auth state; React Query is suitable for server state when real APIs are integrated.
- Contributors must follow React Hooks rules and avoid side effects during render.

## Implementation Guidelines

- Name components with PascalCase, for example `AdminDashboardPage.tsx`.
- Name custom hooks with the `useXxx` pattern, for example `useAuthStore`.
- Prefer the `@/*` alias for imports from `src`.
- Keep route-level components in `src/pages/`; do not put business logic inside UI primitives.
- Run `npm run lint` and `npm run build` before opening a pull request.
