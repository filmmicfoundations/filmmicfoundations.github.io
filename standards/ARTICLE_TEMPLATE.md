**Edition 2.0 — October 21, 2026.**

# Article template — flexible, not a compulsory outline

**Publication author:** Filmmic Foundations

**Short film:** [Verified film title] ([Verified release year])
**Film credits:** [Verified director(s) and other relevant craft credits]
**Working research question:** [Precise question relating form and meaning]
**Provisional thesis:** [Interpretive claim; label unconfirmed readings]
**Publication date:** [YYYY-MM-DD]
**Sources reviewed:** [Actual film, interviews, scholarly sources read]
**Evidence not yet verified:** [Explicit list]

## Abstract
[100–200 words as a guide. Name the film, central formal evidence, thesis, method and limits. No unsupported claims.]

## Method and scope
[The film as primary text; frame, timing, sound and sources available; limitations and possible missing materials.]

## [Film-specific argument I]
[Observed shot/sequence/line. How the shot/lighting/editing/sound works. Interpretive consequences. Supporting scholarship if relevant. Figure/citation.]

## [Film-specific argument II]
[Follow the strongest evidence; don't force a set number of sections.]

## Contextual scholarship
[What each actual author says, methods/limitations, why relevant but not a proof of the film's fictional universe.]

## Alternative interpretations and limitations
[Meaningful alternatives, unverified production facts, uncertainty.]

## Conclusion
[Synthesis, implications and open questions.]

## References and further viewing
[Film first, scholarly/primary research thereafter. Verify full citations and links.]

## Cite this article
[Generated automatically from validated `article.json`, **not** typed manually.]

## Assets and metadata checklist
- Verified cover and stills with descriptive alt text and captions
- Optional meaningful diagram vs. decorative filler
- `article.json` / `preview.json` and actual film year separate from article date
- PDF reviewed as text and rendered pages; neutral metadata
- Build and quality gate pass; mobile/dark/keyboard check


## Article UI and one-ZIP publishing contract (required)
- The **entire article must be a true 20–30-minute read** calculated from words in the article body (225 wpm); no placeholder sections or invented reading times.
- Use the current Mindglass page's common header, article toolbar, citations, watch section and global settings. Add Suggested Articles to menu and place its section at the very end of the page after Watch the Film.
- Figures: all genuine stills in local `assets/` with unique descriptive lowercase filenames and `-640` responsive variants; natural `width`/`height` attributes, captions and one non-nested viewer button. Diagrams must be static semantic HTML/CSS (not clickable images) and match established Mindglass visual language. No duplicates, crop-only extras, external still hosts or design-specific callout panels.
- Matching illustrated academic PDF with **all article prose**, figures, figure numbers, TOC and references; preserve full content when placing images and visually compare against the published Mindglass PDF.
- Run `python3 scripts/package_article.py film-slug`, validate archive, upload its **single folder** ZIP to Developer Portal; the deploy workflow rebuilds every archive discovery surface automatically.
