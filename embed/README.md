# useRbox — shared embed

Single-tag, site-wide version of the useRbox widget (see
`../useRbox-v2-upgraded.html` for the reference/demo build and its
in-file docs).

## Usage

Drop this one tag into a page (works from `<head>` with `defer`, or right
before `</body>`):

```html
<script src="/embed/useRbox.js" defer></script>
```

It injects `useRbox.css` itself (resolved relative to its own `<script>`
tag, so it works from any path depth) and builds its own DOM — no other
markup needed on the host page.

### Per-site translator path override

The widget defaults to `/map-merger-venti/translator_v7.html` for the 🌐
translator link. If a site serves the translator from somewhere else, set
this **before** the `<script src="/embed/useRbox.js">` tag:

```html
<script>window.RUDVENTUR_TRANSLATOR_URL = '/path/to/translator_v7.html';</script>
```

## Status: single-site only, for now

This directory is currently only consumed by pages inside this
(`windows13`) repo. Embedding it across **many separate sites** is planned
but not yet built — see `CLAUDE.md` at the repo root for the open
questions (canonical hosting location, how each site pulls it, full list
of target sites) that need answers before that expansion happens.
