# Kawisha Hub NG project progress tracker

The private `/progress` page is a small review view for the repository checklist. The Markdown checklist remains the source of truth; browser ticks are temporary local review state and do not change products, stock, orders, Supabase data, or business logic.

## How it works

- `docs/IMPLEMENTATION_CHECKLIST.md` contains the scoped work items and status markers.
- The page parses the checklist at build/request time and calculates completion from the current file.
- A checked item is a local acknowledgement saved in the current browser only.
- Resetting local ticks returns the page to the Markdown statuses.
- The page is inside the authenticated workspace and uses the existing Kawisha shell.

## Status rules

- `[x]` is complete for the current scope.
- `[~]` means implementation or evidence is still in progress.
- `[p]` means only part of the item is complete.
- `[!]` means blocked; include the reason in the checklist.
- `[ ]` means not started.

The progress percentage counts checked items only. It is intentionally simple so it stays readable and cannot be mistaken for live operational KPIs.

## Review flow

1. Update the Markdown checklist after a real change and its validation.
2. Open `/progress` while signed in to review the current sections.
3. Use local ticks for a walkthrough or handover session.
4. Reset the local ticks before starting a new review if needed.
5. Keep demo-mode results visibly separate from live business results.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Live Supabase, Storage, payment, browser, and deployment checks remain manual owner-approved work.
