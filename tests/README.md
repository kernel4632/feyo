# Tests

Browser tests import the actual `/src/elements.js` entry through Vite, not a mock or `dist`.
The fixture can also mount a Vue SFC to check Vue consumers and component styles.

Parent agent owns dependencies and package scripts. Before running, add `@playwright/test`
as a dev dependency and install Chromium (`pnpm exec playwright install chromium`).
Then run `pnpm exec playwright test`. No package changes or installs are made by this task.
The timer tests use Playwright's clock API (Playwright 1.45 or newer).

`playwright.config.js` starts its own Vite server on port 5188 with strict port checking.
Use `KIMA_TEST_PORT` to choose a free port. Both desktop and mobile Chromium run the suite.
Failures preserve a trace in `test-results/`; do not commit generated artifacts.

The SSR check needs only existing Vue/Vite dependencies:
`node --test tests/notification.ssr.test.js`.

Table sorting deliberately remains external: the test verifies the sort event, then
applies the caller's sort and updates `sortKey`/`sortDirection`. `items` keeps priority
over `rows`, including `items: []`. Use a unique `rowKey` when data can be reordered.

Select's empty placeholder submits `""` and fails native `required`. Reset restores the
initial value and emits `update:modelValue`, but no user `change`. Numeric values stay
numeric in component events and submit as strings. Object values stay objects in events,
but native HTML submission uses `String(value)` (`[object Object]`); use primitive keys
for native forms. Arrays similarly submit their comma-separated string conversion.
