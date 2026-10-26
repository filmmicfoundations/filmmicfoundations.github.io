# Developer Portal — Publication and Site QA

This document explains the developer portal tools introduced in the October 2026 release. The GitHub publishing path remains the sole mechanism for modifying the live repository. All inspection, comparison, preview and health tools are **read-only** until the separate approval and Publish update action.

## Working with a ZIP

1. Upload the ZIP in **Updates**. The portal validates filenames, archive size and CRC integrity before comparing with GitHub. A rejected ZIP is never published.
2. Review **Publication readiness**. Explicit critical structural failures block publication. Warnings require human review; checks labeled *Not verified* are not passes. Source-count checks do not establish factual correctness, and only files within the ZIP can be inspected locally.
3. Select **Preview the update** to choose homepage or included article, light/dark mode, and desktop/mobile dimensions. The preview runs in a sandbox with JavaScript disabled. If embedding is blocked, select **Show quick preview** for the cover/title/text fallback. It does not certify interactive controls, iframe video playback, native Safari, or how the actual GitHub deployment renders.
4. Select **Inspect file differences** to compare individual changed text files. With GitHub connected, comparisons use the exact revision SHA recorded at inspection, where public GitHub content is reachable. Large and binary files are not diffed inline. The displayed region is a **focused textual comparison**, not a full line-by-line diff.
5. Complete the existing GitHub file review, tick the approval box and publish. Workflow changes remain opt-in. A live deployment should only be claimed when GitHub confirms it.

## Health & Articles

- **Run health check** inspects the *published* media manifest, samples cover/preview/PDF asset URLs using HEAD, checks that the homepage responds and requests recent workflow status from GitHub. The run is clearly labeled as partial and reports unavailable network checks as unknown rather than successful. Third-party sources and YouTube/Vimeo playback are not reliably verifiable from the browser.
- **Article & media inspector** reads the published media manifest. It shows cover/preview frames, asset counts, figure counts, PDF links, and duplicate preview paths. It is a read-only inventory, not a replacement for manual verification that each still supports the adjacent prose.
- If a newly added article lacks required structure (such as article metadata, 10 sources, local stills, six preview frames, PDF, or citation targets), the portal displays **Fix required** and blocks the publish button. For partial updates to existing articles, omitted files are treated as potentially already published, with warnings rather than speculative failures.

## Research publication criteria

- Film essay: 20–30 minutes of substantial analysis, with **at least 10 verifiable sources** across primary, secondary and tertiary types; 15–20 preferred.
- Media: 7–15 purposeful, genuine locally stored stills; six distinct non-diagram preview images; diagrams separate from the viewer.
- PDF: match the approved Mindglass reference, complete prose, links beside supported claims, a film-information table, and figure order matching the article. The browser preflight does not parse or visually compare PDFs, so check that separately.
- Always perform visitor-style light/dark desktop/mobile navigation tests on the updated site, visually inspect PDFs, and verify actual deployment after publication. A clean browser-side preflight alone does **not** certify the website.

## Operational notes

- New tools use `assets/js/portal-quality.js` and `assets/css/portal-quality.css`, keeping GitHub write operations in the existing developer script.
- Update preflight is scoped to the ZIP; Health is scoped to the live public site. Their statuses must not be conflated.
- No token is stored by the QA module. The original portal still uses a tab-scoped GitHub token with the security caveats already documented on the site.
