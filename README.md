AEOSpark is a Next.js implementation of the FRD you attached: free score widget, lead capture gate, paid audit checkout, confirmation flow, and a client monitor portal.

## What is built

- Landing page with AEOSpark positioning and URL intake
- URL scoring engine with six AEO dimensions
- Optional competitor comparison during score creation
- Score results page with diagnostics and recommendation preview
- Email gate that unlocks the full recommendation set
- Local mock automation for welcome and follow-up email jobs
- Audit checkout flow with success and decline branches
- Confirmation page with portal handoff
- Client portal for citation-share reporting and BYOK readiness
- Local JSON persistence in `data/*.json`

## Getting started

Install dependencies and run the app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Local storage

This build is intentionally runnable without vendor credentials. Records are written to:

- `data/scores.json`
- `data/leads.json`
- `data/orders.json`
- `data/clients.json`
- `data/jobs.json`

## Provider swap points

Replace the local adapters when you are ready:

- `/src/app/api/score/route.ts` -> persist scores to Supabase and enqueue Inngest
- `/src/app/api/leads/route.ts` -> send Resend emails and CRM events
- `/src/app/api/orders/route.ts` -> create Stripe PaymentIntents or Checkout Sessions
- `/src/lib/storage.ts` -> swap JSON persistence for Supabase tables
- `/src/app/monitor/[clientId]/page.tsx` -> replace seeded portal data with live citation runs

## Environment

See [.env.example](/Users/meghalparikh/Downloads/AEOSpark/.env.example) for the expected variables.

## Notes

- The crawler uses live `fetch()` when possible and falls back to a heuristic HTML shell if a site blocks or times out.
- The checkout flow is local-first. The `Pay $2,500` button records a successful order and creates the client portal.
- The decline button intentionally demonstrates the error branch from your user flow.
