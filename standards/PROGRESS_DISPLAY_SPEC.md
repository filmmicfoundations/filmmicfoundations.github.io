# Portal progress display — October 23, 2026

- Keep progress bars visually consistent with the archive: muted background track, teal gradient fill, softly animated highlight/pulse and low-motion alternatives.
- Local ZIP validation is measured per file; the first 8% is initialization, per-file verification covers 8–90%, GitHub comparison runs at 94%, and 100% means an inspected review is ready. Percentages during non-file phases are staging indicators rather than byte progress.
- Publication: file uploads are measured, commit is a stage, GitHub Pages processing is **estimated**, and 100% is reserved for a confirmed deployment. Never claim live success without GitHub/API confirmation.
- Display specific activity labels (opening archive, verifying files, comparing repository, transferring files, committing, waiting for GitHub, checking live site), preserve the available review controls, and never block interaction with fake timers.
- Respect `prefers-reduced-motion`, keyboard navigation, light and dark themes, and announce current activity through an aria-live status.


## Compact progress UI (October 2026)

The deployment modal shows only: title, current phase, percentage, one progress bar, status detail, and a single optional Github link or retry action. Do not add step badges, duplicate labels, multiple animated dots, or an always-visible stage list. Label GitHub build percentages as estimates, and only show 100% when release confirmation is received. Use a subtle sweeping animation, disabled for reduced-motion users.
