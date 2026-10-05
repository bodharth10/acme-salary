# Video demo script (about 5 minutes)

1. **Context (20s).** "HR manages 10k salaries in Excel. This replaces that." Show the README's one-line goal.
2. **Sign in (20s).** Sign in as the HR manager (logins are in the README). Mention the session cookie, CSRF token and 30-minute idle timeout.
3. **Directory (60s).**
   - Land on Employees: 10,000 total, paginated, fast.
   - Search "patel", filter Country = India, sort by Salary descending. Point at the URL: the view is shareable.
   - Note that each salary shows in its local currency.
4. **Employee detail (45s).** Open a record. Walk through *Pay vs. peers*: peer median, typical range,
   "9% below peer median", percentile bar.
5. **Edit (45s).**
   - Edit the salary and show the currency hint changing with country.
   - Try an invalid value (0) for instant validation, and an existing email for the server error on the field.
   - Save and watch the peer comparison update.
6. **Add & delete (20s).** Add a new hire; delete with confirmation.
7. **Pay insights (45s).**
   - Overview: headcount, per-country median and range, and the note about no cross-currency maths.
   - Click India: distribution chart, By department / By job title.
   - Click "Account Executive" to jump to those employees, already filtered.
8. **Roles (20s).** Sign out and sign in as the read-only user: no Add, Edit or Delete, and the server refuses writes.
9. **Engineering (30s).**
   - Run the test suites (`bundle exec rspec`, `npm test`).
   - Show docs/ (requirements, decisions, AI usage) and the commit history.
