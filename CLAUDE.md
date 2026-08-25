# windows13 — project notes

## useRbox v2.0

`useRbox-v2-upgraded.html` is the reference/demo build of the useRbox widget
(full-screen panel, transparency toggle, notch collapse, translator hookup
via the shared `rvViewMode` localStorage key — see that file's `<script>`
for the exact convention shared with `map-merger-venti/translator_v7.html`).

`embed/useRbox.js` + `embed/useRbox.css` are the standalone, single-tag
embeddable version of the same widget, meant to be dropped into any page
with:

```html
<script src="/embed/useRbox.js" defer></script>
```

It self-injects its DOM/CSS, scopes its CSS custom properties to
`#topRightUser` (won't clash with a host page's own `--` variables), and
reads `window.RUDVENTUR_TRANSLATOR_URL` if a page needs to override the
default translator path.

### Planned: embed across many sites (not just rudventur.com)

Flagged by Rudy (2026-08-25) — not built yet, just recorded so it isn't
lost:

- The useRbox widget needs to eventually embed on **many separate sites**,
  not only pages within `RudVentur.com`.
- Copy-pasting `embed/useRbox.js` + `useRbox.css` into every site's repo
  won't scale once there are "many many" of them — each copy drifts out of
  sync with the next update.
- Likely direction: a single canonical source (this `embed/` directory, or
  a dedicated shared repo) that every site's one `<script>` tag points at,
  so one update propagates everywhere instead of N manual copies.
- Open questions to resolve before building this out: where the canonical
  copy should live (this repo vs. a new dedicated repo), how each site
  pulls it (raw GitHub URL vs. a small CDN/hosting step), and what the
  full list of target sites actually is.
- The current `embed/useRbox.js` already externalizes the translator URL
  via `window.RUDVENTUR_TRANSLATOR_URL`, so it's a reasonable base to build
  the multi-site version from once the above is settled.

## Planned: translator voice + subtitle features

Flagged by Rudy (2026-08-25), for `map-merger-venti/translator_v7.html` —
**not built, not scoped yet**. Rudy said he'll follow up with the exact
options before this gets built, so treat this as a heads-up, not a spec:

- **Speech-to-text** — "type from speaking": voice input transcribed into
  the text field.
- **Text-to-speech with accents** — "speak from typing": typed text read
  aloud, with a selectable accent per language (not just one default
  voice).
- **Dual-language subtitles, with options** — captions/subtitles shown in
  two languages at once, configurable — Rudy explicitly said the exact
  options are still to come ("I will tell you what options").

Do not start implementing until Rudy sends the options he mentioned.
