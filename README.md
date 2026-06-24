# Voilà

Voilà is a tiny static site that renders entries from a local JSON file as
pastel sticky notes in a grid. Everything lives in the repo — add an entry with
the `vla` CLI, commit, push, and GitHub Pages redeploys. No backend, no build
step.

## Layout

```
config/fields.json    # the questions/keys to capture (date, health, study, …)
data/entries.json     # the committed data the site renders (one object per note)
cli/vla.js            # the `vla` CLI (commander) — add / serve / export / fields
cli/add-entry.js      # `vla add`  — asks each field, appends, commits
cli/serve.js          # `vla serve` — zero-dependency local static server
cli/export-cards.js   # `vla export` — orchestrates the card export
cli/fields.js         # `vla fields` — CRUD the question fields
cli/lib/              # shared CLI internals:
  util.js             #   paths, JSON IO, randomness, date helpers
  palette.js          #   tones, fonts, colors + tone picker
  card-svg.js         #   renders one card to an SVG string
  png.js              #   SVG -> PNG converter resolution
  reel.js             #   stitches PNGs into a 1080x1920 MP4 reel
index.html / styles.css   # the page
js/                   # ES modules:
  main.js             #   entry point — loads data, renders the board
  data.js             #   JSON fetch
  board.js            #   sticky-note grid + click-to-open
  modal.js            #   Instagram-post carousel
  shapes.js           #   decorative random shapes (SVG geometry)
  tones.js            #   pastel palette + non-repeating tone picker
  fonts.js            #   playful font list
  highlight.js        #   number highlighting
  random.js           #   shared randomness helpers
```

## How it works

- **`config/fields.json`** is the single source of truth for fields. Each field
  has a `key`, a `label`, and an optional `type`. A field of `type: "date"` is
  shown highlighted at the top of each note and defaults to today in the CLI.
- **Each object** in `data/entries.json` becomes one sticky note. Each field is
  shown as its own labelled row. Notes are sorted newest-first by date.

## The `vla` CLI

All tooling lives behind one command (built with [commander]). Run `npm install`
once. Then invoke it any of these ways:

- `npm run add` / `serve` / `export` / `fields` — the aliases below
- `node cli/vla.js <command>` — directly, no global install
- `npm link` once to put a global `vla` on your `PATH`, then `vla <command>`

```bash
vla --help
vla add                 # add an entry, then commit
vla serve --port 3611   # preview the site locally
vla export              # export today's Instagram cards
vla fields list         # manage the question fields
```

(Examples use the global `vla`; without `npm link`, run `node cli/vla.js <…>`
or the `npm run` aliases.)

[commander]: https://github.com/tj/commander.js

## Add an entry

```bash
npm run add          # = vla add
```

You'll be prompted for each field in order (press Enter to skip a field; the
date is filled in automatically). The answer is appended to `data/entries.json`
and committed.

Flags:

```bash
vla add --push        # also `git push` after committing
vla add --no-commit   # write JSON only, skip git
```

## Manage the questions (fields)

`config/fields.json` is the single source of truth — the CLI asks for these
fields and the site renders them. CRUD them without editing JSON by hand:

```bash
vla fields list                          # show all fields
vla fields add mood "Mood"               # append a field
vla fields add mood --after diet         # insert at a position
vla fields add note --type date          # set a type
vla fields edit mood --label "Mood/energy"
vla fields edit mood --key feeling       # rename key (migrates entry data)
vla fields remove mood                    # remove (keeps old answers)
vla fields remove mood --purge            # remove and delete its answers
```

Renaming a key updates that key across every entry in `data/entries.json` so
existing answers aren't orphaned.

## Open a note as Instagram cards

Click (or focus + Enter) any sticky note to open a fullscreen, square (1:1)
carousel: a cover card with the date, then one card per field. Each card gets a
random non-repeating pastel color, a few decorative shapes, and a random playful
font. Step through with the arrows/dots and screenshot each card to post.

## Export the Instagram cards to files

```bash
npm run export                  # today's entries -> export/<date>/NN-field.svg
vla export --all             # every entry
vla export --date 2026-06-24 # a specific day
vla export --out shots --no-png
vla export --reel            # also stitch each entry's cards into reel.mp4
vla export --reel --reel-seconds 3   # 3s per card
```

Each card is rendered to a 1080×1080 PNG via an intermediate SVG; the SVG is
deleted once its PNG is written, so a normal export leaves just PNGs. PNGs are
rendered in-process by [`@resvg/resvg-js`] (bundled — no system tools needed),
with command-line converters (`rsvg-convert`, ImageMagick, Inkscape) as a
fallback. Pass `--no-png` to keep the SVGs instead (e.g. to get the playful
fonts, which PNGs fall back from).

With `--reel`, each entry's cards are also stitched into a vertical 1080×1920
`reel.mp4` (H.264) you can post straight to Instagram Reels — rendered with
ffmpeg, bundled via [`ffmpeg-static`] (system `ffmpeg` used as a fallback). Each
card shows for `--reel-seconds` (default 2.5).

The `export/` folder is git-ignored.

[`ffmpeg-static`]: https://github.com/eugeneware/ffmpeg-static

> Note: the PNG renderer uses system fonts, so the playful Google fonts only
> appear in the SVG (export with `--no-png` and open it in a browser); PNGs fall
> back to a clean sans-serif. Everything else (tones, shapes, highlighted
> numbers) is identical.

[`@resvg/resvg-js`]: https://github.com/yisibl/resvg-js

## Run the site locally

The page fetches JSON, so use a local server (opening the file directly is
blocked by the browser):

```bash
npm run serve              # = vla serve --port 3611
# visit http://localhost:3611  (or: vla serve --port 8000)
```

## Deploy to GitHub Pages

1. `git init` (if not already a repo) and push to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, pick your branch and the
   `/ (root)` folder, save.
3. Live at `https://<user>.github.io/<repo>/`.

After that, the loop is: `npm run add` → `git push` → site updates.
