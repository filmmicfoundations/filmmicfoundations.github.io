# Research and evidence protocol (Edition 3.0)

## 1. Verify the actual primary text

Record title, release(s), director/writer (where confirmed), year, verified runtime, official viewing link, license/copyright status, and exactly which cut was viewed. Watch the whole film, WITH audio. Do not rely on synopsis and trailers. Record representative timestamps of frames and important sound cues in `research/scene-log.json` using the template.

## 2. Build the source ledger BEFORE drafting claims

Research in this order: original film; official studio/filmmaker interviews/notes, credits and production history; reliable scholarly or other disciplinary context; independent film criticism/reporting; tertiary catalogs/encyclopedias. Aim for **15–20 meaningful entries**, minimum **10 total with all primary/secondary/tertiary types represented**. Verify exact author/title/venue/date/URL/DOI and relevant claims, reading the actual source rather than a search snippet. Check whether “secondary” journalism contains a quoted primary interview and cite appropriately. Put accurate kind in source ledger and article bibliography.

Primary = firsthand film/production/festival record where relevant. Secondary = independent critique, research article/book, documented reporting contextualizing film. Tertiary = reference catalog/encyclopedia collecting existing information; don't cite it to support unique interpretation or scientific results.

Record precisely what each source supports and what it does *not*. Do not invent source text, study sample size, filmmaker motives or exact awards. Don't infer filmmaking technique from one compressed still if it requires listening/watching. Licensing/rights notes go beside media evidence.

## 3. Draft an evidence-based thesis

Identify a formal pattern central to the film. Draft a scene-specific argument: **observation -> formal construction -> reader/viewer effect -> qualified interpretation -> source connection**. Prefer fewer strong claims to a broad list of themes. Use specific scene evidence with real timecodes where useful. Make primary film evidence the foundation; research supplies context without pretending to prove a fictional theme.

## 4. Cite where the source matters

Right: `The artist's production notes describe the early character designs. [4] The final film simplifies the original silhouette ...`

Wrong: `...many unrelated claims about animation and the film ... [1] [4] [7] [12]`

The correct marker belongs *immediately after the claim it supports*; multiple markers together only when the SAME particular claim truly needs multiple sources. In HTML, link `href="#ref-N"` to a bibliography entry with `id="ref-N"`; in PDF, link to the matching internal PDF destination. Do not create dangling citations or append markers to every paragraph as a formatting hack. Preserve citation ordering and IDs across formats.

## 5. Plan purposeful frames

Create `research/figure-plan.json` BEFORE export: choose 7–15 unique film stills, each with source timestamp, figure number, the exact section/paragraph placement and analytical purpose. Choose a striking but relevant film frame for cover, same as first preview image. Export genuine JPEGs at source resolution; retain original aspect ratio and make 640-pixel variants. Make six preview choices only from film stills. Do not include diagrams in preview or viewer. Diagrams are original analytical illustrations with accessible labels, NOT false stills.

## 6. Verify once more before release

Compare each paragraph's citation to the ledger, watch the cited moments again, check media identity and relative order, then confirm PDF parity and website controls. Source and evidence review is separate from HTML validator: a passing Python script does not make invented facts true.

## If a required item is inaccessible

- No video stream / no file: ask for a local film copy where lawful; mark article `DRAFT — MEDIA PENDING`; never synthesize “authentic” film frames.
- Fewer than 10 verifiable source entries of all three classes: choose a better researched film, or mark draft; do not pad bibliography.
- No actual website files / cannot run browser: produce research/manuscript but NOT “fully integrated publish-ready ZIP.”
- Copyright permissions unclear: document source/rights, avoid unlicensed bulk redistribution, and request approval or choose an open-license work. This kit does not grant media rights.
