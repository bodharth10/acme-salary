# Video demo script (about 4 minutes)

1. **Context (20s).** "HR manages 10k salaries in Excel. This replaces that." Show the README's one-line goal.
2. **Directory (60s).**
   - Land on Employees: 10,000 total, paginated, fast.
   - Search "patel", filter Country = India, sort by Salary descending. Point at the URL: the view is shareable.
   - Note that each salary shows in its local currency.
3. **Employee detail (45s).** Open a record. Walk through *Pay vs. peers*: peer median, typical range,
   "9% below peer median", percentile bar.
4. **Edit (45s).**
   - Edit the salary and show the currency hint changing with country.
   - Try an invalid value (0) for instant validation, and an existing email for the server error on the field.
   - Save and watch the peer comparison update.
5. **Add & delete (20s).** Add a new hire; delete with confirmation.
6. **Pay insights (45s).**
   - Overview: headcount, per-country median and range, and the note about no cross-currency maths.
   - Click India: distribution chart, By department / By job title.
   - Click "Account Executive" to jump to those employees, already filtered.
7. **Engineering (30s).**
   - Run the test suites (`bundle exec rspec`, `npm test`).
   - Show docs/ (requirements, decisions, AI usage) and the commit history.
