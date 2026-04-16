# Gleam — Project Context

## What is Gleam
Quality control SaaS for residential cleaning businesses in the U.S.
Owners monitor cleaners completing photo-verified checklists in real time.

## ICP
Small cleaning business owners, 5–30 employees, non-tech-savvy, U.S. market.

## Pricing
- Starter: $49/mo — up to 5 cleaners
- Growth: $99/mo — up to 15 cleaners
- Pro: $179/mo — unlimited cleaners
- 14-day free trial, no credit card
- $9/cleaner/month overage above tier limit

## Rules — never break these
- Never change API contracts without updating /docs/api.md
- No direct database access from frontend
- All new endpoints must be documented before implementation
- Security agent must review any authentication changes

## Agents
- Frontend agent: UI only, reads /docs/api.md for contracts
- Backend agent: API + database, updates /docs/api.md on changes
- Security agent: reviews auth, data exposure, input validation
- Bug agent: fixes only, documents patterns in /docs/bugs.md

## Stack
- Next.js 16 + App Router + React 19 + TypeScript
- Tailwind CSS + Turbopack
- Supabase (PostgreSQL + Auth + Storage)
- Stripe (billing)
- Deploy: Vercel

## Visual Identity
- Primary: #38BDF8, #0EA5E9
- Secondary: #6366F1, #8B5CF6
- Background: #F8FAFC, #F1F5F9
- Text: #0F172A
- Font: Playfair Display (logo), Inter (body)
- References: Linear.app, Stripe.com