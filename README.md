AEOSpark is a Next.js app for AI visibility scoring, lead capture, Stripe-hosted audit checkout, confirmation flow, PDF delivery, and the foundations for a retainer client portal.

## Local development

```bash
npm install
npm run dev
```

## Paid delivery checks

The paid audit path now fails loud in production:

- `AEOSPARK_EMAIL_FROM` must be set to a verified sender domain
- `AEOSPARK_ENCRYPTION_KEY` must be set to a unique production secret
- paid delivery emails no longer silently degrade to mock mode

Run the integration suite with:

```bash
npm run test:e2e
```

## Proof assets

Public proof assets are available at:

- `/proof/sample-audit-report.html`
- `/proof/alphawhale-case-study.html`
- `/proof/citation-share-story.html`

Open [http://localhost:3000](http://localhost:3000).

## Required env vars

See [.env.example](/Users/meghalparikh/Downloads/AEOSpark/.env.example).

Current production-relevant vars:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_AUDIT_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `CRAWLER_SERVICE_URL`

## Deployment notes

- Frontend/API deploys to Vercel.
- The crawler service should run separately and be exposed via `CRAWLER_SERVICE_URL`.
- Stripe webhooks must point to `/api/stripe/webhook` on the public Vercel domain.
- Supabase remains the source of truth for scores, leads, orders, audits, clients, and citation results.

## Verification

```bash
npm run lint
npm run build
```

## Autoresearch

This repo includes an `autoresearch/` workspace inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch), adapted to AEOSpark's scoring engine instead of single-GPU model training.

Run the benchmark loop with:

```bash
npm run autoresearch:run
```

Then inspect:

- [autoresearch/program.md](/Users/meghalparikh/Downloads/AEOSpark/autoresearch/program.md)
- [autoresearch/README.md](/Users/meghalparikh/Downloads/AEOSpark/autoresearch/README.md)
