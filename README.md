# Filmmic Foundations — site and research publishing tools

**Live address:** https://filmmicfoundations.github.io/

This is the complete website, including the existing Mindglass Procedure article, original film images, and original design. The navigation and search are lightweight additions, not a redesign.

## Upload the site

1. Unzip the package and upload **the contents** to the root of your GitHub repository `filmmicfoundations/filmmicfoundations.github.io`.
2. Include the hidden `.github/` folder. Do not upload the ZIP as a single file.
3. Under **Settings → Pages**, set **Build and deployment → Source: GitHub Actions**.
4. The existing `Publish Filmmic Foundations` workflow regenerates homepage cards and the sitemap when changes are pushed to `main`.

## Website features

- The homepage search field filters the cards already in the archive by title, description, and tags. It does not search full article text or the whole web.
- **Explore** is a compact dropdown menu on both pages; **On this page** is an additional article-specific dropdown.
- The Sources link in the article dropdown goes to the real references section.
- The PDF submission questionnaire is downloadable from the homepage under **Preparing a research submission?**.
- The original desktop CSS files (`style.css` and `mindglassprocedure/style.css`) are untouched. New UI styles live in `site-features.css` and the tiny script `site-features.js`.

## Add an article manually (no AI required)

Create a new folder, e.g. `my-film/`, with `index.html`, `article.json`, and an `assets/` directory. Follow `mindglassprocedure/article.json` as the metadata example. When you commit, GitHub Actions adds the card to the homepage and updates `sitemap.xml`. The article page itself is yours to author.

## AI draft builder (optional; GitHub Actions)

**The AI builder is a drafting tool, not an autonomous research author or fact checker.** It uses the OpenAI API and may incur API charges. It cannot guarantee the depth or fidelity of the hand-edited Mindglass Procedure analysis. It does not create fictional photorealistic film stills. It uses your supplied, cleared images and can generate simple source-grounded conceptual diagrams.

### One-time setup

1. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**.
2. Name the secret `OPENAI_API_KEY` and paste your OpenAI API key. **Never add it to HTML, JavaScript, or committed files.**
3. Under **Settings → Actions → General**, allow workflows to create and approve pull requests (if this option is available for your repository), and ensure the workflow has permission to create branches and pull requests.
4. Confirm **Settings → Pages → Source: GitHub Actions**.

### Draft a new article

1. Download and complete `Filmmic_Foundations_Article_Submission_Questionnaire.pdf` (linked from the homepage). Transfer your answers to `notes.md` or another plain-text notes file.
2. In GitHub, create `submissions/your-film-slug/paper.pdf` (searchable text PDF) and `submissions/your-film-slug/notes.md`.
3. Add at least one cleared JPG, PNG, or WebP cover image inside `submissions/your-film-slug/assets/`. Other images may also be included. You are responsible for image rights.
4. Commit those files to GitHub.
5. Go to **Actions → Draft article from research PDF → Run workflow** and enter `your-film-slug`.
6. Wait for the workflow. It uses the API key privately, extracts PDF text, drafts the article, and opens a **pull request**.
7. Read the draft carefully. Verify the original paper, film facts, all citations, diagram labels, image credits, and the HTML. Revise as needed.
8. When ready, remove the `noindex` meta tag from the new article's `index.html`, then **merge** the PR. The standard publishing workflow will add the article to the homepage automatically.

**Privacy warning:** Your repository is public, so PDFs and notes placed in `submissions/` are publicly accessible. Do not upload confidential, embargoed, or third-party copyrighted material without appropriate permission. For private research, use a separate private submission repository and a modified workflow instead.

**GitHub settings note:** Some repositories do not allow GitHub Actions to create pull requests by default. If the run fails at "Create a review pull request", enable that permission under Settings → Actions → General, then rerun.

**Limitations:** The workflow accepts a searchable PDF with 500+ extracted characters and up to 80 pages / 170,000 extracted characters. It does not OCR scanned PDFs, infer image rights, verify external sources, or extract embedded PDF images automatically. If the AI API returns incomplete content, the workflow fails rather than silently publishing it.

## File guide

| File | What it controls |
|---|---|
| `index.html` | Homepage layout and research card container |
| `style.css` | Original homepage styling (unchanged) |
| `responsive-fixes.css` | Earlier mobile adjustments |
| `site-features.css` | New dropdown, search, and submission-guide styles |
| `site-features.js` | Search, dropdown dismissal, sticky-header anchor navigation |
| `mindglassprocedure/index.html` | Original detailed analysis |
| `mindglassprocedure/style.css` | Original article styling (unchanged) |
| `generated-article.css` | Small additions for generated draft pages |
| `scripts/build_archive.py` | Regenerates article cards and sitemap |
| `scripts/generate_article.py` | Optional PDF-to-draft generator |
| `.github/workflows/deploy.yml` | GitHub Pages deployment |
| `.github/workflows/draft-article.yml` | Manual AI draft workflow and review PR |
| `Filmmic_Foundations_Article_Submission_Questionnaire.pdf` | Printable research submission checklist |

## Editorial policy for generated drafts

A generated draft is **not** automatically publication-ready. Its `index.html` contains a `noindex` tag and an editorial review section, and the PR includes `EDITORIAL_REVIEW.md`. A human editor must review and approve it before publishing.
