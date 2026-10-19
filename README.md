# Filmmic Foundations — Website

This repository powers **https://filmmicfoundations.github.io/**.

## First-time setup (required for automatic article listings)

1. Upload **everything inside this ZIP**, including the hidden `.github` folder, to the root of your `filmmicfoundations.github.io` repository.
2. In GitHub, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Open **Actions** to confirm that **Publish Filmmic Foundations** ran successfully.
4. The homepage and sitemap are generated automatically when you push a change.

**Important:** If you use GitHub's web upload, select the files and folders from inside the unzipped package. Make sure the `.github/workflows/deploy.yml` file is uploaded too. Some file managers hide dot-prefixed folders.

## Add a new film article (no homepage editing!)

Create a folder at the repository root, e.g. `my-new-film/`, with:

- `index.html` — the article's actual page (copy the structure of `mindglassprocedure/index.html` if helpful; update its text and references).
- `article.json` — the article information used to generate the homepage card.
- `assets/` — any images the article uses.

Example `my-new-film/article.json`:

```json
{
  "title": "My New Film",
  "year": "2027",
  "type": "FILM ANALYSIS",
  "description": "A brief introduction to the article.",
  "image": "assets/my-new-film-cover.webp",
  "image_alt": "Description of the cover image",
  "order": 2
}
```

Put `my-new-film-cover.webp` inside `my-new-film/assets/`.

**Commit your changes.** GitHub Actions will automatically rebuild the homepage article cards, publication count, and `sitemap.xml`. To change their order, edit the `order` value in each article's `article.json`.

The homepage cards are bracketed by `ARTICLES START` and `ARTICLES END` comments; **don't edit inside these markers** because the build script replaces that section.

## Where to make changes

- `index.html` — homepage layout, title, text, and card container.
- `style.css` — original homepage styling.
- `responsive-fixes.css` — homepage mobile improvements.
- `mindglassprocedure/index.html` — full existing film analysis.
- `mindglassprocedure/style.css` — original article styling.
- `mindglassprocedure/responsive-fixes.css` — article mobile and navigation fixes.
- `mindglassprocedure/article.json` — current article's homepage listing.
- `scripts/build_archive.py` — automatic homepage/sitemap builder.
- `.github/workflows/deploy.yml` — GitHub Pages publishing workflow.

## Fixes in this edition

- Visible Filmmic Foundations branding on homepage and article.
- Correct canonical and social preview image URLs for the new root domain.
- Narrow-screen title sizing and horizontal overflow prevention.
- Mobile entrance animations disabled to avoid the page seeming to slide.
- Sources link now scrolls to the references heading with a sticky-header offset.
- Existing text arrows remain text symbols (not colorful emoji-style arrows).
- CSS is separated and documented, preserving the existing desktop appearance.
- Homepage article listings generated from per-article metadata.

The existing research PDF and film images are preserved.
