#!/usr/bin/env python3
"""One publication-level citation source for the public citation tool.

Plain-text and safely escaped rich-text variants come from article.json.
These examples cite the analysis (not the film); check institutional variants.
"""
from datetime import date
from html import escape
from urllib.parse import quote

PUBLICATION = 'Filmmic Foundations'
BASE = 'https://filmmicfoundations.github.io/'
MONTHS = ('Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.')


def parts(article):
    title=article.get('citation_title') or article['title']
    apa_title=article.get('citation_apa_title') or title
    day=date.fromisoformat(article['article_date'])
    url=BASE+quote(article['slug'])+'/'
    return title,apa_title,day,url


def make_citations(article):
    title,apa_title,day,url=parts(article)
    short=f'{MONTHS[day.month-1]} {day.day}, {day.year}'
    mla=f'{day.day} {MONTHS[day.month-1]} {day.year}'
    # MLA: corporate author, website and publisher are the same organization;
    # avoid repeating the name and start with the article title (MLA Style Center).
    return {
        'mla': f'“{title}.” {PUBLICATION}, {mla}, {url}',
        'apa': f'{PUBLICATION}. ({day.year}, {day.strftime("%B")} {day.day}). {apa_title}. {url}',
        'chicago': f'{PUBLICATION}. “{title}.” {day.strftime("%B")} {day.day}, {day.year}. {url}',
        'ieee': f'{PUBLICATION}, “{title},” {short}. [Online]. Available: {url}',
    }


def make_citation_html(article):
    title,apa_title,day,url=parts(article)
    title,apa_title,url=map(escape,(title,apa_title,url))
    site=escape(PUBLICATION)
    mla=f'{day.day} {MONTHS[day.month-1]} {day.year}'
    short=f'{MONTHS[day.month-1]} {day.day}, {day.year}'
    # HTML is generated locally from trusted, escaped metadata.
    return {
        'mla': f'“{title}.” <em>{site}</em>, {mla}, {url}',
        'apa': f'{site}. ({day.year}, {day.strftime("%B")} {day.day}). <em>{apa_title}</em>. {url}',
        'chicago': f'{site}. “{title}.” {day.strftime("%B")} {day.day}, {day.year}. {url}',
        'ieee': f'{site}, “{title},” {short}. [Online]. Available: {url}',
    }
