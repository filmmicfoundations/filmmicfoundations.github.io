# Filmmic Foundations — Publication & Design Standard

**Edition 2.0 (October 21, 2026) | Applies to the website, future short-film articles, film-analysis PDFs, and machine-generated content.**

> **Mission.** Filmmic Foundations is an anonymous, educational, evidence-led archive of critical analysis of short films. It is not an auteur portfolio, review/rating service, advertiser, fan site, or promotional press kit. Readers should be able to distinguish on-screen evidence, contextual research, critical inference, and unresolved ambiguity. No interpretation is perfectly neutral; the publication aims for transparent, fair, qualified reasoning.

**Implementation references:** See `ARTICLE_RELEASE_WORKFLOW.md` for one-ZIP releases, `UI_TEST_MATRIX.md` for test coverage, `ARTICLE_AUTHORING_PROMPT.md` for a reusable handoff, and `PDF_DESIGN_SPEC.md` for visual document consistency. The original v1 examples remain informational, but v2 behavior rules take precedence when they conflict.

## 1. Nonnegotiable principles

1. **Anonymous publication:** Attribute essays and their scholarly citations to **Filmmic Foundations** unless a genuinely different, explicitly authorized publication credit is provided. Do not identify website owners, repository operators, article drafters, email addresses, internal accounts, private identities, or personal affiliations. Verified filmmakers' names may appear as factual **film credits**, independently of research authorship. Metadata, source images, PDFs, commit identity, and public hosting must be reviewed separately for privacy.
2. **Short-film emphasis:** Select films for analytical interest, not their prestige or connection to contributors. Do not implicitly favor particular filmmakers. Articles about any short film may differ substantially in questions, methodology, evidence, and conclusions.
3. **Evidence first:** Describe shot, edit, event, character action, sound cue, or line of dialogue accurately *before* interpreting it. Distinguish 'the film shows' from 'this may suggest'. Do not invent frames, dialogue, scene order, runtime, production stories, audience response, awards, motives, directorial intent, or citations.
4. **Analytical—not promotional:** Avoid plot-only retellings, star ratings, evaluative slogans, flattery, marketing language, inflated claims, and declarations of a single 'correct' meaning.
5. **Responsible research:** Verify claims with primary film material, credible scholarship, official records, interviews, or appropriately attributed reporting. Always represent study limitations, sample and methods where relevant. Real-world research provides context for an artistic reading, not clinical proof about fictional people.
6. **Editorial honesty:** Label uncertain interpretations and alternative readings. Correct substantive errors transparently with `updated_date` and a note when needed. Do not launder speculation into factual certainty.
7. **Accessibility, performance and continuity:** Every page inherits the shared typography, design tokens, navigation, settings, light/dark modes, keyboard behavior, and content accessibility. No new script or stylesheet should override an established component arbitrarily. Test both desktop and mobile, reduced motion and dark/light modes.
8. **No fabricated references:** Every listed reference must exist, be accessible or traceable, and actually support the associated claim. Cite original film as primary text. No placeholders masquerading as real scholarship.

## 2. Writing voice and rhetorical method

- **Tone:** Precise, observant, reflective, scholarly but readable. Prefer direct verbs and plain explanations over academic padding. Avoid first-person personal autobiography, sarcasm, exaggerated emotional terms, and formulaic AI transitions ("delves into", "testament to", "in today's society").
- **Argument:** Open with an informative abstract stating the film, research question, evidence, central thesis, and boundaries. Structure body sections around concrete questions or cinematic motifs, not a mechanical checklist of every possible filmmaking craft.
- **Analytical paragraph:** (a) verifiable on-screen detail; (b) formal choice (shot, lighting, rhythm, mise-en-scène, sound); (c) plausible effect or thematic function; (d) link to larger argument, scholarly context, or alternative reading; (e) qualification if meaning is ambiguous.
- **Close reading:** Describe composition, focus, camera placement/movement, palette, light, texture, sound, duration, transitions, repetition, production design, casting/performance and narrative construction *only where relevant and demonstrable*. Refer to evidence the reader can locate in the film.
- **Context:** Connect to psychological, historical, philosophical, technical, or sociological scholarship when appropriate. For sensitive subjects, avoid pathologizing characters or claiming clinical diagnoses based on plot.
- **Alternative readings:** Include plausible interpretations when warranted, and explain why evidence favors or limits a particular reading. Avoid empty "could symbolize anything" claims.
- **Conclusion:** Synthesize interpretive consequences and unresolved questions without overstating filmmaker intention or claiming to prove the theme.
- **Length:** Match depth to research and film complexity, not a rigid word target; an in-depth example is the 16-page *Mindglass Procedure* PDF. Shorter focused analyses are valid when sources or scenes do not justify longer treatment.

## 3. Article information architecture

Expected flexible sequence (adapt to the film and argument):

1. Descriptive title and, if helpful, critical subtitle (film title visibly identified).
2. Film metadata separated from publication metadata: release year, director **when verified**, genre, article publication date, revised date, reading time and publication credit.
3. Abstract (~100–200 words as a starting point, not fixed requirement); research question / thesis; methodological disclosure and scope.
4. Navigable thematic/formal sections: close analysis with quotations, precise scene descriptions, film stills, captions, original comparative diagrams where meaningful.
5. Relevant external context, with accurate citations and boundaries between scholarly evidence and fictional premise.
6. Alternative interpretations, uncertainties, evidentiary limits where warranted.
7. Conclusion.
8. References and further viewing (film first, then contextual sources, consistently formatted).
9. **Cite this article** helper *after* the paper's own references; MLA 9, APA 7, Chicago, IEEE, generated from metadata. This cites the archive's writing, not the film.
10. Related research, when related tags/themes/techniques genuinely overlap; omit automatically when no suitable matches.
11. Optional film viewing section if legitimate external link exists.

The order of the scholarly body sections is not prescribed. Don't force every paper into a *Mindglass Procedure* outline. A new film with one striking formal device can justify a tighter focus.

## 4. Referencing and verification

- Sources: original short film and credited releases; filmmaker interviews/public records for production claims; peer-reviewed studies and authoritative disciplinary works for external context; trustworthy tertiary references only for appropriate factual background.
- Prefer citing exact scene timecodes or precise figure descriptions where feasible; don't invent timestamps.
- Accurate bibliographic data: author, title, publisher/venue, volume/issue/pages, date, DOI/URL, retrieval date only where required by style or mutable source.
- Direct quotations require source and location; paraphrases also need attribution. Avoid extensive unlicensed quotations or stills; check copyright/licensing/fair-use considerations per jurisdiction.
- Source links may go stale: weekly external-link checks assist, but a blocked website is not necessarily a dead reference.
- Publication citation is not evidence that the paper's content is correct. Verify underlying references independently.
- If evidence unavailable, omit the assertion or explicitly state that it is unverified. Do not invent academic publications, statistics, film awards, film festival screenings, or quotations.

## 5. Visual identity — website

Site name: **FILMMIC FOUNDATIONS**. Calm, editorial, cinematic, restrained; cream paper and deep teal/blue contrast. Distinct from fan and marketing aesthetics.

- **Typography:** DM Sans for navigation, labels, controls, captions; Libre Baskerville for major editorial headings and essay-style passages. Preserve typographic hierarchy; no arbitrary new font families.
- **Core palette (existing CSS is authoritative):** light paper `#fcfcfa`, ink `#18333a`, teal accent `#2d777d`, hairline `#dce5e4`, deep cinematic panels around `#0c1e25`. Dark mode uses existing shared theme tokens, not inverted images or untested hardcoded light elements.
- **Layout:** purposeful whitespace, restrained editorial rules, modest radii and shadows, consistent button proportions, no unnecessary colored cards. Home archive supports editorial/gallery/list/compact with stable cover aspect ratios, subtle image scaling, and smooth shape transitions.
- **Navigation:** one global header via `assets/css/site-header.css` and `assets/js/site-settings.js`, consistent on Home, About, 404, and article pages; a shared dark-teal article/section toolbar on long-form pages; a floating back-to-top island appears only once scrolled. Footer provides Archive, About, RSS and Developer Portal access.
- **Interactions:** smooth, subtle, reversible entrance/exit animations for dialogs and filters; avoid competing `transform`/animation declarations on same element. No jumps when switching views; preserve scroll position when opening/closing dialogs.
- **Accessibility:** semantic HTML, descriptive labels for images/buttons, keyboard/focus management, high contrast and reduced-motion preferences, responsive breakpoints including ~320/390/1365 widths. Native and custom interactive components must remain keyboard accessible.
- **Settings:** a shared gear popup supporting theme, font size, line spacing, reading width, motion, citation/PDF preferences, gallery defaults, local reading position, privacy. Store only in local browser storage. Avoid accounts/tracking.
- **Modals:** the entire underlying page (including sticky menu bars) is dimmed using a shared backdrop; dialogs appear below the sticky chrome. Centered image viewer with Single/Gallery modes, smooth photo transitions and zoom, native download/Share link, background scroll lock; same popup motion language on previews and share dialogs. Controls should stay visible, not stretch imagery or cover navigation unexpectedly.
- **Images:** every image used by the article viewer must have a locally bundled unique still and intrinsic dimensions; never hotlink third-party hosts in viewer controls or use duplicate close-up variants. Original diagrams must not be clickable. Authentic film stills only, not AI-simulated film frames passed off as originals; meaningful alt text/captions; descriptive lowercase filenames; WebP responsive variants where practical, lazy loading for below-fold assets. Protect photo aspect ratio with `object-fit` and image transforms rather than stretching.
- **SEO:** unique page descriptions, canonical URLs, OG/Twitter previews, structured schema, RSS, sitemap, full-text search, automatic related-article generation; developer tooling and internal admin URL are excluded from search indexing (not a security boundary).

## 6. Article PDF design standard

**Reference edition:** *Mindglass Procedure: Memory, Grief, and the Repetition of Avoidance* (existing 16-page illustrated 2026 analysis). Treat it as a concrete example, not a rigid template.

Observed reference details from PDF inspection (do not falsely claim these apply to every document): US Letter 612×792 pt; ReportLab-generated; embedded DejaVu Sans and DejaVu Sans Bold; large bold cover title (~30 pt), chapter headings (~12.2 pt), main running prose (~8.9 pt), small captions and running heads (~7–7.6 pt); conservative dark-blue/gray ink on light paper. Fonts on PDFs may differ from the website because reliable embedding and portability take priority. For future long research papers, **larger 10–11 pt text is advisable** when layout permits, rather than shrinking for page count.

PDF requirements:
- Title page: work title, analytical subtitle, film identification/year, synopsis/abstract of scope, one relevant verified still with clear caption, organizational research attribution **Filmmic Foundations**. Filmmaker credits may be included when verified, but don't conflate them with article author.
- Contents page for substantial papers; body headings and bookmarks; page numbers and running header for multi-page works.
- Comfortable margins around 0.65–0.9 in (adjust for design); single-column scholarly prose, paragraphs of reasonable length, page breaks avoiding isolated headings, consistent line height.
- Heading scale, dark-teal accent and muted gray secondary text; editorial minimalism, no decorative panels without explanatory purpose.
- Figures within the narrative at the point they are discussed, figure numbers/captions describing what is shown or compared. Distinguish actual stills from schematic reconstructions. Original diagrams should clarify a relationship, chronology, motif, or contrast, rather than add filler.
- Bibliography / References and Further Viewing with verifiable citations and active DOI/URL links, matching in-text citations. Abstract and method distinct from conclusion. Alternative readings/limitations where material.
- PDF metadata: neutral Title, Author and Creator = Filmmic Foundations; no personal private data, filepaths, software usernames, or private contacts. Strip accidental EXIF/creator annotations. Tagged headings/reading order and descriptive image alternatives wherever tooling supports it.
- Export embed fonts when legal/technically possible, keep selectable text, ensure illustrations are sharp while file size is sensible, verify physical page count/layout at 100% and by rendering pages to images. Avoid a scanned-image-only paper.
- Use the PDF workflow: render → inspect → edit → render → compare; test links, searchable text, typography, page numbering and metadata.

## 7. Article metadata & asset conventions

`<slug>/index.html` and `<slug>/article.json` are mandatory. `<slug>/preview.json` and a film PDF/images are optional. Slug: lowercase letters/numbers/hyphens, stable once published.

Package an article with `python3 scripts/package_article.py film-slug`; GitHub Actions regenerate homepage, search, RSS, sitemap, citations and suggested links. See `ARTICLE_RELEASE_WORKFLOW.md`.

`article.json`: see `ARTICLE_SCHEMA.json` for a machine-readable description. Core fields: `title`, `citation_title`, `description`, `article_date` (YYYY-MM-DD), `film_year` (4 digits), `genre`, `themes`, `techniques`, `tags`, `image`, `image_alt`, `abstract`, `updated_date`, `language`; include only true supported values.

`preview.json` can define abstract/gallery images with genuine available local image paths; preview modal must retain correct metadata and layout on mobile and dark mode.

Shared CSS/JS is preferred over duplicating a component in individual articles. Existing `scripts/build_archive.py` generates listings, publication metadata, citations, sitemap, RSS, search and related research. `scripts/quality_gate.py` guards structure but **does not fact-check film claims or academic references**.

## 8. Changes & release checklist

Before a change: inspect the latest successfully published version, identify shared components and constraints, avoid styling one page in isolation. Do not replace existing research or film media unnecessarily.

For every release:
1. Change only what is required; avoid duplicate overrides, deprecated scripts, temporary tests, private metadata and unnecessary files.
2. Run `python3 scripts/build_archive.py`, then `python3 scripts/quality_gate.py`.
3. Test Home, About, 404, at least one article; light/dark, 320/390/1365 px, keyboard-only, reduced-motion, footer, settings, filter/view changes, preview, sharing, gallery/zoom/download, citations, PDFs and printing.
4. Verify no broken internal/anchor/external links where possible, proper privacy metadata and source attribution.
5. Do not claim unrun tests passed; clearly describe any untested browser/platform behavior.
6. Preview the diff of any website ZIP before publishing, preserve unrelated prior articles, and back up a known-good deployed version.
7. Version the guide when editorial/technical standards change. Make future AI work cite its rule source and flag unsupported claims instead of improvising.

## 9. AI writing and development instructions

Use `AI_AUTHORING_RULES.md` and `ARTICLE_TEMPLATE.md` along with this document. All examples are templates, not verified sources. The AI may suggest a thesis, scene-by-scene framework, and sources to verify, but must not pretend to have seen a film or read a paper it hasn't accessed. Where resources aren't available, produce a *research plan* or qualified draft with explicit evidence gaps rather than fabricate completion. All publisher-facing author identity remains organizational, not personal.

## 10. Alike implementation lessons (v2)

The previous publication needed many corrections because externally hosted and duplicated stills, overdesigned raster diagrams, duplicated callout blocks, style-guide drift, and incomplete PDF regeneration did not follow *Mindglass* conventions. Future articles must avoid these patterns. Viewer stills are local and unique; diagrams are responsive semantic HTML/CSS with plain captions and not part of the gallery; related links sit after Watch Film; PDFs embed the same figures **without discarding body text**. ZIPs should contain only the new article and pass a full staged site build before upload. Keep users informed about what was tested locally versus what requires live browser and GitHub confirmation.
