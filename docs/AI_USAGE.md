# How AI was used

I built this with an agentic coding assistant (Claude Code) as a pair programmer. I owned the product
and architecture decisions; the assistant drafted code and tests at speed; and I verified every step by
running the test suites, the linters and the real app in a browser.

## Workflow

1. **Requirements first.** Before any code, I wrote the one-page requirements with the AI as a
   sparring partner. The prompt was framed around the persona's *questions* ("what does a Senior
   Engineer in India earn?") rather than features. That produced the peer comparison and the
   "no cross-currency maths" decision.
2. **Plan, then build in vertical slices.** Schema + pure stats → query/insights services → seeder →
   API → UI → tests → deploy. Each slice was committed separately (see the git history).
3. **Tests alongside code.** For each service, the prompt asked for specs that read as documentation
   (e.g. *"shows why median matters: one outlier moves the mean, not the median"*).
4. **Verify in the real app.** The assistant drove the running app in a browser (list → detail →
   edit salary → see peer comparison update → insights) and measured endpoint latencies with `curl`.

## Representative prompts

> "Act as a product-minded engineer. The persona is an HR manager replacing Excel for 10k employees in
> 10 countries. List the questions they need answered, then propose an MVP scope and what to leave out,
> with reasons. Keep it to one page."

> "Design a Rails 7 API-only backend with SQLite. Keep controllers thin; put filtering/sorting/
> pagination in a query object and statistics in a pure module with no DB access. Percentiles must
> match Excel PERCENTILE.INC."

> "Write a deterministic seed generator for 10,000 employees: country-specific salary bases in local
> currency, title multipliers, tenure effect, noise. Use insert_all in batches and add a spec proving
> seeded rows pass model validations, since insert_all skips them."

> "Build the React UI with Mantine and React Query. Filters must live in the URL. Show salaries in local
> currency with Intl. Explain the compa-ratio in plain words for a non-analyst."

## Where I corrected or overrode the AI

Tests and manual checks caught these. They're the reason every step was verified rather than trusted:

- **Constant scoping bug:** the first `Country` draft defined constants inside a `Data.define do … end`
  block, which in Ruby leaks them to the top-level namespace. I changed it to `class Country < Data.define(...)`.
- **Compact currency formatting:** `Intl` currency style forces two minimum fraction digits, so `$125K`
  rendered as `$125.0K`. A unit test caught it, and the fix was `minimumFractionDigits: 0`.
- **Request specs** initially lacked `type: :request`, and `:unprocessable_entity` is deprecated in
  current Rack. Both were fixed (`:unprocessable_content`).
- **Date handling:** I rejected a first approach using JS `Date` objects for hire date (timezone
  off-by-one risk) in favour of ISO `YYYY-MM-DD` strings end to end.
- **Scope control:** I declined suggestions to add Ransack, Pagy and a serializer gem. Each is small
  to write by hand, and hand-written code is easier for a reviewer to read in full.
- **Bundle size:** the build warned about a 900 kB chunk, so I lazy-loaded the chart page.
- **Security review:** I asked for an OWASP Top 10 audit after the feature work. The scanners found
  what a read-through missed: Rails 7.2 had passed end of support and React Router had two advisories.
  Upgrading to Rails 8.1 then failed to boot on Ruby 3.3.0 (a known parser bug), so Ruby moved to 3.4.
  The existing test suite is what made those upgrades safe. I kept authentication out of scope and
  documented it as the main open risk instead of bolting on a half-built login.
- **CI caught a real mistake:** the first CI run failed because `db:prepare` seeds a fresh database,
  so specs started with 10,000 rows. Fixed by loading the schema only.
