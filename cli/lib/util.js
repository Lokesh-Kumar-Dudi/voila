"use strict";

/* Shared helpers for the CLI: project paths, JSON IO, small randomness and
 * date utilities. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const FIELDS_PATH = path.join(ROOT, "config", "fields.json");
const ENTRIES_PATH = path.join(ROOT, "data", "entries.json");

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function safeName(s) {
  return String(s).replace(/[^a-z0-9-_]+/gi, "-");
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT" && fallback !== undefined) return fallback;
    throw new Error(`Could not read ${path.relative(ROOT, file)}: ${err.message}`);
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

/* The key of the field that holds the entry date (type "date", else "date"). */
function dateFieldKey(fields) {
  const byType = fields.find((f) => f.type === "date");
  if (byType) return byType.key;
  const byName = fields.find((f) => f.key.toLowerCase() === "date");
  return byName ? byName.key : null;
}

module.exports = {
  ROOT,
  FIELDS_PATH,
  ENTRIES_PATH,
  rand,
  pick,
  shuffle,
  today,
  safeName,
  readJSON,
  writeJSON,
  dateFieldKey,
};
