"use strict";

/* Resolves an SVG -> PNG converter. Prefers the bundled in-process
 * @resvg/resvg-js (no system tools needed), then falls back to any installed
 * command-line converter. */

const fs = require("fs");
const { execFileSync } = require("child_process");
const { SIZE } = require("./palette.js");

/* Returns { name, render(svg, svgPath, pngPath) } or null if none is available. */
function getConverter() {
  try {
    const { Resvg } = require("@resvg/resvg-js");
    return {
      name: "@resvg/resvg-js",
      render(svg, _svgPath, pngPath) {
        const resvg = new Resvg(svg, {
          fitTo: { mode: "width", value: SIZE },
          font: { loadSystemFonts: true, defaultFontFamily: "sans-serif" },
        });
        fs.writeFileSync(pngPath, resvg.render().asPng());
      },
    };
  } catch {
    /* package missing or platform unsupported — try system tools */
  }

  const candidates = [
    { cmd: "rsvg-convert", args: (i, o) => ["-w", String(SIZE), "-h", String(SIZE), i, "-o", o] },
    { cmd: "magick", args: (i, o) => ["-background", "none", "-density", "192", i, "-resize", `${SIZE}x${SIZE}`, o] },
    { cmd: "convert", args: (i, o) => ["-background", "none", "-density", "192", i, "-resize", `${SIZE}x${SIZE}`, o] },
    { cmd: "inkscape", args: (i, o) => [i, "--export-type=png", `--export-filename=${o}`, "-w", String(SIZE), "-h", String(SIZE)] },
  ];
  for (const c of candidates) {
    try {
      execFileSync(c.cmd, ["--version"], { stdio: "ignore" });
      return {
        name: c.cmd,
        render(_svg, svgPath, pngPath) {
          execFileSync(c.cmd, c.args(svgPath, pngPath), { stdio: "ignore" });
        },
      };
    } catch {
      /* not installed, try next */
    }
  }
  return null;
}

module.exports = { getConverter };
