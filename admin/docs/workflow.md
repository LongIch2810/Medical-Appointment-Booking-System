# Development Workflow

This document defines the required workflow for agents working on the admin frontend. The goal is to keep changes aligned with the request, the existing architecture, and a clear validation process.

## 1. Read Project Context First

Before coding, agents must read the relevant project documents:

- `AGENTS.md`: contributor rules, project structure, build/lint commands, and naming conventions.
- `DESIGN.md`: UI/UX guidance, visual style, colors, typography, and interface direction.
- `docs/decisions/`: accepted technical decisions such as React, Tailwind CSS + shadcn/ui, and Zustand.
- `docs/architecture.md`: architecture overview when the file has content.
- `docs/rules.md`: required rules for component reuse, file placement, state, security, dependencies, and final responses.

If the request affects UI, also inspect existing components in `src/components/ui/`, `src/components/app/`, and the related page in `src/pages/`.

## 2. Plan Before Coding

Always make a plan before editing files. The plan should identify:

- The user goal.
- Files or modules likely to be affected.
- Existing components, stores, services, or config that can be reused.
- Main risks, such as routing, permissions, auth, state, APIs, responsive UI, or visual regression.
- The validation steps to run after coding.

Do not start coding before understanding the current flow. If the request is ambiguous and a wrong change would be risky, ask a short clarification question first.

## 3. Code With Existing Tech Stack

When coding, follow the existing stack and patterns:

- React + TypeScript for UI.
- React Router for navigation.
- Tailwind CSS + shadcn/ui for styling and UI primitives.
- Zustand for shared client state.
- React Query or the existing service pattern for server state and APIs when real integrations exist.
- The `@/*` alias for imports from `src`.

Prefer small, scoped changes. Do not rewrite architecture, add dependencies, or delete code/files unless the user explicitly asks. Reuse existing components before creating new ones.

## 4. Keep Files in the Right Place

Place files by responsibility:

- Route-level screen: `src/pages/`.
- Layout: `src/layouts/`.
- UI primitive: `src/components/ui/`.
- Reusable business component: `src/components/app/`.
- Store Zustand: `src/store/`.
- Menu, permission, or module config: `src/config/`.
- Pure helper: `src/lib/`.
- Shared type: `src/types/`.
- Mock data: `src/mock/`.

Do not create vague folders such as `misc`, `temp`, `new`, or `common` unless the repository already uses that pattern.

## 5. Validate After Coding

After coding, agents must validate the result against the original request and the plan:

- Run `npm run lint` when TypeScript or React code changes.
- Run `npm run build` when the change may affect build output, types, or routing.
- For UI changes, run the app with `npm run dev` and check it in a browser when possible.
- Check loading, error, empty, disabled, and responsive states when the screen has data or interactions.
- Confirm the change does not break auth, permissions, navigation, or shared layout.

Do not claim that testing was completed unless the command or browser check actually ran.

## 6. Final Response Format

The final response must follow `docs/rules.md`, section `Final Response Rules`.

Include:

- Files created or changed.
- A short summary of the main changes.
- Validation performed, such as `npm run lint`, `npm run build`, or browser checks.
- Anything that could not be completed.
- Risks, assumptions, or follow-up work when relevant.

Keep the response concise, clear, and limited to relevant information.
