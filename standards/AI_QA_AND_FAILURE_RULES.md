# QA + failure-mode checklist for a context-free AI (Edition 3.0)

## Stop-ship failures — DO NOT hand over as “publish-ready”

- Source count <10 or absence of a real primary/secondary/tertiary class; sources unverifiable or evidence invented.
- 20–30-minute word count fabricated, large chunks of film prose or references missing, or article/PDF don't have same sections and figures.
- 7–15 unique genuine local body stills missing; stills artificially generated/hotlinked/mislabeled; six preview images include diagrams.
- Cover differs across article hero, archive card, first preview, PDF or social metadata unintentionally.
- Numbered citations stacked at paragraph ends instead of following supported claims; broken `#ref-N` links; PDF body citations unlinked; TOC method links clickable.
- Viewer not centered, opens diagrams, misses frame files, has inert controls, cannot close or traps focus incorrectly.
- Existing homepage overwritten, any existing article missing, article ZIP has root `index.html` or wraps `film-slug/` incorrectly.
- Different/color-picker theme introduced without user request; global design/toolbar/settings changed without reason.
- Quality gate fails, ZIP corrupt/unreadable or contains secrets, temp caches, hidden private identities, absolute machine paths.

## Required tests and evidence

- `python3 scripts/build_archive.py`, `python3 scripts/quality_gate.py`, `python3 scripts/media_manifest.py --check` in a clean worksite (after building).
- `python3 tools/preflight_article.py path/to/worksite film-slug` (portable authoring-kit check; place tool separately, do not include it in new-article ZIP unless wanted).
- `python3 scripts/package_article.py film-slug` and `zipfile.ZipFile(...).testzip()`; inspect archive paths explicitly.
- Viewer screenshots/browser click tests for new article, home and one existing article at 1365 px desktop, 390 px portrait and 568–850 px landscape; both light/dark and reduced motion where possible. Click still, next/prev, gallery/single, zoom, fit, share, download, close; screenshot center placement after animation.
- All PDF pages rendered to PNG; inspect cover, info table, contents and representative figure pages visually, then compare heading/figure/citation sets with article; check file metadata and annotations.
- Examine Developer Portal ZIP review before approval; verify old website files are NOT marked for deletion. Live GitHub Actions success is a separate post-publish check.
- Produce `QA_REPORT.md` with exact checks, failures/repairs, limitations and output filename. Do not claim Chrome/Playwright, Safari or live deployment were tested if they weren't.

## Failure recovery

| Symptom | First place to inspect | Remedy |
|---|---|---|
| Article replaces home | ZIP listing and portal path detection | Only `film-slug/...` entries; NEVER `index.html` at root; no nested wrapper stripping |
| New card missing | GitHub Actions deploy, generated root `index.html`, direct `/slug/` URL | Build and deploy check; don't claim zip upload alone means publish |
| Stills don't load | `src`, `srcset`, case sensitivity, `assets/`, local server | Fix path, intrinsic dimensions, viewer mapping |
| Preview shows diagrams | `preview.json` / embedded homepage preview manifest | Only six stills, first chosen cover |
| PDF visually different | Reference Mindglass PDF + PDF generator | Restore cover rule, table, body fonts, running header, same full text |
| Citations after paragraph | Article HTML and PDF generator logic | Place markers after supporting sentence; build PDF from inline article markup |
| Color/theme inconsistency | `assets/js/site-settings.js`, shared CSS tokens | Use fixed teal, Light/Dark/System only; no accent-color setting |
| Upload review stuck | ZIP prohibited cache / archive size / portal console | Remove cache `.pyc`, validate JSZip, avoid huge unchanged files |

## Honest handoff language

Use “**publish-ready for local/source checks; live deployment pending**” ONLY when all offline gates truly passed. If a mandatory source/image/browser test cannot be done, label as **editorial/technical draft**, explain which acceptance criteria remain and deliver relevant partial work as clearly incomplete.
