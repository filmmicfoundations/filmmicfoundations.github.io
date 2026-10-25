> **Edition 3.0 compatibility notice (24 October 2026):** Read `00_START_HERE_FOR_NEW_AI.md` and `AI_INDEPENDENT_ARTICLE_CONTRACT.md` first. They resolve older wording: all NEW flagship articles require a real 20–30-minute body, at least 10 verifiable sources covering primary/secondary/tertiary categories (15–20 preferred), 7–15 authentic local stills, complete matched PDF, in-paragraph citations, fixed teal identity, and an article-only publish ZIP. Latest human instructions and actual current site source take precedence.

# One-ZIP article release workflow

**Edition 2.0 — October 21, 2026.** This file is the operational companion to the Publication Standard. Follow it before introducing any new film article. The central goal is **author once, inspect once, upload once**; do not replace the homepage or shared stylesheet to publish a film.

## Release model

1. Start with the latest verified site source; keep it intact. Film research is authored in one new folder, `film-slug/`.
2. Minimum contents are `film-slug/index.html`, `film-slug/article.json`; normally include `preview.json`, `style.css` only for justified unique visual needs, `assets/` with authentic local media, and an illustrated film-analysis PDF.
3. Shared presentation lives in `/assets/css/` and `/assets/js/`. Copy the **structure** of `mindglassprocedure/index.html` but not its film claims, copyright-sensitive images, exact headings, byline, or scene descriptions. Avoid adding site-wide files to the patch unless fixing a verified shared bug.
4. Run `python3 scripts/package_article.py film-slug` from the repository. The tool stages a full archive build, runs the quality gate, then outputs `film-slug-article-update.zip` containing just that article folder. The source website is not overwritten.
5. Upload that ZIP directly in the Developer Portal. A patch preserves all other files. Review the changed-file list, approve, and click Publish. **An article-only ZIP is intentional:** the GitHub Pages workflow regenerates homepage listings, search, citations, previews, related-article suggestions, RSS, and sitemap on deployment.
6. Confirm the GitHub Actions deployment and inspect the live homepage and article. A committed update is not the same as a verified live deployment; do not call it successful just because the progress bar reaches “commit.”
7. On errors, repair the article source and rebuild its ZIP. Never transplant a previous complete-site ZIP over a current deployment to solve an article-only issue.

## Concrete conventions tested against Alike / Mindglass

- A genuine **20–30-minute read** based on the words actually present (archive uses 225 words per minute); no manually inflated label. The argument can use a film-specific structure, but method, evidence, limitations and bibliographic context belong naturally in the analysis. Do not introduce extra giant “Research Guide” or “Method” callout boxes not used by the reference article.
- Article pages keep the **same global header and reading toolbar**, one image viewer, citations, sources, watching options, and a **Suggested Articles** link. Suggested Articles must be the **last content section after Watch the Film and before the footer**.
- Use **7–15 distinct genuine film stills per long-form article**, locally archived with clear rights/attribution context. File naming: `film-slug-descriptive-shot.jpg` (or `.webp`) and `film-slug-descriptive-shot-640.jpg` for responsive loading, lowercase hyphens. Never use external image-host URLs as the viewer's runtime source. Avoid duplicating frames, creative crop variants sold as separate scenes, and generated stills falsely identified as frames. Do not force `object-fit:cover` on analytical stills. Add intrinsic image `width` and `height` attributes to stop lazy-load layout collapse.
- Each still is one `<figure>` with **one** button of class `article-image-open`, exactly one image, clear alt text, and numbered caption. No nested buttons. Still buttons open the shared Single/Gallery viewer with zoom, arrows, fit, gallery, share and download. Keep source files local. Diagrams do **not** have the `article-image-open` class and never join the viewer.
- Diagrams should be original **semantic HTML/CSS schematics** resembling *Mindglass*' side-by-side contrast and cycle components; the PDF may use an exported high-resolution figure of the same information. Avoid full-size exported diagram images that read as pasted posters. Put concise explanation in adjacent article prose and one caption. No redundant gigantic title inside the diagram. Ensure `min-width:0`, breakpoints and no letter wrapping in “DISCONNECTION”-length labels at 320–1365px. For screenshots or graphic diagrams that must be an image, respect aspect ratio and use matching light/dark contrast; do not make them clickable.
- The PDF shares the article's full argument and **same unique stills and diagrams**, placed near their analysis. Use the *Mindglass Procedure* PDF as layout reference: US Letter, cover title above illustrative still, contents, running headers, numbered figures, citations and links, consistent academic body typography. Never silently shorten the text when adding images or replace the established PDF typography. Make every page visually inspectable; verify source dates and document metadata.
- In dark mode, callouts must remain legible; prefer no extra callouts. All native modal dialogs must **dim the entire page including visible sticky navigation**, while the dialog body remains within the space below those bars. Keep the toolbar readable but inactive behind the modal. Focus returns when closing, no flash/flicker on settings changes.

## A predictable preflight

Run in the source repository:

```bash
python3 scripts/package_article.py film-slug
python3 scripts/build_archive.py
python3 scripts/quality_gate.py
python3 tests/browser_smoke.py
```

The package command already builds and validates a **temporary** copy; the explicit build here checks the current full source if publishing it. Only package the new article folder when no global code needs changes. If a source violates the article template, fix the source instead of bypassing the quality gate.

For every release manually verify the live navigation, settings, menus, both articles, filter/sort, each archive layout, still lightbox, original diagrams, accessibility, PDF download, citations, RSS, metadata and references. Real GitHub authorization, platform permissions, slow networks, actual media playback and mobile Safari are not reproduced by offline Chromium tests.

## Reusable request for a future author or AI tool

> Build one new evidence-led short-film analysis for Filmmic Foundations. Read all v2 standards and current source pages first. Verify the film itself, credits, production context, appropriate primary/secondary/tertiary research and original stills. Author a genuine 20–30-minute film-specific analysis with a Mindglass-consistent article interface, local uniquely named film stills and responsive variants, inline non-clickable HTML/CSS diagrams, complete citations, a full-length matching illustrated PDF, and metadata/preview files. Preserve every existing page, theme, menu, script and prior article. Validate the full site and every figure, run the package-article utility and browser test suite, and deliver only the single-article ZIP, with a clear note of unverified live behaviors. Never invent frames, awards, source findings, live publication status, or publisher identity.


## Incident: article ZIP accidentally replacing homepage (21 October 2026)

**Critical:** The Developer Portal previously identified a ZIP containing only `film-slug/index.html`, `film-slug/style.css`, and `film-slug/assets/` as a wrapped complete website and removed `film-slug/` from its paths. This overwrote the root `index.html` with the article. The portal must strip an outer folder **only when the ZIP also contains all complete-site markers**: `404.html`, `scripts/build_archive.py`, and `assets/css/home.css`. An article folder containing `article.json` must never be unwrapped. Before every article release, use the actual Developer Portal file review to verify every entry begins with `film-slug/` and that there is **no root `index.html`** entry. For a damaged deployed homepage, distribute a complete source-root ZIP to restore it, not another article-only ZIP.

The Black Hole now uses locally archived frames. Treat older release notes about remotely hosted Black Hole stills as superseded. Maintain a minimum of 7 and maximum of 15 distinct local film stills per long-form article, with only genuine film frames in its homepage preview; keep diagram figures static and separate.

## Release clarification: covers, image formats, and previews (2026-10-21)

- Use an **authentic locally stored film frame** as the article hero image, archive-card cover, Open Graph image and PDF cover whenever verified media is available. Original editorial art is not equivalent to a film frame and must never be described as one. If no authentic frame is available, flag publication as media-incomplete.
- Archive film frames as descriptive lowercase hyphenated `.jpg` files in `/<slug>/assets/`, with corresponding `-640.jpg` versions. Keep the original frame's aspect ratio; do not create arbitrary crops, duplicates, or fake closeups to fill a gallery.
- Create `preview.json` with up to six **unique, local** image paths and equally many `image_captions`. Prefer film frames that illustrate different moments. Original analytical graphics may be preview images only when explicitly labeled and no authentic film images are available.
- The homepage builder embeds **every** article's preview manifest into `#preview-manifest`; this reduces extra fetches and prevents previews depending on individually fetched JSON files. Regenerate the homepage after changing `preview.json`.
- Long multiword titles may use restrained sans/serif contrast inside the existing hero `<h1>` (like *Mindglass Procedure*). Single-word titles such as *Alike* remain a single display style.
- In PDFs, match the *Mindglass Procedure* publication framework: title-first cover, rule, authenticated film frame and caption, short introductory paragraph, film metadata table, contents, full article, appropriately sized numbered figures, cited references, running page header/footer.
- Test the **homepage, all three previews, article cover images, film-image viewer, and PDF figure rendering** after a rebuild. A successful `quality_gate.py` alone does not verify that remote stills load or that visual styles match. Keep incomplete external still requirements as visible warnings.
