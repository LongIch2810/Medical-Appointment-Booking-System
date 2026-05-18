# Use Tailwind CSS and shadcn/ui

## Status

Accepted

## Context

The admin app needs a consistent interface that can scale across many operational screens. The project already uses Tailwind CSS v4, Radix UI, `lucide-react`, `class-variance-authority`, `tailwind-merge`, and a `components.json` configuration using the shadcn/ui `new-york` style.

## Decision

Use Tailwind CSS as the primary styling system and shadcn/ui as the base for UI primitives.

Primitives belong in `src/components/ui/`, for example `button.tsx`, `card.tsx`, `dialog.tsx`, and `input.tsx`. Business components or components composed from multiple primitives belong in `src/components/app/`.

## Consequences

- UI development is faster because utility classes and existing primitives cover common needs.
- The interface stays consistent through tokens, CSS variables, and variants.
- Radix UI provides an accessible base for dialogs, sheets, avatars, and interactive controls.
- Tailwind class lists can grow long, so components should be split carefully and conditional classes should use the `cn` helper from `src/lib/utils.ts`.

## Implementation Guidelines

- Reuse components from `src/components/ui/` before creating a new primitive.
- Use `lucide-react` for icons in buttons, toolbars, and actions.
- Keep styling close to the component it serves; avoid global CSS when utility classes are clear enough.
- Use `class-variance-authority` for complex variants, following the shadcn/ui pattern.
- Do not customize a UI primitive for one specific screen; compose behavior in `src/components/app/` or `src/pages/`.
- Check the UI with `npm run dev` and verify the production build with `npm run build`.
