# START HERE — Filmmic Foundations AI Authoring Kit

**Edition 3.0 · 24 October 2026 · Standalone handoff; no earlier chat required.**

This is an **operational publication contract** for creating one NEW researched short-film article for the Filmmic Foundations static website. The archive is anonymous, educational, and evidence-led. Publishing organization: **Filmmic Foundations**. Never infer or expose a private person who runs it. Do not mention an AI writing assistant in the public article, but do not falsely claim human authorship or conceal material provenance if asked.

## What to open, in order

1. **This document** and `NEW_ARTICLE_MASTER_PROMPT.md` (the prompt a new AI should follow).
2. `AI_INDEPENDENT_ARTICLE_CONTRACT.md` (all editorial, media, site and delivery requirements, including the >=10-source rule).
3. `RESEARCH_AND_EVIDENCE_WORKFLOW.md` (film screening, verifiable sources, citations, frames, source ledger).
4. `REFERENCE_IMPLEMENTATION_MAP.md` (exact site files and reusable components).
5. `PDF_DESIGN_SPEC.md` and reference `mindglassprocedure/Mindglass_Procedure_Critical_Film_Analysis.pdf` from the accompanying website snapshot.
6. `ARTICLE_RELEASE_WORKFLOW.md`, `PUBLICATION_CHECKLIST.md`, `UI_TEST_MATRIX.md`, `AI_QA_AND_FAILURE_RULES.md`, `FAILURE_PREVENTION_CASES.md`.
7. **The actual source** `site_baseline.zip`, provided inside the standalone AI kit, or the user's more recent complete website source if available. Existing source has priority over speculative implementation advice.

### Precedence when documents disagree

1. Latest explicit instructions from the current human requester and latest real website source.
2. This **3.0** start page, `AI_INDEPENDENT_ARTICLE_CONTRACT.md`, `RESEARCH_AND_EVIDENCE_WORKFLOW.md`, `AI_QA_AND_FAILURE_RULES.md`.
3. Existing Edition 2.0 guidelines, scripts and examples (for detailed implementation). A few old lines permit shorter work or describe a different section order: **for a new flagship article, follow the 20–30-minute / >=10-source / final Suggested Articles requirements here**.
4. Example article prose and older screenshots are **examples**, not rules. Do not copy film-specific facts.

## Inputs the new AI needs

- **Required:** a real short film and a viewable copy, ideally a local MP4/WEBM (or an accessible official link) for shot verification and frame extraction.
- **Helpful:** the user's current full website ZIP or connected GitHub repository, selected film/research angle, and any approved images. These are not prerequisites to draft research when the film is accessible, but a **verified current site source is required to produce a safe publishable ZIP**.
- **Tools needed:** file archive access, web research/verification, image/frame extraction (FFmpeg or equivalent), HTML/CSS/JS editing, PDF authoring/inspection, Python 3 and browser automation. If tools unavailable, explain the precise blocker and produce a clearly marked **draft, not a publish-ready article**.
- **Publication is not automatic**. Never attempt to obtain or write GitHub tokens or ask for access code. The site operator approves and publishes via Developer Portal.

## Golden path — one article and nothing else

1. Unzip `site_baseline.zip` into a **working** website copy; inspect `mindglassprocedure/`, `spring/`, `alike/`, `the-black-hole/` and shared `assets/`. Confirm whether this snapshot is current; use a newer approved site archive if provided.
2. Research the film, verify running time/director/year/production credits, and maintain a real source ledger; **>=10 distinct, traceable sources; include primary, secondary and tertiary; preferably 15–20**. Film itself must be primary. Read sources, don't invent details.
3. Watch the actual film with sound, take a scene/timestamp log, and select a defensible research question and thesis. Write **20–30 min (~4,500–6,750 actual body words at 225 wpm)** of film-specific analysis; citations adjacent to supported claims, NOT piled at paragraph ends.
4. Extract **7–15 distinct genuine film stills** (no AI-generated substitutes), save full-resolution local descriptive JPEGs + `-640.jpg` siblings; select cover and exactly six preview film frames. Log each still's film timestamp, caption, analytical purpose, and rights basis; keep original diagrams static and outside the viewer.
5. Author ONLY `new-film-slug/` using shared website components/format. `article.json`, `preview.json`, `index.html`, `assets/`, PDF, source ledger, media/figure map, and optional article-specific CSS/build script. Film/year/credits remain evidence-led. Do not re-create or redesign homepage/header/settings.
6. Build the PDF from the final HTML article (or a single shared manuscript) with the **same prose, citations and numbered figures in the same order**. Match the Mindglass PDF cover, film-info table, contents, body headings, reference formatting and running heads. PDF contents/method page is NOT clickable; in-body numbered citations and external bibliography URLs ARE clickable.
7. Run `python3 scripts/build_archive.py`, `python3 scripts/quality_gate.py`, `python3 scripts/media_manifest.py --check` in the **working copy**. Run browser/visual tests and the portable `tools/preflight_article.py` included in this kit. Render every PDF page and inspect.
8. Run `python3 scripts/package_article.py new-film-slug` to create the **article-only** ZIP, inspect its paths and test upload/review. Deliver that ZIP, PDF, QA report and any limitations. **Do not put root `index.html`, `assets/`, `dev/`, `.github/` or `standards/` into the new-article upload**.
9. The operator publishes and checks GitHub Pages. Offline checks cannot prove that a commit is live; give a direct URL and a live validation plan, but do not say “published” until confirmed.

## Two different ZIPs: do not confuse them

- **This authoring kit** (`Filmmic_Foundations_AI_Authoring_Kit_v3.zip`): for an AI to READ and USE AS A WORKSPACE. NEVER upload it to the Developer Portal.
- **The finished new article** (`film-slug-article-update.zip`): contains one root folder `film-slug/`, with its `index.html`, metadata, PDF and assets. THIS is what the Developer Portal uploads.

## No automatic guarantee

A new competent AI with web/file/PDF/browser tools can complete this workflow without conversation history. Merely pasting a guide into an AI with no file access, external research or video handling cannot guarantee accurate scenes, genuine JPEG stills, functioning UI or a verified publishable ZIP. If a mandatory step cannot be verified, do not claim “flawless” or “publication ready.”
