# User guides

Two PDF guides for the two kinds of people who use this platform:

- **`Survey-Shark-Field-Collector-Guide.pdf`** — for students doing fieldwork
  (`/collect`): one-time setup, collecting responses, working offline, troubleshooting.
- **`Survey-Shark-Researcher-Admin-Guide.pdf`** — for the researcher running the
  study (`/admin`): logging in, roster management, monitoring progress, exporting
  data.

Both are generic (not tied to any one survey or deployment URL) — they leave blanks
for the web address, access code, and student ID, since those are set per
deployment/roster rather than hardcoded into the guide.

Both carry the SINU logo (`assets/sinu-logo.png`, also used for in-app branding —
see `public/branding/` and `src/components/SinuLogo.tsx`) on the cover and in the
page footer.

The Field Collector Guide includes real app screenshots (`assets/screenshots/`)
showing the "My progress" dashboard and past-response viewer. If those screens
change noticeably, retake them: run the dev server, log in as any test student
(e.g. via `/api/collector/verify`), click through the flow, and use the browser
tool's screenshot action with `save_to_disk`. Crop out anything unrelated (e.g.
browser extension overlays) before saving over the files in `assets/screenshots/`.

## Regenerating

If wording (or a screenshot) changes, edit `scripts/generate_student_guide.py` or
`scripts/generate_admin_guide.py` (shared styling/helpers, including the
`screenshot()` embed helper, live in `scripts/guide_common.py`) and run:

```bash
python3 -m pip install reportlab pillow   # once
cd docs/user-guides
python3 scripts/generate_student_guide.py
python3 scripts/generate_admin_guide.py
```

This overwrites the two PDFs in place.
