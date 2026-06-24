"use strict";

/* Visual constants for the exported cards, mirroring the web design, plus the
 * non-repeating tone picker. */

const { shuffle } = require("./util.js");

const SIZE = 1080; // exported card is SIZE x SIZE px
const INK = "#2b2b2b"; // default text color

const FONTS_QUERY =
  "family=Architects+Daughter&family=Caveat:wght@700&family=Gochi+Hand" +
  "&family=Indie+Flower&family=Pacifico&family=Patrick+Hand" +
  "&family=Permanent+Marker&family=Shadows+Into+Light&display=swap";

const PLAYFUL_FONTS = [
  "'Caveat', cursive",
  "'Patrick Hand', cursive",
  "'Shadows Into Light', cursive",
  "'Gochi Hand', cursive",
  "'Permanent Marker', cursive",
  "'Pacifico', cursive",
  "'Indie Flower', cursive",
  "'Architects Daughter', cursive",
];

// Mirrors the .post-card.tone-N rules in styles.css (background + number color).
const TONES = [
  { bg: "#fdf6b2", num: "#5a4200" },
  { bg: "#c8f0dd", num: "#064a35" },
  { bg: "#ffe0c2", num: "#7a3700" },
  { bg: "#d6dcff", num: "#232c8a" },
  { bg: "#ffd1dc", num: "#8a1740" },
  { bg: "#d8d2f0", num: "#3d2178" },
  { bg: "#ffd0c2", num: "#8a2f12" },
  { bg: "#c2f0ef", num: "#045b59" },
  { bg: "#e2f0b2", num: "#4f5e00" },
  { bg: "#c2e0ff", num: "#0f4a86" },
  { bg: "#ffc9de", num: "#8a1f4a" },
  { bg: "#e3c2f0", num: "#5e1f7a" },
];

const SHAPE_COLORS = [
  "#ff6b6b", "#ffd93d", "#5ad67d", "#4d96ff",
  "#9b5de5", "#f15bb5", "#00bbf9", "#fca311",
];

/* A tone index (0..TONES.length-1) per card with no color repeated; reshuffles
 * and only avoids adjacent repeats when there are more cards than tones. */
function assignTones(count) {
  const tones = [];
  let pool = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      pool = shuffle(Array.from({ length: TONES.length }, (_, n) => n));
      if (tones.length && pool[0] === tones[tones.length - 1]) pool.push(pool.shift());
    }
    tones.push(pool.shift());
  }
  return tones;
}

module.exports = { SIZE, INK, FONTS_QUERY, PLAYFUL_FONTS, TONES, SHAPE_COLORS, assignTones };
