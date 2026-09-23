# Survey Shark

Offline-capable field data collection platform. Built for a Solomon Islands National
University research unit collecting ~1,000 survey responses (100 students × 10
participants each), designed to support additional surveys in future without
rebuilding the app.

## How it works

- **Surveys are code-defined.** Each survey is a JSON-like definition in
  `src/lib/surveys/definitions/`, registered in `src/lib/surveys/registry.ts`. The
  rendering engine, database schema, and CSV export are all generic — they read
  whatever sections/questions/options a definition declares. Adding survey #2 means
  adding a new definition file and one line in the registry, then redeploying.
- **Collection pages are static.** `/collect/[slug]` is pre-rendered at build time
  (see `generateStaticParams`), so once a student's phone has loaded it once, the
  form itself needs no network at all.
- **Offline-first submission.** Answers are saved to the browser's IndexedDB
  (`src/lib/offline/db.ts`) the moment a participant finishes, then synced to the
  server in the background whenever a connection is available
  (`src/lib/offline/sync.ts`). A student can complete all 10 interviews with zero
  signal and sync once back at their accommodation.
- **Lightweight access control**, not full auth:
  - Field collectors enter a shared access code + their student researcher ID once
    per device (`/api/collector/verify`); this is stored in `localStorage` so it
    survives offline use. Responses carry no participant PII by design, so this gate
    exists to keep the form off random devices and attribute submissions — not to
    protect sensitive data.
  - The researcher admin dashboard (`/admin`) uses a single shared password
    (`ADMIN_PASSWORD`), signed into an HTTP-only cookie.
- **CSV export is fully generic.** `src/lib/surveys/flatten.ts` turns any survey's
  answers into spreadsheet-ready columns (one column per single/text question, one
  dummy column per multi-select option, one column per matrix row) — no
  per-survey export code needed.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon (or any) Postgres connection string |
| `COLLECTOR_ACCESS_CODE` | Shared code students enter to unlock the field app |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `ADMIN_SESSION_SECRET` | Random long string used to sign the admin session cookie |

Push the schema and seed the survey registry into the database:

```bash
npm run db:push
npm run db:seed
```

`npm run db:seed` just registers surveys in the DB so they show up on the admin
dashboard before any responses exist — it's not required for data collection to
work, since the API also registers a survey on its first submitted response.

Note: `next dev`/`next build` run with `--webpack` here, not Turbopack — the
Serwist PWA plugin (offline service worker) doesn't yet support Turbopack.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. In the Vercel project's Environment Variables, set `DATABASE_URL`,
   `COLLECTOR_ACCESS_CODE`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` (use
   different, stronger values than local dev).
3. Deploy. Then run `npm run db:push` (and optionally `npm run db:seed`) once
   locally against the **production** `DATABASE_URL` to create the tables.
4. Visit `/admin/login`, sign in, and optionally paste a roster of valid student
   researcher IDs (one per line) — leave it empty to accept any ID until the roster
   is finalised.

## Running fieldwork

1. Give students the URL to `/collect`, the access code, and their student
   researcher ID.
2. Tell them to open it once with data/wifi, enter the codes (only needed once per
   phone), and — ideally — use the browser's "Add to Home Screen" so it behaves like
   an app and launches offline.
3. They can complete all 10 interviews back-to-back; the "Start next participant"
   button resets the form with a new participant code each time.
4. If they lose signal mid-fieldwork, the app keeps working — a status bar shows
   how many responses are queued locally and syncs automatically once back online
   (or via the "Sync now" button).
5. You can watch progress per student and export CSV at any time from `/admin`.

## Adding a new survey later

1. Create `src/lib/surveys/definitions/<slug>.ts` exporting a `SurveyDefinition`
   (copy `facebook-honiara-2026.ts` as a template — it covers every question type:
   single choice, multi-select with "Other" and exclusive options, Likert matrices,
   free text, and screening questions that end the survey early).
2. Add it to `SURVEY_REGISTRY` in `src/lib/surveys/registry.ts`.
3. Redeploy. The new survey automatically gets a `/collect/<slug>` page, its own row
   in the admin dashboard, and CSV export — no other code changes needed.
