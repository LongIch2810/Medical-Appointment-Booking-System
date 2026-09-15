# Doctor schedule week-grid redesign

## Context

`admin/`'s "Lịch khám cá nhân" module (`DoctorSchedulesModule` in `admin/src/pages/GenericModulePage.tsx`, self-service weekly shift management for the signed-in doctor) currently shows one day at a time: a row of day-pill tabs (Thứ 2 → Chủ nhật) above a single `<table>` that only renders the selected day's shifts. Seeing the whole week requires clicking through all 7 tabs one at a time, and the table renders sparse/wasted columns (`Ngày` repeats the same value for every row) since only one day is visible per view.

This follows on from a separate bug fix (same session) that corrected `DoctorScheduleFormDialog` to collect `day_of_week` instead of a calendar date — this spec only concerns the list layout, not that dialog's fields.

**Goal:** Show the entire week at once so the doctor can see their whole schedule in one glance, calendar-style, without losing any existing functionality (create/edit/activate/deactivate/delete, permission gating, loading/error/empty states).

**Non-goals:** No change to the create/edit dialog's fields, no change to the API/hook layer (`usePersonalSchedules`, `useCreateDoctorSchedule`, `useUpdateDoctorSchedule`, `useUpdateDoctorScheduleStatus`, `useDeleteDoctorSchedule` all stay as-is), no change to permissions logic, no change to other `GenericModulePage` modules.

**Note on `admin/DESIGN.md`:** that file describes an unrelated "Cohere" white-canvas editorial visual system that does not match the app's actual dark navy/teal theme (confirmed against the real screenshot). This design follows the app's real, currently-implemented theme (existing `Card`/`Badge`/`Button`/`dark:` Tailwind classes already used throughout `GenericModulePage.tsx`), not `DESIGN.md`.

## Approach

Replace the day-tabs + single table with a **7-column week grid**: one column per day (Monday → Sunday, matching the existing `DAYS_OF_WEEK` order), each column rendering that day's shifts as small stacked cards. This was chosen over two alternatives considered during brainstorming:

- *Flat table, all days, tab-as-filter* — smallest diff, but doesn't give the "whole week at a glance" feel the user asked for; still reads as a spreadsheet.
- *Vertical accordion per day* — closer to a calendar feel than the flat table, but still requires scrolling/expanding to compare days, and is a bigger structural change than the grid for less visual payoff.

The grid was preferred by the user and best matches the stated goal (calendar-like, whole week visible at once).

## Component design

All changes stay inside `admin/src/pages/GenericModulePage.tsx` (existing module, no new files — consistent with `docs/rules.md` §1/§2 on reuse and file placement, since this is a single self-contained module already living in this file).

### `DoctorSchedulesModule` (existing function, restructured render)

- Keeps its existing hooks/state exactly as-is: `usePersonalSchedules`, `useCreateDoctorSchedule`, `useUpdateDoctorScheduleStatus`, `useDeleteDoctorSchedule`, `usePermission`-derived `canCreate/canUpdateStatus/canDelete/canEdit`, `groups`/`availableDays`/`orderedDays` (unchanged — still the source of truth for which days to render and in what order).
- Drops `selectedDay` state and the day-pill tab row entirely — no single-day selection anymore.
- `CardHeader` keeps the "Lịch khám cá nhân" title and a single top-level "+ Thêm ca" button (opens the create dialog with no day preselected, same as today) for discoverability, in addition to per-column add buttons (see below).
- `CardContent` renders a CSS grid instead of a `<table>`: `grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3` (auto-fit/minmax means it naturally collapses from 7 columns down to fewer, then to 1, as viewport shrinks — no manual breakpoint list needed, matching how the rest of this file avoids bespoke breakpoint logic). One `DayColumn` per entry in `orderedDays`.
- Loading/error states unchanged: `if (isLoading) return <LoadingState />; if (isError) return <ErrorState onRetry={...} />;` still gate the whole module before the grid renders.

### `DayColumn` (new small sub-component, same file)

Props: `{ day: {value, label}, schedules: DoctorSchedule[], canCreate, canEdit, canUpdateStatus, canDelete, isMutating, onCreate: (day: string) => void }`.

- Renders a `Card` (reusing the existing rounded/bordered card styling already used for the module's outer card, just nested) with a small header row: day label (`Thứ 2`, ...), a count badge (reusing the same pill-badge treatment already used for tab counts today), and a compact icon `Button` (`+`) that calls `onCreate(day.value)` — wired to open `DoctorScheduleFormDialog` in create mode with `initialDayOfWeek={day.value}` (new prop, see below) so the dialog opens pre-set to that column's day instead of defaulting to Monday.
- Body: maps `schedules` to `ShiftCard`. If empty, renders a single muted line ("Chưa có ca") instead of the full `EmptyState` component — `EmptyState` is designed for whole-page/whole-section absence, not a single empty grid cell; a full illustrated empty state per column would be visually heavy repeated up to 7 times. This is a deliberate, narrow deviation from reusing `EmptyState` here, justified because the column is a small grid cell, not a section — the module-level empty state (further below) still uses it.
- If every day is empty (no schedules at all for this doctor), the grid still renders (7 columns, each showing "Chưa có ca") rather than swapping to a single `EmptyState` — deliberate, since the grid itself communicates "no shifts yet" clearly per day, and keeps the create affordances (each column's `+`) visible and immediately actionable, more useful than one big blank-state message.

### `ShiftCard` (new small sub-component, same file)

Props: `{ schedule: DoctorSchedule, canEdit, canUpdateStatus, canDelete, isMutating, onUpdateStatus, onDelete }`.

- Small bordered/rounded card: time range (`start_time - end_time`) as the primary line, `Badge` (`success`/`outline`) for Active/Inactive below it (same badge usage as today's table).
- Actions: reuses `ActionCell` (already `flex flex-wrap`, so it wraps gracefully at narrow card widths without introducing a new dropdown-menu pattern) containing the same four actions as today, unchanged: `DoctorScheduleFormDialog` (edit trigger, `Sửa`), `ViewDetailButton` (`Xem`, same rows as today), the Kích hoạt/Tạm ngưng `Button`, and `ConfirmDialog` (`Xóa`) — same handlers/permission gates as the current table row, just inside a card instead of a `<td>`.

### `DoctorScheduleFormDialog` (existing component, one additive prop)

- Add optional `initialDayOfWeek?: string` prop, used only in `mode="create"`: `useState(initial?.day_of_week ?? initialDayOfWeek ?? DAYS_OF_WEEK[0].value)`. Edit mode behavior is untouched (`initial?.day_of_week` still wins). This is the only change to the dialog itself — its fields/submit logic from the earlier bug fix are unchanged.

## Data flow

No changes. `usePersonalSchedules()` still returns the same `GroupedDoctorSchedules` (`Record<string, ...[]>`) shape; `groups`/`availableDays`/`orderedDays` computation is reused verbatim from the current implementation — only the render output changes from "table filtered to `groups[selectedDay]`" to "grid mapping over all of `orderedDays`, each column reading `groups[day.value]`". Create/update/delete/status mutations are unchanged and still invalidate the same query keys they do today.

## Responsive behavior

`grid-cols-[repeat(auto-fit,minmax(180px,1fr))]` lets the browser decide the column count from available width (≈7 on a wide desktop, fewer on laptop/tablet, 1 on mobile) without hand-maintained breakpoints — consistent with how CSS grid is already the simplest fit here given the existing codebase doesn't otherwise define custom breakpoint tokens for this file. Each `ShiftCard`'s internal `ActionCell` already wraps, so narrow single-column mobile rendering still works without further changes.

## States

- **Loading:** unchanged, `<LoadingState />` for the whole module.
- **Error:** unchanged, `<ErrorState onRetry={refetch} />` for the whole module.
- **Empty (per day):** muted inline text inside that `DayColumn`, not a full `EmptyState` (see rationale above).
- **Empty (whole week):** grid still renders with 7 empty columns (see rationale above) — no separate whole-module empty state.
- **Mutating:** `isMutating` (unchanged derivation) still disables the status-toggle button the same way it does today.

## Validation plan

- `npm run lint` and `npm run build` in `admin/` (no test runner configured there, per `AGENTS.md`).
- Manual check in `npm run dev` once Postgres/Redis (Docker) are reachable to actually sign in as a doctor and view the grid with real data across multiple days, including: an empty week, a week with shifts on some days only, creating a shift from a specific column's `+` (confirming it pre-fills that day), edit/activate/deactivate/delete from a `ShiftCard`, and narrow-viewport collapse behavior.
