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
const { buildReel } = require("./lib/reel.js");

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

/* opts: { date, out, png, reel, reelSeconds }
 *   date: string|null (null = all entries); reel: stitch cards into an MP4. */
function exportCards(opts = {}) {
  const { date = null, out = "export", png = true, reel = false, reelSeconds = 2.5 } = opts;
  // A reel is built from the PNG cards, so it requires PNG generation.
  const wantPng = png || reel;
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

  const converter = wantPng ? getConverter() : null;
  const outRoot = path.join(ROOT, out);
  const usedFolders = new Set();
  let svgKeptCount = 0;
  let pngCount = 0;
  let reelCount = 0;

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

    const entryPngs = [];
    slides.forEach((slide, i) => {
      const tone = TONES[tones[i]];
      const base = `${String(i + 1).padStart(2, "0")}-${safeName(slide.key)}`;
      const svgPath = path.join(dir, base + ".svg");
      const svg = cardSVG(slide, tone, slide.font);
      fs.writeFileSync(svgPath, svg);

      let pngOk = false;
      if (converter) {
        const pngPath = path.join(dir, base + ".png");
        try {
          converter.render(svg, svgPath, pngPath);
          entryPngs.push(pngPath);
          pngCount++;
          pngOk = true;
        } catch (err) {
          console.error(`  PNG failed for ${base}: ${err.message}`);
        }
      }

      // The SVG is only an intermediate step — drop it once the PNG exists,
      // but keep it as the sole output when no PNG was produced.
      if (pngOk) fs.unlinkSync(svgPath);
      else svgKeptCount++;
    });

    let reelNote = "";
    if (reel && entryPngs.length) {
      const reelPath = path.join(dir, "reel.mp4");
      if (buildReel(entryPngs, reelPath, { seconds: reelSeconds })) {
        reelCount++;
        reelNote = " + reel.mp4";
      } else {
        reelNote = " (reel skipped — ffmpeg unavailable)";
      }
    }

    console.log(`${folderName}: ${slides.length} cards${reelNote}`);
  });

  const rel = path.relative(ROOT, outRoot);
  if (pngCount) {
    console.log(`\nWrote ${pngCount} PNG${pngCount === 1 ? "" : "s"} to ${rel}/ with ${converter.name}.`);
  }
  if (svgKeptCount) {
    if (!pngCount) console.log("");
    if (wantPng && !converter) {
      console.log(
        `Kept ${svgKeptCount} SVG${svgKeptCount === 1 ? "" : "s"} in ${rel}/ — no SVG->PNG ` +
          "converter available.\nRun `npm install` for @resvg/resvg-js, or open an SVG in a browser."
      );
    } else {
      console.log(`Wrote ${svgKeptCount} SVG${svgKeptCount === 1 ? "" : "s"} to ${rel}/.`);
    }
  }
  if (reel) {
    console.log(`Stitched ${reelCount} reel${reelCount === 1 ? "" : "s"} (1080x1920 MP4).`);
  }
}

module.exports = { exportCards };

if (require.main === module) exportCards({ date: null });
