"use strict";

/* Renders one Instagram card as a self-contained SVG string: a tone-colored
 * square, decorative shapes, and centered text with highlighted numbers. */

const { rand, pick } = require("./util.js");
const { SIZE, INK, FONTS_QUERY, SHAPE_COLORS } = require("./palette.js");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- shapes (rendered as nested SVG in a 0..100 box) ---------- */

function starPoints(points, outer, inner) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function squirclePoints(n, r, steps) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    pts.push(
      `${(50 + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)).toFixed(1)},` +
      `${(50 + r * Math.sign(st) * Math.pow(Math.abs(st), 2 / n)).toFixed(1)}`
    );
  }
  return pts.join(" ");
}

function makeShapeSpec() {
  return {
    type: pick([
      "circle", "ring", "triangle", "square", "squircle", "blob",
      "star", "squiggle", "sparkle", "heart", "plus",
    ]),
    size: rand(28, 55),
    left: rand(-8, 92),
    top: rand(-8, 92),
    rotate: rand(0, 360),
    hex: pick(SHAPE_COLORS),
    alpha: Number(rand(0.18, 0.36).toFixed(3)),
    ringWidth: rand(8, 14),
    ry: rand(34, 46),
  };
}

function shapeInner(spec) {
  const c = spec.hex;
  const a = spec.alpha;
  const fill = `fill="${c}" fill-opacity="${a}"`;
  const round =
    `${fill} stroke="${c}" stroke-opacity="${a}" stroke-width="9" ` +
    `stroke-linejoin="round" stroke-linecap="round"`;
  switch (spec.type) {
    case "ring":
      return `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="${spec.ringWidth.toFixed(1)}"/>`;
    case "square":
      return `<rect x="2" y="2" width="96" height="96" rx="24" ${fill}/>`;
    case "blob":
      return `<ellipse cx="50" cy="50" rx="50" ry="${spec.ry.toFixed(1)}" ${fill}/>`;
    case "triangle":
      return `<polygon points="50,10 88,84 12,84" ${round}/>`;
    case "star":
      return `<polygon points="${starPoints(5, 44, 18)}" ${round}/>`;
    case "sparkle":
      return `<polygon points="${starPoints(4, 44, 13)}" ${round}/>`;
    case "squircle":
      return `<polygon points="${squirclePoints(4, 46, 64)}" ${round}/>`;
    case "plus":
      return `<path d="M40 10 H60 V40 H90 V60 H60 V90 H40 V60 H10 V40 H40 Z" ${round}/>`;
    case "heart":
      return `<path d="M50 84 C14 58 14 30 31 23 C42 18 50 27 50 33 C50 27 58 18 69 23 C86 30 86 58 50 84 Z" ${round}/>`;
    case "squiggle":
      return `<path d="M6 50 Q 21 22 33 50 T 60 50 T 94 50" fill="none" stroke="${c}" stroke-opacity="${a}" stroke-width="11" stroke-linecap="round"/>`;
    default:
      return `<circle cx="50" cy="50" r="50" ${fill}/>`;
  }
}

function shapeSVG(spec) {
  const s = (spec.size / 100) * SIZE;
  const x = (spec.left / 100) * SIZE;
  const y = (spec.top / 100) * SIZE;
  const cx = x + s / 2;
  const cy = y + s / 2;
  return (
    `<g transform="rotate(${spec.rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">` +
    `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" ` +
    `viewBox="0 0 100 100" overflow="visible">${shapeInner(spec)}</svg></g>`
  );
}

/* ---------- text ---------- */

function wrapLines(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= maxChars) line += " " + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/* A <text> line with numbers wrapped in colored tspans. */
function highlightedLine(line, y, fontSize, font, numColor) {
  const re = /\d+(?:[.,]\d+)*/g;
  let last = 0;
  let match;
  let spans = "";
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) spans += esc(line.slice(last, match.index));
    spans += `<tspan fill="${numColor}">${esc(match[0])}</tspan>`;
    last = re.lastIndex;
  }
  if (last < line.length) spans += esc(line.slice(last));
  return (
    `<text x="${SIZE / 2}" y="${y.toFixed(1)}" text-anchor="middle" ` +
    `font-family="${font}" font-size="${fontSize}" font-weight="700" fill="${INK}">${spans}</text>`
  );
}

function plainText(text, y, opts) {
  const attrs = [
    `x="${SIZE / 2}"`,
    `y="${y.toFixed(1)}"`,
    `text-anchor="middle"`,
    `font-family="${opts.font}"`,
    `font-size="${opts.size}"`,
    `font-weight="${opts.weight || 700}"`,
    `fill="${opts.fill || INK}"`,
    `fill-opacity="${opts.opacity == null ? 1 : opts.opacity}"`,
  ];
  if (opts.spacing) attrs.push(`letter-spacing="${opts.spacing}"`);
  return `<text ${attrs.join(" ")}>${esc(opts.upper ? text.toUpperCase() : text)}</text>`;
}

/* ---------- card ---------- */

function cardSVG(slide, tone, font) {
  const shapes = (slide.shapes || []).map(shapeSVG).join("");
  let body = "";

  if (slide.kind === "cover") {
    body =
      plainText("Daily Routine", 470, { font, size: 36, opacity: 0.55, spacing: 6, upper: true }) +
      plainText(slide.date, 600, { font, size: 112, weight: 700 });
  } else {
    // Shrink the value font until the wrapped text fits the band between the
    // label (~y 300) and the footer (~y 980), centered around y 610.
    const MAX_BLOCK = 540;
    let fontSize = 86;
    let lines;
    while (true) {
      const maxChars = Math.max(8, Math.floor(900 / (fontSize * 0.5)));
      lines = wrapLines(slide.value, maxChars);
      if (lines.length * fontSize * 1.16 <= MAX_BLOCK || fontSize <= 30) break;
      fontSize -= 6;
    }
    const lineHeight = fontSize * 1.16;
    const startY = 610 - ((lines.length - 1) * lineHeight) / 2;
    const value = lines
      .map((ln, i) => highlightedLine(ln, startY + i * lineHeight, fontSize, font, tone.num))
      .join("");
    body =
      plainText(slide.label, 300, { font, size: 40, opacity: 0.55, spacing: 6, upper: true }) +
      value +
      (slide.date ? plainText(slide.date, 980, { font, size: 32, opacity: 0.5 }) : "");
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<defs><style><![CDATA[@import url('https://fonts.googleapis.com/css2?${FONTS_QUERY}');]]></style>` +
    `<clipPath id="cp"><rect width="${SIZE}" height="${SIZE}"/></clipPath></defs>` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${tone.bg}"/>` +
    `<g clip-path="url(#cp)">${shapes}</g>` +
    body +
    `</svg>`
  );
}

module.exports = { makeShapeSpec, cardSVG };
