# Portfolio: instructions for Claude

- Read `PROGRESS.md` at the start of every session. It is the source of truth for the portfolio's state, rules and plans.
- **After every change to the site, update `PROGRESS.md` in the same turn:** add a dated line to the changelog (section 10), update the "Last updated" date, and update any section the change affects (status, site map, known issues, next steps).
- Follow the client's standing rules in `PROGRESS.md` section 2 (one button style, one link style, no glows, theme palette).
- **Save credits: delegate easy work to smaller models.** Simple tasks (searching and reading code, mechanical edits, running the test harness, checking screenshots, updating `PROGRESS.md`) go to subagents on a small model (Agent tool with `model: "haiku"`, or `"sonnet"` for moderate tasks). Use high models only for difficult or complex work (design, tricky debugging, architecture) or when the user asks for one.
