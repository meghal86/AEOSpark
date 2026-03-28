# AEOSpark Autoresearch Program

This workspace adapts the idea from Karpathy's `autoresearch` repo to AEOSpark.
The key pattern to keep is not the GPU training code. The key pattern is:

1. define a benchmark loop
2. let the agent improve one core research surface
3. run the loop again
4. keep only changes that improve the benchmark without breaking realism

## Mission

Improve AEOSpark's scoring and audit quality for real public websites.

The goal is not to make every site score higher.
The goal is to make the scores and diagnoses more credible, more discriminating, and more useful for the paid audit flow.

## Primary file to improve

`src/lib/scoring.ts`

This is the main file the agent should iterate on.
Only change other files if the scoring loop genuinely requires it.

## Benchmark loop

Run:

```bash
npm run autoresearch:run
```

This evaluates the current scoring engine against the benchmark domains in `autoresearch/benchmarks/domains.json` and writes a timestamped result into `autoresearch/runs/`.

The runner also compares the current run to the previous run.

## What success looks like

- strong commercial SaaS sites should usually score above weak ones
- diagnoses should reference real evidence, not vague filler
- scores should remain within dimension weight limits
- crawl failures should degrade gracefully, not hallucinate confidence
- pricing, authority, crawler access, and brand footprint should not collapse into the same signal

## Guardrails

- do not optimize for inflated averages
- do not hardcode benchmark domains into scoring logic
- do not add fake data or fallback HTML
- do not change page UI as part of research work
- do not weaken security or URL validation

## Preferred research moves

- improve signal extraction from robots.txt and JSON-LD
- tighten evidence matching for pricing and authority
- reduce false positives in competitor/entity extraction
- improve diagnosis specificity
- make crawl-status handling more honest when data is partial

## Evaluation questions after every run

1. Did the ranking of domains become more believable?
2. Did diagnoses become more concrete?
3. Did any dimension become too easy to game?
4. Did crawl failures create misleadingly high scores?
5. Is the paid audit more persuasive because the evidence is sharper?

## Research discipline

- make one coherent hypothesis per iteration
- run `npm run autoresearch:run`
- inspect the newest JSON in `autoresearch/runs/`
- keep the change only if the output is more credible
