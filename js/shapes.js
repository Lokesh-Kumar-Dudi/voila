/* Decorative random shapes drawn behind the text on each Instagram card.
 * A shape is described by a plain spec object so a card's shapes stay stable
 * while navigating, then turned into a DOM element by shapeToEl(). */

import { rand, pick, hexToRgba } from "./random.js";

const SHAPE_COLORS = [
  "#ff6b6b", "#ffd93d", "#5ad67d", "#4d96ff",
  "#9b5de5", "#f15bb5", "#00bbf9", "#fca311",
];

const SHAPE_TYPES = [
  "circle", "ring", "triangle", "square", "squircle", "blob",
  "star", "squiggle", "sparkle", "heart", "plus",
];

/* Builds an n-point star's polygon points within a 0..100 viewBox. */
function starPoints(points, outer, inner) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/* Superellipse (squircle) outline within a 0..100 viewBox. */
function squirclePoints(n, r, steps) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = 50 + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = 50 + r * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

/* Wraps inner SVG markup in a square, responsive <svg>. */
function svgShape(inner) {
  return (
    `<svg viewBox="0 0 100 100" width="100%" height="100%" ` +
    `preserveAspectRatio="xMidYMid meet" style="overflow:visible">${inner}</svg>`
  );
}

/* Rounded stroke shared by all filled shapes so no corner is sharp. */
function roundFill(color) {
  return (
    `fill="${color}" stroke="${color}" stroke-width="9" ` +
    `stroke-linejoin="round" stroke-linecap="round"`
  );
}

const SVG_SHAPES = {
  triangle: (c) => `<polygon points="50,10 88,84 12,84" ${roundFill(c)}/>`,
  star: (c) => `<polygon points="${starPoints(5, 44, 18)}" ${roundFill(c)}/>`,
  sparkle: (c) => `<polygon points="${starPoints(4, 44, 13)}" ${roundFill(c)}/>`,
  squircle: (c) => `<polygon points="${squirclePoints(4, 46, 64)}" ${roundFill(c)}/>`,
  plus: (c) =>
    `<path d="M40 10 H60 V40 H90 V60 H60 V90 H40 V60 H10 V40 H40 Z" ${roundFill(c)}/>`,
  heart: (c) =>
    `<path d="M50 84 C14 58 14 30 31 23 C42 18 50 27 50 33 C50 27 58 18 69 23 ` +
    `C86 30 86 58 50 84 Z" ${roundFill(c)}/>`,
  squiggle: (c) =>
    `<path d="M6 50 Q 21 22 33 50 T 60 50 T 94 50" fill="none" ` +
    `stroke="${c}" stroke-width="11" stroke-linecap="round"/>`,
};

export function makeShapeSpec() {
  return {
    type: pick(SHAPE_TYPES),
    size: rand(28, 55), // % of card
    left: rand(-8, 92),
    top: rand(-8, 92),
    rotate: rand(0, 360),
    color: hexToRgba(pick(SHAPE_COLORS), rand(0.18, 0.36)),
    ringWidth: rand(6, 16),
    radii: Array.from({ length: 8 }, () => rand(40, 60)),
  };
}

export function shapeToEl(spec) {
  const el = document.createElement("div");
  el.className = "shape";
  el.style.width = spec.size + "%";
  el.style.height = spec.size + "%";
  el.style.left = spec.left + "%";
  el.style.top = spec.top + "%";
  el.style.transform = `rotate(${spec.rotate}deg)`;

  if (SVG_SHAPES[spec.type]) {
    el.innerHTML = svgShape(SVG_SHAPES[spec.type](spec.color));
    return el;
  }

  switch (spec.type) {
    case "ring":
      el.style.border = `${spec.ringWidth}px solid ${spec.color}`;
      el.style.borderRadius = "50%";
      break;
    case "square":
      el.style.background = spec.color;
      el.style.borderRadius = "24%";
      break;
    case "blob": {
      const r = spec.radii;
      el.style.background = spec.color;
      el.style.borderRadius =
        `${r[0]}% ${r[1]}% ${r[2]}% ${r[3]}% / ${r[4]}% ${r[5]}% ${r[6]}% ${r[7]}%`;
      break;
    }
    default: // circle
      el.style.background = spec.color;
      el.style.borderRadius = "50%";
  }
  return el;
}
