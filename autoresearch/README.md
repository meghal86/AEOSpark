# AEOSpark Autoresearch

This folder adapts the workflow idea from [karpathy/autoresearch](https://github.com/karpathy/autoresearch) to AEOSpark.

That repo is centered on a `program.md` file and a repeated experiment loop. The exact single-GPU training code in that repo is not the reusable part for AEOSpark. The reusable part is the research workflow:

- keep the benchmark fixed
- let the agent iterate on one core file
- run the benchmark again
- compare the new run to the previous run

For AEOSpark, the core research target is `src/lib/scoring.ts`.

## Files

- `program.md` — instructions for the research agent
- `benchmarks/domains.json` — public SaaS sites used as the benchmark set
- `run.ts` — evaluation runner that crawls and scores each benchmark site
- `runs/` — generated run history, ignored by git

## Usage

```bash
npm run autoresearch:run
```

This writes a new JSON artifact into `autoresearch/runs/` with:

- per-domain score
- per-dimension breakdown
- top strengths and gaps
- benchmark averages
- deltas versus the previous run

## Recommended workflow

1. Read `autoresearch/program.md`
2. Make a focused change in `src/lib/scoring.ts`
3. Run `npm run autoresearch:run`
4. Compare the new run to the previous run
5. Keep the change only if the benchmark became more credible
