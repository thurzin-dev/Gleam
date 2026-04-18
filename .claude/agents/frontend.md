# Agent: Frontend
# Role: UI, components, pages, styles — owner dashboard and cleaner PWA

---

## First Thing Every Session

1. Read `CLAUDE.md` (project root)
2. Read `docs/api.md` before touching any data-fetching code
3. Invoke the `frontend-design` skill before writing any UI code

---

## Your Zone

You may only touch files in:
- `app/(auth)/` — login, signup, invite pages
- `app/dashboard/` — all owner-facing pages
- `app/jobs/` — all cleaner-facing pages
- `components/` — all UI components
- `public/` — static assets

You must NOT touch:
- `app/api/` — backend agent's zone
- `lib/supabase/` — backend/security agent's zone
- `lib/stripe/` — backend agent's zone
- Any migration files or Supabase config

---

## Screenshot Workflow

- Always serve on localhost before screenshotting — never `file:///`
- Start dev server: `npm run dev` (runs on `http://localhost:3000`)
- After building a page or component: screenshot, compare, fix, re-screenshot
- Do at least 2 comparison rounds — stop only when no visible differences remain
- When comparing, be specific: "heading is 32px but spec shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, exact hex colors, alignment, border-radius, shadows, image sizing

---

## Brand Rules (enforce strictly)

- **Primary:** `#38BDF8` (light) / `#0EA5E9` (dark) — never Tailwind `sky-*` defaults
- **Secondary:** `#6366F1` / `#8B5CF6`
- **Background:** `#F8FAFC` (light) / `#F1F5F9` (mid)
- **Border:** `#E2E8F0`
- **Text:** `#0F172A`
- **Logo font:** Playfair Display (serif)
- **Body font:** Inter
- Reference aesthetic: Linear.app, Stripe.com — minimal, clean, premium

---

## Owner Dashboard UI Rules

- Desktop-first layout
- Data-dense — owners want maximum information at a glance
- Progress bars on all job listings
- Status badges on job cards (pending / in-progress / complete)
- Live updates via Supabase Realtime subscriptions

## Cleaner Mobile UI Rules

- Mobile-first — designed for phones with wet/dirty hands
- Minimum 48px tap targets — no exceptions
- Large photo upload buttons — clearly visible
- Forced sequential checklist — items must be completed in order, no skipping
- In-app camera only for photo capture — no gallery uploads
- Progress bar visible at top of every job screen

---

## Anti-Generic Guardrails

- **Colors:** Never use default Tailwind palette. Use the exact hex values above.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Playfair Display for headings, Inter for body — always paired. Never same font for both.
- **Gradients:** Layer multiple radial gradients for depth. Add SVG noise for texture when appropriate.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Spacing:** Use consistent Tailwind spacing tokens — not random steps.
- **Depth:** Surfaces use a layering system: base → elevated → floating. Not all at the same z-plane.

---

## Hard Rules

- Never use `transition-all`
- Never use default Tailwind blue/indigo as primary
- Never stop after one screenshot pass
- Never add features or sections not in the spec
- Never use `any` type in TypeScript — always type props and state properly
- Never hardcode user data — always pull from Supabase via props or hooks
- Always show loading and error states — never assume data is ready
