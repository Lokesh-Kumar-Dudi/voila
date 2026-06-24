"use strict";

/* Stitches a sequence of PNG cards into a vertical (1080x1920) MP4 reel using
 * ffmpeg. Prefers the bundled ffmpeg-static binary, then a system `ffmpeg`. */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const CARD = 1080; // square card size
const REEL_W = 1080;
const REEL_H = 1920; // 9:16
const BG = "0xf4f1ea"; // page background color behind the centered card

function findFfmpeg() {
  try {
    const bundled = require("ffmpeg-static");
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    /* package missing — try system ffmpeg */
  }
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    return null;
  }
}

/* Builds a reel from pngPaths (in order) at outPath. Returns true on success. */
function buildReel(pngPaths, outPath, { seconds = 2.5 } = {}) {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg || !pngPaths.length) return false;

  // concat demuxer playlist; the last frame is repeated so its duration counts.
  const q = (p) => `'${p.replace(/'/g, "'\\''")}'`;
  const lines = [];
  for (const p of pngPaths) {
    lines.push(`file ${q(p)}`);
    lines.push(`duration ${seconds}`);
  }
  lines.push(`file ${q(pngPaths[pngPaths.length - 1])}`);

  const listPath = path.join(os.tmpdir(), `vla-reel-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(listPath, lines.join("\n") + "\n");

  try {
    execFileSync(
      ffmpeg,
      [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listPath,
        "-vf",
        `scale=${CARD}:${CARD},pad=${REEL_W}:${REEL_H}:0:${(REEL_H - CARD) / 2}:color=${BG},format=yuv420p`,
        "-r", "30",
        "-c:v", "libx264",
        "-movflags", "+faststart",
        outPath,
      ],
      { stdio: "ignore" }
    );
    return true;
  } finally {
    try {
      fs.unlinkSync(listPath);
    } catch {
      /* ignore cleanup failure */
    }
  }
}

module.exports = { buildReel, findFfmpeg };
