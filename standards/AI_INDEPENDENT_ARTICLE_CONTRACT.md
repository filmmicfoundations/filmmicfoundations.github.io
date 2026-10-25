# Contract — Required outputs and non-negotiable standards (Edition 3.0)

## Editorial / sourcing

- An **actual short film** selected for close analysis, preferably available on YouTube or the filmmaker's official channel. Verify exact release and runtime, film year, names/credits; never infer from a title alone.
- One coherent **20–30-minute body**: 225 words/minute; normally 4,500–6,750 substantive words from the actual article. Do not count footer/navigation/source list/hidden UI or pad with plot recaps to reach length.
- **At least TEN distinct, verifiable bibliography entries**, with **primary, secondary and tertiary sources represented**; **15–20 are preferred** when genuinely relevant. Original film is required primary text. Filmmaker/production materials are primary for production claims; independent articles and scholarship are secondary; reference catalogs/encyclopedias are tertiary. One source may contain a firsthand interview inside secondary journalism; record its actual role rather than blindly classifying all reporting as primary. Include film- and topic-relevant academic/scholarly theory where it materially helps, without using it to “prove” subjective symbolism.
- For EVERY citation, verify that the source exists, bibliographic details are correct, and the precise claim is supported. No invented data, awards, interviews, director intent, quotations, or scene descriptions. Source count is a minimum quality floor, never an excuse to cite irrelevant material. Provide a research ledger in `film-slug/research/sources-ledger.json` (working file, can be inside final article folder) that includes verified claims. Track open questions explicitly.
- **In-text bracket citations located immediately after the relevant sentence or clause**, throughout the paragraph. HTML anchors `href="#ref-1"` and PDF internal links to matching bibliography entry. NOT a parade of `[1] [2]` at paragraph ends; do not place source numbers randomly where the source does not substantiate that sentence. Complete bibliography with clickable URLs.
- Film evidence first, interpretive inference clearly signaled, alternative readings and meaningful limits included. Do not treat psychological research as a diagnosis of a fictional character. Scholarly but readable and anonymous publication voice; do not use unverifiable review hyperbole.

## Visual/media

- **7–15 unique, purposeful, authentic frame stills** inside article body (not 7–15 diagrams), extracted from the verified actual film when permitted/available. Use full-frame JPEG at true obtainable quality, plus real 640-pixel-wide responsive variant. Name `film-slug-specific-scene.jpg` and `film-slug-specific-scene-640.jpg`. Do not upscale and call it higher-resolution or generate a fictional replacement.
- A film-still hero cover, identical film frame on homepage card, social preview and first preview slide, and a matching PDF cover. Re-use cover across those surfaces is expected; avoid duplicate near-identical figures in the article body. Preview contains **exactly six authentic film stills**, no analytical diagrams.
- Each article still has intrinsic dimensions, alt text, meaningful numbered figure caption, film timestamp/source mapping, and a single `article-image-open` trigger. Test gallery, single image, download, share, zoom and focus behavior.
- Each image appears near the specific paragraph it informs. For each frame: **what visually happens, why it matters, which paragraph, figure number, timestamp and source rights**. Reassess if a frame supports no analysis. The same order/images/captions must appear in the PDF; no detached figure appendix unless both formats explicitly use one.
- Original **analytical** diagrams only if they explain a genuinely complex film-specific relation; use readable responsive HTML/CSS and the restrained Mindglass design. Diagrams may appear as print-resolution graphics/tables only in the PDF. Never enable image viewer on diagrams. Diagrams do not count toward 7–15 film stills.
- Verify image licensing/attribution: permission/open license where possible; otherwise account for quotation/fair-use analysis and note legal uncertainty. Copyright clearance is not assumed from YouTube availability. No hotlinked film stills as runtime dependencies.

## Design and function

- Site identity: Filmmic Foundations; neutral cream/deep teal, **original teal color only**. Reader settings include **Light, Dark, System**, text size, spacing, reading tools. No selectable accent palettes. DM Sans + Libre Baskerville. No anonymous publisher identity leak.
- Maintain existing homepage and other three/four articles EXACTLY (barring intentional generated discovery metadata). Shared global header and sticky article toolbar. Menu order must point to sections that exist, include Watch/PDF/Sources/Cite/Share/Suggested Articles as supported by the current reference.
- **Suggested Articles is the final body section, after Watch the Film** and before footer. Homepage preview/sorting/filters/four layouts must continue working. All popup backdrops darken even the visible navigation, image viewer centered at desktop/mobile/landscape, scroll locked while dialogs open, controls keyboard/reduced-motion compatible.
- Reuse actual shared CSS/JS instead of wholesale new components or duplicated overrides. Preserve figure and caption hierarchy, source accessibility, real Watch the Film link. If film embedding is blocked, offer a verified external watch link and mark the embed limitation.

## PDF

- Entire matching article (unabridged): same source citations placed at same claims, same figures and captions in exact order, same section headings in sequence, cover as chosen frame, matching references. A generated PDF is NOT allowed to shorten the analysis silently.
- Match **`mindglassprocedure/Mindglass_Procedure_Critical_Film_Analysis.pdf`**: title-first left-aligned cover, thin teal rule, cover still/caption, brief scope paragraph, four-row/two-column film-information table, plain text `Contents & research method`, restrained body headings, running headers, numbered pages and bibliography.
- TOC/method page contains **no clickable section links**. Body numbered citations link to reference entries and bibliography external URLs work. Selectable text, readable fonts, no clipping, page-by-page renders checked, PDF Author/Creator = Filmmic Foundations only.

## Deliverables / acceptance

`film-slug/` normally contains `index.html`, `article.json`, `preview.json`, optional `style.css`, `assets/*.jpg`, `Film_Analysis.pdf`, `research/sources-ledger.json`, `research/scene-log.json`, and `research/figure-plan.json` plus an optional PDF-generation script. A separately linked QA report names source count and split, word count, still count, PDF parity, test matrix, and honest limitations.

**Never ship** temp files, `__pycache__`, `.pyc`, `.DS_Store`, symlinks, secrets, GitHub tokens, scratch captures, unsupported external assets or a root homepage in the article-only ZIP. Quality gates are necessary, not sufficient: inspect article and PDF visually.
