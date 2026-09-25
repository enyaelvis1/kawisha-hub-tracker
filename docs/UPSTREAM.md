# Upstream references

Inspected on 24 September 2026 from the current public sources before implementation.

## Application foundation

- Supabase quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Vercel Supabase starter: https://vercel.com/templates/next.js/supabase
- Command used: `npx create-next-app@latest kawisha-hub-tracker --example with-supabase --use-npm`
- Scaffold tool version observed: `create-next-app@16.3.6`.
- The generated project uses the current `with-supabase` structure with `@supabase/ssr`, cookie-based server clients, TypeScript, Tailwind, and shadcn/ui primitives. Installed versions for this build: Next.js `16.3.6`, `@supabase/ssr` `0.12.7`, and `@supabase/supabase-js` `2.117.1`.

## UI reference

- Repository: https://github.com/arhamkhnz/next-shadcn-admin-dashboard
- Inspected commit: `01999b336145a3853314043205e25290efebaca2`
- License: MIT, copyright Mohammed Arham Khan (2024).
- Used as a visual reference for the responsive dashboard shell, sidebar/mobile navigation, summary cards, tables, filters, and spacing. Demo pages and wholesale package files were not copied.

## Inventory reference

- Repository: https://github.com/BoviliusMeidi/inventory-management
- Inspected commit: `e392ecdf2436c987540e499653674ffd4bbfb522`
- License: MIT, copyright Bovilius Meidi (2025).
- Used to study stock indicators and movement-history patterns. Its `schema.sql` was not copied or run; Kawisha Hub uses the smaller tenant-scoped migration in `supabase/migrations/`.

## Landing page reference

- Repository: https://github.com/nobruf/shadcn-landing-page
- Inspected commit: `ec8e18e8ed56ed6636023ced09948515c19258cc`
- License: MIT, copyright Bruno Felipy (2025).
- README and license inspected from the repository’s current public sources before implementation.
- Used selectively for the landing page’s rounded navigation shell, hero with product preview, compact feature cards, workflow sections, responsive spacing, and closing call to action. The reference’s images, demo pages, and additional dependencies were not copied.

## Attribution

The references remain MIT-licensed upstream inspiration. No substantial source code from any reference repository was copied into this project. See `THIRD_PARTY_NOTICES.md` for retained attribution text.
