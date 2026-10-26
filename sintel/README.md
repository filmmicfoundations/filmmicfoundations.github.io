# Sintel article maintenance

The web article and PDF derive from the same manuscript and original image-placement plan.

From the website root, run:

```sh
python3 sintel/build_article.py
python3 sintel/build_pdf.py
python3 scripts/build_archive.py
python3 scripts/quality_gate.py
python3 scripts/media_manifest.py --check
```

Note that `build_article.py` regenerates article HTML and the figure map. Do not edit the finished article's figure sequence independently of its source in `still-placement-plan.json`.

The fifteen film stills are genuine extracts from *Sintel* (2010) — Blender Foundation, CC BY 3.0. The sixteen named credit/metadata elements in the media records are not substituted for the film's full creative credits; retain the original attribution links in `MEDIA_AND_ATTRIBUTION.md`.
