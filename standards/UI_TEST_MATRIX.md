# Filmmic Foundations release QA matrix

**Edition 2.0 — October 21, 2026.** Run on the whole site after global changes and on the current plus proposed article before article-only publication. Mark failures, limitations and fixes in the release record.

| Area | Expected behavior |
|---|---|
| Navigation | Home icon; About, Archive and article links; brand; sticky header, article toolbar; back-to-top island; responsive mobile controls; focus visibility. |
| Home discovery | Search typing/clear/no-results; filtering by genre/article year/film year, reset and chips; separate sort icon with newest/oldest/A–Z/Z–A; four layout buttons, no jitter on view changes; previews and image gallery; card titles/dates consistent with `article.json`. |
| Article | Actual 20–30-minute reading time; Table of Contents links and active state; source/citation anchors; Watch film; Suggested Articles last; correct PDF and download preference; no generic style drift. |
| Viewer | Open every still; arrow navigation, keyboard arrows/Escape, gallery switch, thumbnails, zoom +/-/fit, pan, download and share; short/long captions; no original diagrams in viewer; no external still-host requirement or invalid nested buttons. |
| Settings | Four tabs; light/dark/system, size, width, spacing, contrast, motion, focus, progress, captions, resume, contents, related, citation, PDF, archive view/sort, image settings, media, shortcuts, external links, reset; correct persistence and no flash. |
| Modals | Viewer, preview, settings, share, external-site confirmation, dev guides, dev release and lock confirmation dim both the article bar and global header without covering them; no body jump, clean close, focus restored. |
| Developer | Access gate, token guide, ZIP selection/drag/drop/clear, per-file inspection progress, CRC and unsafe path rejection, compare preview, approval requirement, publish button gating, version history, restore confirmation, status polling, workflow options. **Never test destructive publish/restore against a real account without explicit approval.** |
| Documents | PDFs open/download; cover and TOC, all figures appear once and match article, captions, searchable text, references, links, author/creator metadata, figure positioning, no clipping at page boundaries. |
| Accessibility/responsiveness | 320/390/768/1365px, light/dark/system, reduced motion, high contrast, keyboard only, no horizontal page overflow, heading hierarchy, image alt text, dialog roles and announcements. |
| Data integrity | Quality gate, no broken local assets/fragments, structured data, correct dates, unique figure images, no `.pyc`/cache/private paths, feed and sitemap refreshed by build, GitHub Actions `success`, live page loaded without stale cache. |

## Automated and manual coverage distinction

`python3 tests/browser_smoke.py` executes repeatable **offline Chromium** interactions in a sandbox. It cannot confirm actual GitHub authentication/deployment, third-party media availability, mobile Safari, real network latency or screenshots of a production browser. The script's JSON output is a release artifact for developer review, not evidence of every supported browser working. Manual production testing must accompany publish/restore or external service claims.

## Visual baseline and media checks added October 2026

- `python3 scripts/media_manifest.py --check` rejects stale manifests, missing
  local stills, preview duplicates, mismatched covers, and diagrams in previews.
- `python3 tests/visual_regression.py` compares 25 Chromium snapshots against
  approved references: homepage and all articles in both themes and viewport
  widths, article-body figures, and open-image dialogs. It also measures dialog
  centering, not only whether `showModal()` succeeded.
- `python3 tests/visual_regression.py --update-baseline` is an *intentional
  approval action* after examining screenshots. Do not automatically reset
  baselines to make failing comparisons disappear.
- User-uploaded high-quality JPEGs become new local derivatives; PDF cover,
  article cover, OG metadata, archive card, and preview first slide must be
  updated together. Build, render, compare, and verify the PDF separately.
