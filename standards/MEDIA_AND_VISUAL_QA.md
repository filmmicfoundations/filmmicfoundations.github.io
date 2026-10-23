# Media and visual regression workflow

**Publication version:** October 23, 2026. This workflow supplements the
article and PDF standards.

## 1. Media inventory (source of truth)

`media-manifest.json` is a generated inventory of article covers, film-still
figures, diagrams, six-frame previews, responsive variants and PDFs. It also
includes SHA-256 hashes to catch accidental asset substitution and records
whether an image is filmmaker-supplied, user-supplied, or an original diagram.
Its role is provenance and reproducibility, not copyright licensing.

After changing any still, preview, PDF or hero:

```bash
python3 scripts/build_archive.py
python3 scripts/media_manifest.py
python3 scripts/media_manifest.py --check
python3 scripts/quality_gate.py
```

The GitHub Pages publishing action generates and validates the manifest before
staging files. Never publish a `.pyc`, `__pycache__`, `.DS_Store`, or macOS
`__MACOSX` folder. The exact same cover path must be used in `article.json`,
first `preview.json` image, homepage card (generated), article hero CSS, OG
metadata, and the first-page PDF film still. *Mindglass Procedure* may retain
older WebP stills as existing archival assets; new stills should be JPEGs.

## 2. Visual snapshot workflow

```bash
python3 tests/visual_regression.py
```

The test checks two viewport widths (390 and 1365 px), light and dark themes,
article hero and figure areas, and live dialog centering in the offline Chromium
harness. Each screenshot is compared to the last *approved* PNG stored under
`tests/visual_baselines/`. Unexpected changes produce difference maps under
`tests/visual_diff/` and fail the test. To accept an intentional style change:

```bash
python3 tests/visual_regression.py --update-baseline
python3 tests/visual_regression.py
```

Inspect any altered baseline image before committing. The offline harness
inlines local CSS, JS and images; it cannot verify cross-origin video streaming,
GitHub authorization, public CDN caching or native Safari/iOS interactions.

## 3. Human release acceptance

Open the actual published GitHub Pages site on desktop and mobile. Visit the
homepage, each article and at least one viewer in both color modes. Check every
image control, viewer navigation, search/sort/filter, PDF link and preview.
Compare PDF cover/captions to local stills. A failed visual or link test blocks
publication until corrected rather than being waived silently.


## Intentional figure placement (mandatory)

- Every photograph must evidence a specific nearby sentence or paragraph and its caption must describe what the actual frame shows. Do not label an anticipatory frame as a later plot event.
- Keep film stills in the section they support, adjacent to the most relevant paragraph. When a frame is useful twice, choose one primary location rather than repeating it solely to reach the image-count target.
- A paired set of shots is acceptable only when it supports a comparison of framing, perspective, performance, color or editing. State that reason in the adjoining text.
- The article archive and `standards/IMAGE_PLACEMENT_REVIEW.json` record the intended section and caption for each photographic figure. For the PDF, keep stills within the relevant textual discussion instead of detached picture galleries where possible.
- Do not change an image's factual description to support an interpretation the frame does not show.
