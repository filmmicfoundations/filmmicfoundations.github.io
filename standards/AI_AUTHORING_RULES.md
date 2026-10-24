**Edition 2.0 — October 21, 2026. Read `ARTICLE_RELEASE_WORKFLOW.md` and `UI_TEST_MATRIX.md` first.**

# AI instructions for Filmmic Foundations

When asked to create, revise, format, or code a Filmmic Foundations article or website feature:

1. Read `FILMMIC_FOUNDATIONS_STANDARD.md`, `PDF_DESIGN_SPEC.md`, `ARTICLE_SCHEMA.json`, and actual current site assets. **Existing code takes precedence over assumed CSS values.**
2. The website is an anonymous, educational, evidence-led short-film analysis archive, not a review site or personal portfolio. Article author is **Filmmic Foundations**. Factually verified filmmakers may be named in film credits, never as the publisher's hidden owner.
3. Source hierarchy: film itself > official/primary production materials for production facts > peer-reviewed and authoritative context > carefully attributed tertiary descriptions. Never invent research or scenes. Distinguish confirmed film content, contextual scholarship, speculation and metaphor.
4. Write in lucid, qualified, specific prose. Avoid generic AI clichés and unsupported psychologizing; distinguish motif, shot, story fact and interpretive claim. State what a source actually reports rather than claiming it proves the film's message.
5. Construct a novel, film-specific argument; do not reproduce the Mindglass paper's thesis or structure by default. Use the sample PDF to maintain editorial rigor, captions, and citation discipline, not to force uniform interpretation.
6. Preserve short-film focus. Validate film year/director/runtime and original images. Do not invent images represented as genuine stills.
7. Generate article HTML, accurate `article.json`, optional `preview.json`, images (where licensed) and PDF if requested. The article must have proper sources, metadata, alt text, responsive behavior and publication-level citation helper.
8. Follow shared navigation, About standards, page settings, matching toolbar, dark mode, mobile/keyboard/reduced-motion and popup behavior. Do not create duplicate files/classes for components that already exist.
9. All PDF files: selectable text, appropriately embedded fonts, labeled figures, verified sources, neutral embedded metadata, sensible page sizes, rendered inspection before delivery.
10. For code changes check baseline screenshots, conflicts, build output, automated validator and browser interactions, and clearly report tests not performed. Minimize diff; include only source/site assets needed for publishing.
11. Related articles match overlapping themes/techniques, not merely common genre. Don't fabricate recommendations or publication statistics.
12. Publish never without explicit administrator action; admin ZIP gate (`123` demo) is not security. Do not store secrets in static JavaScript or commit them in ZIPs. GitHub authorization must be separate.

13. Publish future articles using `python3 scripts/package_article.py film-slug`: never change the homepage manually to add a card. Keep locally archived unique film stills and full-length PDF synchronized; test every clickable still and nonclickable diagram.
14. Preserve the Mindglass established typography and diagram layout; no novel research-guide callouts, hotlinked viewer images, nested buttons, or separate visual language. Suggested Articles must be last, after Watch Film.
15. Report browser tests honestly: local Chromium checks cannot certify GitHub deploy, native mobile Safari, third-party video services or authenticated publishing.


### Inline citations and fixed teal identity (24 October 2026)
- Cite individual supported statements where they occur; do **not** accumulate `[1] [2] [3]` at the end of each paragraph. Place each citation immediately after its relevant sentence-ending punctuation, with a space before the link.
- In website HTML, use clickable links such as `<a class="cite" href="#ref-1">[1]</a>` and verify each `#ref-N` resolves to a numbered reference.
- In the PDF, preserve the same *in-paragraph* citation placements and keep each marker linked to its source entry. The **Contents & research method** page has no links, while bibliography URLs stay clickable.
- Maintain the original **teal** brand accents with standard **Light, Dark, and System** display modes. There is no selectable accent/theme-color palette in Settings; do not reintroduce one without a new explicit request.
- Future PDF generators must build citations from article content rather than appending them mechanically to paragraph ends.
