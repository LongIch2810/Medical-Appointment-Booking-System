# Repository Guidelines

## Project Structure & Module Organization

This repository contains the admin frontend for the Medical Appointment Booking System. It uses Vite, React, and TypeScript.

- `src/main.tsx` bootstraps the React app.
- `src/App.tsx` and `src/routes/AppRoutes.tsx` define the app shell and routes.
- `src/pages/` contains route-level screens such as dashboards, settings, messages, and error pages.
- `src/components/ui/` contains reusable UI primitives; `src/components/app/` contains composed app components.
- `src/layouts/`, `src/config/`, `src/store/`, `src/services/`, `src/mock/`, `src/lib/`, and `src/types/` hold layouts, navigation/config data, Zustand stores, API/mock data, helpers, and shared types.
- `public/` stores static assets such as `logo.jpg` and `banner.png`.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the local Vite development server.
- `npm run build` runs TypeScript project checks and creates a production build.
- `npm run lint` runs ESLint across the project.
- `npm run preview` serves the production build locally for verification.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Keep files focused by feature or responsibility. Use PascalCase for React components and page files, such as `AdminDashboardPage.tsx`; use camelCase for functions, variables, hooks, and store fields. Custom hooks should use the `useXxx` pattern, for example `useAuthStore`.

Prefer the configured `@/*` path alias for imports from `src`. Keep strict TypeScript clean: unused locals and parameters are build errors. Follow the ESLint configuration in `eslint.config.js`, including React Hooks rules and React Refresh export constraints.

## Testing Guidelines

No test runner is currently configured in `package.json`. Before opening a pull request, at minimum run `npm run lint` and `npm run build`. If tests are added, place them near the code they cover using names like `ComponentName.test.tsx` or `module.test.ts`, and document the test command in `package.json`.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive messages, often with Conventional Commit prefixes such as `fix:` and `refactor:`. Prefer messages like `fix: correct role permission routing` or `refactor: simplify dashboard module config`.

Pull requests should include a concise summary, affected screens or modules, verification steps, and screenshots for visible UI changes. Link related issues and note new environment variables or config changes.

## Security & Configuration Tips

Do not commit secrets or local credentials. Keep environment placeholders in `.env.example` and document required variables when adding API integrations. Treat `src/mock/` data as development-only fixtures unless explicitly wired to production behavior.

## Naming Rules

- Folders: `kebab-case`
- Regular files: `kebab-case`
- React components: `PascalCase`
- Hooks: `useSomething`
- Functions: `camelCase` with action verbs
- Variables: `camelCase`
- Booleans: `isX`, `hasX`, `canX`, `shouldX`
- Types/interfaces: `PascalCase`
- Props types: `ComponentNameProps`
- Constants: `UPPER_SNAKE_CASE`
- Routes: lowercase `kebab-case`

Most important:

- Reuse existing components before creating new ones.
- Place files in the correct folder based on responsibility.
- Never delete code, files, folders, routes, tests, or configuration unless explicitly requested.
