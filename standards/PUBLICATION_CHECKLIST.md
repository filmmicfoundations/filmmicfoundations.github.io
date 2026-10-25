> **Edition 3.0 compatibility notice (24 October 2026):** Read `00_START_HERE_FOR_NEW_AI.md` and `AI_INDEPENDENT_ARTICLE_CONTRACT.md` first. They resolve older wording: all NEW flagship articles require a real 20–30-minute body, at least 10 verifiable sources covering primary/secondary/tertiary categories (15–20 preferred), 7–15 authentic local stills, complete matched PDF, in-paragraph citations, fixed teal identity, and an article-only publish ZIP. Latest human instructions and actual current site source take precedence.

**Edition 2.0 — October 21, 2026.**

# Publication checklist

- [ ] Original short-film title, year, credits, runtime and media availability verified.
- [ ] Each analysis distinguishes direct observation, interpretation, scholarly context and uncertainties.
- [ ] Specific scene/shot/sound details are checked against the source film; no invented dialogue or quotes.
- [ ] Sources exist, support claims, are attributed and cited correctly; film is cited as primary text.
- [ ] Editorial tone is clear, restrained, nonpromotional; significant alternative readings addressed when relevant.
- [ ] No personal research author or owner identity; embedded PDF/image metadata and git attribution reviewed.
- [ ] Between 7 and 15 distinct local stills are authentic, permission/use considered, descriptive, proportional, labeled and accessible; previews contain only stills.
- [ ] Article HTML includes title, abstract, references, proper figure numbering, no duplicate controls.
- [ ] Structured metadata valid; article publication date distinct from film release year.
- [ ] PDF generated (if provided), fonts/selectable text/figure captions/page numbers checked visually and metadata stripped.
- [ ] Shared header, toolbar, Settings, About, 404, footers work consistently.
- [ ] Desktop/mobile: 320/390/1365 widths; light/dark, keyboard, contrast and reduced motion.
- [ ] Archive search, filtering, four layouts, previews, related matching and RSS verified.
- [ ] Image zoom, download, gallery, share, PDF/new-tab behavior, citations and footers verified.
- [ ] No unnecessary dependency, script, CSS override, secret, personal data, temporary image or cache.
- [ ] `python3 scripts/build_archive.py` and `python3 scripts/quality_gate.py` succeed.
- [ ] Every uploaded ZIP diff inspected, backup identified, GitHub deployment status checked.

- [ ] New article contains a genuine 20–30-minute body and neither a redundant research guide nor extra introductory note blocks absent from established style.
- [ ] Local full-frame stills are unique, named consistently, have responsive variants, intrinsic dimensions and one viewer button each; diagrams are static HTML/CSS and exclude viewer triggers.
- [ ] Suggested Articles is in the reading menu and is the last section after Watch Film.
- [ ] PDF includes the whole text and exact figure set; visually matches Mindglass page hierarchy with running headers, source list and metadata.
- [ ] Overlay backdrops dim the **entire** page including visible menus; viewer/settings/preview close correctly and preserve focus.
- [ ] Archive ZIP inspected locally, ready via `scripts/package_article.py`; invalid paths and progress races checked.
- [ ] Browser smoke JSON recorded; note GitHub/Safari/third-party features not tested offline.
- [ ] PDF contents page matches the reference and has **no clickable section annotations**; later bibliography and source links still work.
- [ ] ZIP review bar has a readable percentage and an activity label, never claims 100% before file validation/comparison completes, and resets on a new ZIP.
- [ ] Deployment bar explicitly distinguishes measured transfers from estimated GitHub processing; 100% means remote publication confirmed, not merely commit accepted.

- [ ] The film-image viewer is centered on the viewport at desktop, portrait/mobile and landscape widths; it does not sit below center due to stacked navbar-height offsets.
- [ ] PDF contents/method page is non-clickable; numbered in-body source citations link to matching references, and bibliography URLs remain usable.


### Inline citations and fixed teal identity (24 October 2026)
- Cite individual supported statements where they occur; do **not** accumulate `[1] [2] [3]` at the end of each paragraph. Place each citation immediately after its relevant sentence-ending punctuation, with a space before the link.
- In website HTML, use clickable links such as `<a class="cite" href="#ref-1">[1]</a>` and verify each `#ref-N` resolves to a numbered reference.
- In the PDF, preserve the same *in-paragraph* citation placements and keep each marker linked to its source entry. The **Contents & research method** page has no links, while bibliography URLs stay clickable.
- Maintain the original **teal** brand accents with standard **Light, Dark, and System** display modes. There is no selectable accent/theme-color palette in Settings; do not reintroduce one without a new explicit request.
- Future PDF generators must build citations from article content rather than appending them mechanically to paragraph ends.

### Mandatory fresh-AI handoff checks (Edition 3.0)
- [ ] At least **10 DISTINCT verified sources including primary, secondary and tertiary** (15–20 preferred), recorded with evidence support in a source ledger.
- [ ] Actual film watched with audio; timestamps and rights basis documented for all stills, no screenshots fabricated.
- [ ] Actual body text = 20–30 min at 225 wpm, citation markers located after specific supported sentences rather than paragraph ends.
- [ ] Exactly six still-only preview frames; the first matches all cover surfaces; 7–15 unique stills within the article body.
- [ ] PDF section/figure/citation map exactly matches the HTML, unlinked TOC and linked research citations/bibliography.
- [ ] AI author was supplied and read the CURRENT source code, not just the style descriptions.
- [ ] Final ZIP is one `film-slug/` folder, not an entire website or this authoring kit; upload simulation and live-deploy instructions verified.
