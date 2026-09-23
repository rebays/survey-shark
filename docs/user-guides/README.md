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

## Regenerating

If wording needs to change, edit `scripts/generate_student_guide.py` or
`scripts/generate_admin_guide.py` (shared styling/helpers live in
`scripts/guide_common.py`) and run:

```bash
python3 -m pip install reportlab   # once
cd docs/user-guides
python3 scripts/generate_student_guide.py
python3 scripts/generate_admin_guide.py
```

This overwrites the two PDFs in place.
