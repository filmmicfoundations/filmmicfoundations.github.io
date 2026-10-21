#!/usr/bin/env python3
"""Publish a small read-only snapshot of the latest 50 repository revisions.

This is generated in GitHub Actions with full git history and staged on Pages,
so the Developer Portal can show saved versions even if GitHub's API is blocked.
It never rewrites Git history or claims older commits were deployed.
"""
from pathlib import Path
from datetime import datetime, timezone
import json
import subprocess
import os

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/release-history.json'


def create_history():
    revisions = []
    published_revision = ''
    # actions/checkout defaults to a shallow clone. During a GitHub Actions
    # deploy, safely deepen that clone using the checkout-provided credentials
    # so the last fifty actual Git revisions can be listed. This never writes
    # to the repository or requires a workflow-file change.
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        try:
            shallow = subprocess.run(['git','-C',str(ROOT),'rev-parse','--is-shallow-repository'],
                                     capture_output=True,text=True,timeout=5)
            if shallow.returncode==0 and shallow.stdout.strip()=='true':
                subprocess.run(['git','-C',str(ROOT),'fetch','--unshallow','--quiet'],
                               capture_output=True,text=True,timeout=40,check=True)
        except (subprocess.CalledProcessError,FileNotFoundError,subprocess.TimeoutExpired) as exc:
            print(f'Note: full Git history unavailable; using accessible revisions ({type(exc).__name__}).')

    try:
        raw = subprocess.check_output(
            ['git', '-C', str(ROOT), 'log', '-50', '--date=iso-strict', '--pretty=format:%H%x1f%cI%x1f%s%x1e'],
            stderr=subprocess.DEVNULL, text=True, timeout=12,
        )
        for record in raw.split('\x1e'):
            fields = record.strip().split('\x1f')
            if len(fields) < 3:
                continue
            sha, timestamp, title = (x.strip() for x in fields[:3])
            if len(sha) != 40 or not all(c in '0123456789abcdef' for c in sha.lower()):
                continue
            revisions.append({'head_sha': sha, 'date': timestamp, 'message': title[:150]})
        if revisions:
            # This JSON is deployed only when the workflow succeeds, so its
            # commit is guaranteed to be served by the successful Pages release.
            published_revision = revisions[0]['head_sha']
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    data = {
        'schema': 1,
        'published_revision': published_revision,
        'versions': revisions[:50],
        'description': 'Saved Git revisions. Only the current revision is confirmed by this published snapshot.'
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Generated read-only revision index ({len(revisions)} revisions).')


if __name__ == '__main__':
    create_history()
