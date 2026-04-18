# CLAUDE.md — Gleam Global Context

> Read this file at the start of every session, every agent, no exceptions.
> Then read your agent-specific file at `.claude/agents/<your-role>.md`.

---

## ⚠️ Critical: Next.js Version Warning

**This is NOT the Next.js from your training data.**
This version may contain breaking changes — APIs, conventions, and file structure may differ significantly. **Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.** Heed all deprecation notices. Do not assume any Next.js pattern from memory — verify first.

---

## What Is Gleam?

Gleam is a **B2B SaaS quality control platform** for small residential cleaning businesses in the United States (5–30 employees). It gives owners real-time visibility into every cleaning job via photo-verified checklists completed by cleaners on mobile.

- **Owner** = desktop dashboard, manages properties, checklists, jobs, and team
- **Cleaner** = mobile PWA, receives jobs, completes photo checklists room by room
- **Domain:** gleamqc.com (Vercel + Namecheap)
- **Status:** Late MVP — fixing bugs before public launch

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16, App Router, React 19, TypeScript, Tailwind CSS, Turbopack |
| Database | Supabase PostgreSQL with Row Level Security (RLS) |
| Auth | Supabase Auth — email/password + Google OAuth |
| Storage | Supabase Storage — bucket: `job-photos` |
| Payments | Stripe — Checkout, Customer Portal, Webhooks |
| Deploy | Vercel (auto-deploy on push to `main`) |

---

## Database Schema

Six tables. Every table uses `org_id` for multi-tenant isolation. RLS is enforced at the DB level — never bypass it.

| Table | Purpose |
|---|---|
| `organizations` | Company account, plan, trial dates, Stripe customer/subscription IDs |
| `profiles` | User accounts linked to org. Role: `owner` or `cleaner` |
| `properties` | Client homes with address and checklist templates |
| `checklist_templates` | JSONB array of rooms and items per property |
| `jobs` | Scheduled cleaning tasks — links property, cleaner, date |
| `job_items` | Individual checklist items within a job — photo URL + completion status |

---

## User Roles

**Owner**
- Signs up → creates org → adds properties and checklists → assigns jobs → monitors dashboard
- Redirect after login: `/dashboard`
- Desktop-first UI — data-dense, high information at a glance

**Cleaner**
- Receives invite link from owner → creates account → joins existing org → sees today's jobs → completes photo checklists
- Redirect after login: `/jobs`
- Mobile-first UI — large tap targets (minimum 48px), designed for wet/dirty hands

> Never create a new organization during cleaner login. Only owners create orgs on signup.

---

## Brand & Visual Identity

### Color Palette (use exact hex — never invent new brand colors)

| Role | Name | Hex |
|---|---|---|
| Primary (light) | Sky blue | `#38BDF8` |
| Primary (dark) | Ocean blue | `#0EA5E9` |
| Secondary | Indigo | `#6366F1` |
| Accent | Violet | `#8B5CF6` |
| Background light | Off white | `#F8FAFC` |
| Background mid | Light gray | `#F1F5F9` |
| Border | Slate | `#E2E8F0` |
| Text primary | Dark slate | `#0F172A` |

### Typography
- **Logo:** Playfair Display (serif) — premium, trustworthy
- **Body:** Inter — clean, modern, legible at small sizes
- Never use the same font for headings and body
- Tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body

### Design References
- Linear.app, Stripe.com — minimal whitespace, clean cards, subtle borders
- No heavy shadows, no busy UI, no generic indigo-500/blue-600 Tailwind defaults

---

## Folder Structure (critical — each agent only touches its zone)

```
GLEAM/
├── src/
│   ├── app/
│   │   ├── (auth)/          ← login, signup, invite pages
│   │   ├── dashboard/       ← owner-facing pages
│   │   ├── jobs/            ← cleaner-facing pages
│   │   └── api/             ← API routes (backend agent zone)
│   ├── components/
│   │   ├── ui/              ← shared UI primitives
│   │   ├── owner/           ← owner-specific components
│   │   └── cleaner/         ← cleaner-specific components
│   └── lib/
│       ├── supabase/        ← Supabase client, server, middleware
│       └── stripe/          ← Stripe helpers
├── supabase/                ← migrations, seed (security agent zone)
├── docs/
│   ├── api.md               ← API contracts between agents
│   ├── security.md          ← RLS rules and auth logic
│   └── bugs.md              ← known bugs and fix log
├── AGENTS.md                ← Next.js version warning (do not remove)
├── CLAUDE.md                ← this file
├── PROJECT.md               ← legacy context (superseded by this file)
└── .claude/
    └── agents/
        ├── frontend.md
        ├── backend.md
        ├── security.md
        └── bugfix.md
```

---

## Agent Responsibilities

| Agent | Zone | Key Rule |
|---|---|---|
| Frontend | `src/app/(auth)/`, `src/app/dashboard/`, `src/app/jobs/`, `src/components/` | Read `docs/api.md` before any data-fetching code |
| Backend | `src/app/api/`, `src/lib/supabase/`, `src/lib/stripe/` | Update `docs/api.md` on every API contract change |
| Security | `supabase/migrations/`, `middleware.ts`, `docs/security.md` | Never fix bugs by relaxing a security rule |
| Bugfix | Read anywhere, write carefully | Minimal fix only — no refactoring while fixing |

---

## Global Hard Rules

- **Never bypass RLS.** Never use the Supabase service role key on the client side.
- **Never create a new org during cleaner login.** Only owner signup creates an org.
- **Never change API contracts** without updating `docs/api.md` first.
- **No direct database access from frontend** — always go through API routes.
- **Never use `transition-all`** in CSS/Tailwind.
- **Never use default Tailwind blue/indigo** (`blue-600`, `indigo-500`) as primary — use hex values above.
- **Never touch files outside your agent's zone** without stating why.
- **Never silently fail.** All async actions must produce a toast notification or visible error.
- **Always include `org_id`** on every insert to a multi-tenant table.
- **Always read `docs/api.md`** before calling or modifying any API route.
- **All new endpoints must be documented** in `docs/api.md` before implementation.
- **Security agent must review** any authentication or RLS changes.
- **Commit messages must be specific:** `fix: owner dashboard job list missing org_id filter` — not `fix: bug`.

---

## Pricing (for billing-related work)

| Plan | Cleaners | Monthly | Annual |
|---|---|---|---|
| Starter | Up to 5 | $49/mo | $490/yr |
| Growth | Up to 15 | $99/mo | $990/yr |
| Pro | Unlimited | $179/mo | $1,790/yr |

- 14-day free trial, no credit card required
- Overage: $9/cleaner/month when account exceeds tier limit
- Trial end nudge: annual plan with 2 months free

---

## UX Principles

- Toast notifications for all async actions — never silent failures
- Progress bars everywhere jobs are listed
- Owner screens: desktop-first, data-dense
- Cleaner screens: mobile-first, large buttons, generous spacing, one-handed use
- Minimum 48px tap targets on all cleaner UI — no exceptions
