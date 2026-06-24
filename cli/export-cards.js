"use strict";

/*
 * Export the Instagram cards as image files. Invoked via `vla export`.
 *
 * Reads config/fields.json and data/entries.json, turns each entry into a
 * cover card plus one card per field, and writes each as a self-contained
 * 1080x1080 SVG (and a PNG when a converter is available). Rendering lives in
 * lib/card-svg.js; palette/tones in lib/palette.js; conversion in lib/png.js.
 */

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  FIELDS_PATH,
  ENTRIES_PATH,
  rand,
  pick,
  safeName,
  readJSON,
  dateFieldKey,
} = require("./lib/util.js");
const { TONES, PLAYFUL_FONTS, assignTones } = require("./lib/palette.js");
const { makeShapeSpec, cardSVG } = require("./lib/card-svg.js");
const { getConverter } = require("./lib/png.js");

function buildSlides(entry, fields, dateKey) {
  const dateValue = dateKey ? String(entry[dateKey] || "") : "";
  const list = [];
  if (dateValue) list.push({ kind: "cover", key: "cover", date: dateValue });

  fields.forEach((field) => {
    if (field.key === dateKey) return;
    const value = entry[field.key];
    if (value === undefined || value === null || String(value).trim() === "") return;
    list.push({
      kind: "field",
      key: field.key,
      label: field.label || field.key,
      value: String(value),
      date: dateValue,
    });
  });

  // Each card gets its own random shapes and a random playful font.
  list.forEach((slide) => {
    const count = Math.round(rand(2, 3));
    slide.shapes = Array.from({ length: count }, makeShapeSpec);
    slide.font = pick(PLAYFUL_FONTS);
  });
  return list;
}

/* opts: { date: string|null (null = all entries), out: string, png: boolean } */
function exportCards(opts = {}) {
  const { date = null, out = "export", png = true } = opts;
  const config = readJSON(FIELDS_PATH);
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const entries = readJSON(ENTRIES_PATH, []);
  const dateKey = dateFieldKey(fields);

  let selected = entries;
  if (date) {
    selected = entries.filter((e) => dateKey && String(e[dateKey]) === date);
    if (!selected.length) {
      console.error(
        `No entry found for date ${date}. ` +
          `Use --date <YYYY-MM-DD> or --all to export everything.`
      );
      process.exit(1);
    }
  }
  if (!selected.length) {
    console.error("No entries to export.");
    process.exit(1);
  }

  const converter = png ? getConverter() : null;
  const outRoot = path.join(ROOT, out);
  const usedFolders = new Set();
  let svgCount = 0;
  let pngCount = 0;

  selected.forEach((entry, entryIdx) => {
    const slides = buildSlides(entry, fields, dateKey);
    if (!slides.length) return;
    const tones = assignTones(slides.length);

    // Unique folder per entry — same-date entries get -2, -3, … suffixes.
    const baseName = dateKey && entry[dateKey] ? safeName(entry[dateKey]) : `entry-${entryIdx + 1}`;
    let folderName = baseName;
    for (let n = 2; usedFolders.has(folderName); n++) folderName = `${baseName}-${n}`;
    usedFolders.add(folderName);

    const dir = path.join(outRoot, folderName);
    fs.mkdirSync(dir, { recursive: true });

    slides.forEach((slide, i) => {
      const tone = TONES[tones[i]];
      const base = `${String(i + 1).padStart(2, "0")}-${safeName(slide.key)}`;
      const svgPath = path.join(dir, base + ".svg");
      const svg = cardSVG(slide, tone, slide.font);
      fs.writeFileSync(svgPath, svg);
      svgCount++;

      if (converter) {
        const pngPath = path.join(dir, base + ".png");
        try {
          converter.render(svg, svgPath, pngPath);
          pngCount++;
        } catch (err) {
          console.error(`  PNG failed for ${base}: ${err.message}`);
        }
      }
    });

    console.log(`${folderName}: ${slides.length} cards`);
  });

  console.log(`\nWrote ${svgCount} SVG${svgCount === 1 ? "" : "s"} to ${path.relative(ROOT, outRoot)}/`);
  if (converter) {
    console.log(`Rasterized ${pngCount} PNG${pngCount === 1 ? "" : "s"} with ${converter.name}.`);
  } else if (png) {
    console.log(
      "No SVG->PNG converter available. Run `npm install` to get @resvg/resvg-js,\n" +
        "or open an SVG in a browser and export it."
    );
  }
}

module.exports = { exportCards };

if (require.main === module) exportCards({ date: null });
