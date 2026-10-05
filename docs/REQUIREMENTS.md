# ACME Salary Manager: Requirements (one page)

**Persona:** HR Manager at ACME. 10,000 employees across 10 countries, today managed in Excel.
**Problem:** Spreadsheets are slow to search, easy to corrupt (wrong currency, duplicate rows, typos),
and make simple questions ("what do we pay a Senior Engineer in India?") a manual pivot-table exercise.

## Goal
Give the HR Manager a single web app where salary records are **correct by construction** and the
common pay questions are answered **in seconds, without Excel**.

## Questions the product must answer
1. *Find & fix:* "Where is Priya Patel's record? Update her salary."
2. *Benchmark:* "Is this person paid fairly vs. people with the same role in the same country?"
3. *Org view:* "What do we typically pay in each country? Which departments and roles pay most?"
4. *Drill down:* "Who are the Account Executives in Brazil, highest paid first?"

## In scope (MVP)
| Feature | Why it matters |
|---|---|
| **Employee directory:** search by name/email/code; filter by country, department, title; sort; paginate | Replaces Ctrl-F over a 10k-row sheet. Filters live in the URL, so views can be shared. |
| **Add / edit / delete employee** with validation | Positive whole-number salary, unique email, known country & department, no future hire dates. |
| **Currency derived from country** | Removes the single most common spreadsheet error (salary typed in the wrong currency). |
| **Peer comparison** on each employee: peer median, p25–p75 range, compa-ratio, percentile | Answers "is this fair?" right at the point of decision. |
| **Pay insights:** per-country headcount, median, p25–p75, mean, min/max | The org-level "how do we pay people" view. Median first, since means are skewed by outliers. |
| **Country breakdown:** distribution histogram, by department, by job title; click through to the people | Goes from a number to the employees behind it in one click. |
| **Sign-in and roles** *(added after the security review; originally out of scope)* | Salary data is sensitive. HR managers can edit; a read-only role covers people who need the numbers but must not change them. |
| **Seed script:** 10,000 realistic, deterministic employees | Realistic demo data; reproducible numbers. |

## Deliberately out of scope (and why)
| Left out | Reasoning |
|---|---|
| **Currency conversion / global totals** | Needs an FX source and a policy (which rate, which date). Silently mixing currencies gives *wrong* answers, which is worse than no answer. All stats are within one country. |
| **Salary history / audit trail** | High value (who changed what and when), but it doubles the data model. Next on the roadmap. |
| **User management, SSO, password reset** | Users are created by the seed. A real deployment would sign in through the company identity provider rather than store passwords. |
| **Bulk Excel/CSV import & export** | The obvious migration path off Excel, but it needs its own error-reporting UX. The seed script proves bulk insert works. |
| **Bonus, equity, payroll, tax, benefits** | Different products. This app manages *base salary* only. |
| **Levels / salary bands** | Would enable "out of band" alerts, but ACME has no band data yet. Peer p25–p75 is a data-driven proxy. |
| **Approval workflows, notifications** | Process tooling. Premature until there are multiple users. |

## Success criteria
- HR can find any employee in < 3 seconds and edit their salary in < 30 seconds.
- Every insight is reproducible from the data (deterministic seed, Excel-compatible percentiles).
- API responses for list, detail and insights stay < 200 ms on 10k employees (measured: 2–11 ms).
- Core logic covered by fast, deterministic tests (backend suite runs in < 1 s).
