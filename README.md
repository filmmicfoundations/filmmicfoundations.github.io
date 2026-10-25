> **For new AI authors without prior context:** start at `standards/00_START_HERE_FOR_NEW_AI.md` and `standards/NEW_ARTICLE_MASTER_PROMPT.md`. Never upload an AI authoring-kit ZIP directly to Developer Portal; only the validated article-only ZIP.

# Filmmic Foundations — publication repository

An anonymous, educational archive for evidence-led short-film analysis.

## Publishing another article

1. Create `film-slug/index.html`, `film-slug/article.json`, and any local images or PDF. Optionally add `film-slug/preview.json`.
2. Fill in the article metadata: `title`, `citation_title` (the precise scholarly article title), `description`, `article_date` (YYYY-MM-DD), `film_year` (YYYY), `genre`, `themes`, `techniques`, `tags`, and image details. If revising the analysis, set `updated_date` and document substantive changes in the article.
3. Cite verifiable sources within the article's References section. The article itself must include the article text and sources: the automated checks **cannot establish that the arguments or sources are factually correct**.
4. Run `python3 scripts/build_archive.py` then `python3 scripts/quality_gate.py` before committing. GitHub Actions runs both automatically on publication. A failed check blocks deployment.
5. Push to `main`; GitHub Actions generates the archive, search, related recommendations, citation data, sitemap, RSS and public pages.

## Reading preferences and navigation (v38)

The gear icon at the far right of the shared navigation opens a **single Settings popup** on Home, About, article pages, and 404. The standalone theme-toggle script was retired so the site has one preference controller: `assets/js/site-settings.js`, styled by `assets/css/site-settings.css`.

- **Appearance:** Light / Dark / System theme, article text size, reading width, line spacing, high contrast, and animation intensity.
- **Reading:** Focus mode, reading progress, image captions, optional browser-only reading-position bookmarks, mobile contents default, and related research.
- **Research:** MLA / APA / Chicago / IEEE default citation style, open-or-download PDF behavior, archive layout, sorting, and optional inline citation markers.
- **General:** Default single/gallery image viewer, gallery transitions, optional automated slideshow (off by default), embedded videos automatically load by default (with an optional Ask first control), keyboard shortcuts, optional outgoing-link confirmation, and reset/clear actions.

Settings are stored only in the visitor's browser (`localStorage`); no account or settings server exists. Bookmarks are *opt in*, with a Resume prompt rather than automatic page jumping. The site does not transmit saved settings. **The default is now Load automatically.** Embedding YouTube sends a request to YouTube when an article page loads. Visitors who want to prevent this can switch to **Ask first** in Settings, which stores that choice locally. An explicitly saved prior Ask first choice is preserved. The browser may separately contact font providers or websites that readers follow.

The default theme is light. A prior site theme preference is migrated automatically. Press **Alt+S** or **?** to open settings when shortcuts are enabled. All settings have keyboard-accessible controls; reduced-motion browser preferences take precedence over animation settings.

`build_archive.py` installs the shared gear, stylesheet, and script on new articles using an older header. A single shared controller places a Back to Top button in the lower right of an article or About page once the reader has scrolled far enough; it is removed from secondary menu bars. To add an external video with the reader-controlled Ask first option, set `data-ff-embed-url` rather than `src` and wrap the iframe in `.video`.

## Quality and link checks

- `python3 scripts/quality_gate.py` checks article metadata, locally linked images/PDFs/pages/anchors, basic accessibility, citation consistency, PDF/image privacy metadata and generated RSS/sitemap/search.
- `python3 scripts/check_external_links.py` checks outbound article sources and films. GitHub Actions runs it weekly; broken links produce a failed check with an attached text report. Many websites block automation (403/429), so ambiguous failures are warnings, not proofs of a dead link.
- Browser tests should include keyboard navigation, modal dismissal and focus, dark/light mode, mobile widths, download buttons, print preview and reduced motion. A static validator cannot substitute for those.
- `404.html` is GitHub Pages' custom, responsive not-found page, with scoped styles in `assets/css/not-found.css`. `assets/css/print.css` is shared print-only styling.

## Anonymous operation: limits and practices

The public pages intentionally use **Filmmic Foundations** as the publication author. Avoid personal bylines and do not put private contacts, email addresses, addresses or account identifiers in file metadata, source comments or filenames. Film credits and attributed academic sources may still contain filmmakers' names as a matter of accuracy.

A public GitHub repository exposes the account that owns it, commit author names/emails, and possibly earlier commits even after visible pages change. **This ZIP cannot remove or hide repository history.** Configure your repository under the publishing identity you intend to expose; choose GitHub's private/noreply commit email; inspect the complete existing commit history before publication. Past public exposure cannot be undone simply by changing files. Connected third-party services (such as remote fonts or embedded video) may receive access requests.

The audit detects common embedded metadata in PDF and images; it is a safeguard, not a guarantee of anonymity. Review factual film credits and media releases independently.

## Files published to GitHub Pages

The deploy action stages only the HTML, CSS, JS, film assets, PDF, favicon, RSS, sitemap and search index. The scripts, action files and this README remain in the repository but are not deployed as pages.

## Developer Portal and Publication Standard (v39)

**First-time installation:** This repository must be uploaded/committed to GitHub once using the existing deployment process. The GitHub Actions workflow must include the `dev/` and `standards/` directories in its public staging step. Future routine updates can use the portal at `/dev/`.

### The temporary passcode is NOT security

`/dev/` is visible publicly, although excluded from search indexing. Enter **123** to reveal the management UI. This is merely a convenience screen: the code is discoverable in public JavaScript, so it does **not** protect the page or constitute authentication.

To publish or restore, the user must separately enter a fine-grained GitHub personal access token (PAT) **each portal session**. The portal uses that token in JavaScript only in memory to call `api.github.com`; it does not save credentials to disk, local storage, cookies, URLs, or uploaded files. However, handling a token in a publicly served browser app is inherently higher-risk than a server-authenticated administrator backend. Use a repository-restricted, short-lived token, revoke it when not needed, and do not use a token with broad organization/account access. Fine-grained PAT permissions: this specific repository, **Contents: Read and write**; **Actions: Read** for deployment history; changing `.github/workflows` may require more permissions and is excluded by default. Avoid untrusted browser extensions on this page. For actual security, migrate publishing to a backend such as Cloudflare Access + Worker.

### Using the portal

1. Open the **Developer portal** link in the site footer, or navigate to `/dev/`.
2. Enter the demonstration code `123`.
3. **Connection & status:** enter your GitHub PAT. This is necessary only for upload publication and restores; guide and public source downloads don't require a token.
4. **Website updates:** upload a compatible site ZIP. Click **Inspect ZIP** to validate its structure and CRC and compare all files to the GitHub `main` branch. Workflow changes are excluded unless explicitly included. Verify every file change. Tick confirmation and choose **Publish update**; the portal creates Git blobs, a tree and a new commit. GitHub Actions then validates and deploys asynchronously. A successful commit does **not** imply a successful deployment; check Actions afterward. Files absent from the update ZIP are always preserved. Deletions require manual management.
5. **Versions & backups:** download the last verified successful deployment's full repository source ZIP (the fallback link before connecting follows the public `main` branch, which might contain an unvalidated update). Choose **Restore** on a previous *successful deployment* to create a new commit with that deployment's complete source tree. Git history is preserved. Confirm the new deployment succeeds. Note that restoring an older version can remove the portal itself if it predates v39.
6. **Publication language:** download `Filmmic_Foundations_Standards_Package.zip` (PDF, AI instructions, article template, schema, checklist and detailed site style language). The Markdown/JSON are more suitable than PDF for AI ingestion; the PDF is a human-readable reference.
7. **Lock portal** clears the token from this page's in-memory state. Closing/reloading the tab clears it too. Revoke the token in GitHub if a browser session is suspected to be compromised.

### Limits and maintenance

- The public site is still a **static GitHub Pages website**. The portal does not host a private server or secure a password by itself.
- GitHub provides the actual permission check. The portal does not bypass branch protection; writes may be rejected by repository policies. Browser CORS and GitHub API usage limits may vary; test publishing on the deployed HTTPS website.
- A ZIP is processed locally in the browser (JSZip v3.10.1, MIT licensed, with vendored license). Unsafe paths, private-key-like files, oversized archives and duplicates are rejected. Uploaded ZIP data is not sent to a third-party uploader; changed files are sent to the authorized GitHub repository via its API on explicit publication.
- Related articles, full-text search, metadata, citation helpers, sitemap and RSS are generated by GitHub Actions. New articles still require human editorial and source verification.
- The Source ZIP updates automatically because it points at the successful deployment commit from GitHub's run history. A successful deployment snapshot is distinct from the newest unverified commit.
- Publishing removes nothing absent from the uploaded ZIP; this avoids deleting unrelated short-film research. Use GitHub for intentional deletions or implement a separate confirmed delete workflow later.
- If a token lacks Actions read permission, the history/rollback UI cannot verify successful deployments and disables that function rather than claiming generic commits are safe restore points.

## Developer Portal usability update (v40)

The portal's **Website updates** section is now a guided, single-screen procedure:

1. **Connect** to GitHub using a short-lived repository-limited fine-grained token in the inline form. The dedicated Connection tab remains available.
2. **Choose ZIP** — either a complete website export or a partial patch ZIP containing only changed relative paths, for example `dev/index.html` and `assets/js/developer.js`. Missing files are always preserved; publication does not delete files.
3. **Inspect/review** — selection triggers ZIP validation automatically; after connecting, the portal automatically compares with GitHub. The optional Inspect button reruns comparison. A readable checklist shows connected, ZIP received, changes detected and review approved.
4. **Publish** — the button stays clickable when not yet ready and explains precisely what is still required, rather than silently remaining disabled. It still cannot publish without authentication, an up-to-date comparison with at least one modified/new file, and confirmation.

If all selected files already match GitHub, the portal explains that nothing needs updating. GitHub Actions continues to validate and deploy after the commit; a successful commit is **not** a confirmed successful deployment. Use **Versions & backups** to inspect recorded successful deployments.

**Installation note:** If the previously deployed portal cannot publish v40 because of its old readiness checks, make this update once via GitHub Desktop or the GitHub web uploader. This isn't a backend or a security upgrade: the public demonstration passcode `123` is unchanged and GitHub API authorization remains necessary to publish.

## Developer Portal v43

The `/dev/` interface has two compact sections: Updates, and Backups & Guides (with a combined publication standards download).
The temporary code `123` is only a visual gate on public GitHub Pages, not authentication.
Actual publishing and restoring require a repository-scoped, fine-grained GitHub token.

After GitHub verifies a token, the portal saves it in **tab-scoped sessionStorage** so a
reload in that tab can reconnect without retyping. Disconnect or **Lock portal** clears
it. Browser session restoration may preserve sessionStorage after a browser restart;
for sensitive credentials, use short expiration dates and explicitly disconnect when
finished. Anyone who can execute JavaScript on the same origin could read tab storage.
No token is included in source downloads, site packages, the page URL, or localStorage.

The **How to create or renew a token** link opens instructions; a GitHub 401 response
clears rejected credentials and opens the same guide automatically. The required
fine-grained token permissions are **Contents: Read and write** and **Actions:
Read-only** for deployment history, scoped to this repository. Use a short expiration.

The portal supports both complete-site and patch ZIPs, reports exact differences
before publication, preserves omitted files, and can restore successful deployment
revisions. ZIP entry decompression and CRC verification happen per file rather than
through JSZip's built-in streaming CRC option.

## Developer Portal deployment progress (v44)

The public `/dev/` passcode screen remains a visual convenience gate. Its copy has been
simplified, **but it is not authentication**. The details and safer-operation guidance
remain in the repository documentation and token-renewal popup. Actual GitHub writes
require a fine-grained personal access token with repository Contents write permission.

After the update ZIP has been reviewed and approved, the portal displays a **live
release-status panel**:

1. **Transfer files:** each changed file's Git blob is uploaded to GitHub; counts are
   exact, not an estimated transfer percentage.
2. **Create release:** the tree and commit are created and the `main` reference advances.
3. **GitHub Pages:** the portal polls the specific GitHub Actions workflow run by its
   exact commit SHA, displaying runner/job status when the API provides it.
4. **Live website:** after a successful workflow, the portal polls a modified public
   asset with cache-busting and compares its Git blob hash to the uploaded version.
   If the package does not contain a directly comparable public asset, workflow
   success can be reported but the updated live file cannot be independently verified.

If the new public file is confirmed, the portal automatically reloads itself to use
new HTML/JS/CSS. It leaves other open website tabs untouched to avoid losing reading
positions or form state. When live verification times out, it does **not** falsely
report success; use the GitHub Actions link and optional manual reload.

Pending deployment status is saved to tab-scoped session storage (without storing ZIP
content) so a portal reload/reconnect can resume monitoring. Automatic post-release
reload uses a single-use tab flag to return the maintainer to Updates and show the
completion message without reentering the cosmetic access code.

**Important patch-ZIP fix:** a ZIP containing only `dev/index.html` or another nested
`index.html` is now treated as a patch and preserves the full path. Only recognizable
complete-site archives wrapped in a containing folder are unwrapped. In earlier
versions, a single nested index could be misidentified as a wrapped site, potentially
replacing the root homepage. Inspect the file comparison before approving every
publication.

This release has been tested against simulated GitHub API and deployment responses;
real deployments must still be verified on the live GitHub Pages site.


### v45: Social previews and developer history

The homepage title and description are unchanged. A broadly compatible 1200×630 JPEG is now used for the site-wide social card, with explicit Open Graph dimensions, site name, Twitter image/title/description, PNG favicons (32 and 192 px), an SVG icon and an Apple touch icon. Third-party apps may still show their own source label such as GitHub rather than the website title.

The Developer Portal history now merges successful GitHub Pages runs with main-branch Git commits. Only confirmed workflow runs are labeled **Published**; other entries say **Repository revision**, and restoring those is not proof they deployed successfully. GitHub only provides revisions still present in the repository history, not arbitrary ZIP files created outside the repository. Restore operations remain destructive to later site content; download a backup first.

### Developer Portal — release tracking (v46)

The deployment tracker is a dismissible popup with an option to reopen it during an active release. It checks GitHub Actions and verifies a changed public asset when available; if status is temporarily inaccessible, monitoring can be retried rather than getting stuck on a permanent error. An optional release description controls the Git commit title, while a filename-based suggestion is used by default. Older generic commit titles can be summarized from their changed filenames when GitHub allows access. Publication Standards supports grid and list layouts. The shared navigation uses an accessible Home icon.

*The completion indicator describes verified stages, not an estimated transfer percentage. A token with insufficient GitHub Actions read permission may limit workflow detail. Source ZIPs and rollback commits remain available independently of this visual status.*


## Developer Portal v47 navigation

- **Updates** handles repository connection and validated ZIP publishing.
- **Backups & guides** combines repository history, source downloads, and publication standards. Download the complete guide, or expand **Individual files** for seven separate references.
- The access code (`123`, a public client-side interface gate) is remembered in the current browser tab using session storage. **Lock** asks for confirmation before clearing the remembered access state and any stored GitHub token. Closing a tab normally clears session storage, but browser session restoration can retain it.
- Disclosure menus, mobile tables of contents, and homepage filter choices use consistent open/close animation timing. Reading Preferences now uses accessible custom choice popovers that open without shifting the page.
- The access code does not secure the publicly delivered frontend. GitHub authorization remains necessary for publishing, and repository-scoped short-lived tokens are recommended.


## v48 — consistent settings and deployment workspace

- **Archive filters:** a borderless, softly elevated cream panel and a narrow teal indicator rather than a numeric counter.
- **Developer Portal:** one page with three smooth disclosures (Updates, Backups, Publication guides). Backups initially shows four releases and puts older versions behind a separately scrolling disclosure; no pagination button. The Lock dialog actions are aligned consistently.
- **Reader Settings:** calmer header, desktop sidebar/mobile tab navigation, uniform control sizing, and animated floating select options using the underlying native select as the stored-value source. The same local storage keys and defaults are retained.
- **Motion:** reversible in-flow disclosure animations set their collapsed height *before* layout expands, minimizing viewport jumps. Reduced-motion settings disable animations.
- **Publishing status:** status remains tied to confirmed GitHub stages, with an animated checking state when build information is delayed. Refreshes do not restart stale status checks indefinitely: an unverified release clears its pending marker after seven minutes from its original submission and presents actionable GitHub Actions information. Status can be retried manually. Without a comparable public changed file, a reachable homepage alone is **never** presented as proof of deployment.
- **Privacy:** access code remains a public presentation gate. GitHub authorization remains separate; no token is included in ZIPs.

A browser check was run using locally assembled HTML and CSS because local URLs are restricted in the test environment. The final deployment still needs a live GitHub Pages test, particularly the Actions-status recovery path.

### v51 interface maintenance

- ZIP inspection runs automatically when a file is selected; no additional Inspect ZIP button is shown.
- Version history loads repository commits and successful deployment records concurrently with a bounded request time, so an unavailable Actions endpoint cannot indefinitely block commit history. The portal displays at most 50 recent revisions. Old Git commits are **not deleted** (doing so would require unsafe history rewriting).
- Applied archive filter chips appear beside the filter trigger and animate away on removal.
- Article and About Back to Top buttons dock just above the footer rather than overlapping it.
- All native modal dialogs use shared background-scroll prevention; only the active dialog's interior is scrollable.
- Image gallery mode visibly disables the zoom percentage along with the minus, plus and Fit controls.


### October 21, 2026 — QA and repeatable article releases

This maintenance release centralizes dialog backdrops in `assets/css/overlay-contract.css` (including darkened sticky navigation), fixes developer history ID conflicts, implements determinate and cancelable ZIP inspection progress, and provides fractional GitHub file-transfer progress without falsely implying deployment success. Native lazy film stills now reserve intrinsic image dimensions, and redundant publication-date meta tags are removed idempotently during builds.

Future articles are prepared with `python3 scripts/package_article.py film-slug`. Only the slug's article files go in the ZIP; GitHub Pages derives the archive, metadata, citations, related links, feed and sitemap. The v2 standards and handoff prompt are downloadable through the developer portal. Offline interaction tests run via `python3 tests/browser_smoke.py` and `python3 tests/zip_inspection_smoke.py` when Playwright/Chromium are available. Those tests do not certify third-party APIs, live GitHub publish/restore, or Safari.
