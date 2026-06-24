"use strict";

/*
 * CRUD for the question fields in config/fields.json. Invoked via
 * `vla fields <list|add|remove|edit>`.
 *
 * config/fields.json is the single source of truth: the CLI prompts for these
 * fields and the site renders them. Renaming a key also migrates that key in
 * data/entries.json so existing answers aren't orphaned.
 */

const { FIELDS_PATH, ENTRIES_PATH, readJSON, writeJSON } = require("./lib/util.js");

function loadConfig() {
  const config = readJSON(FIELDS_PATH, { fields: [] });
  if (!Array.isArray(config.fields)) config.fields = [];
  return config;
}

function indexOf(fields, key) {
  return fields.findIndex((f) => f.key === key);
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function listFields() {
  const { fields } = loadConfig();
  if (!fields.length) {
    console.log("No fields defined. Add one with: vla fields add <key>");
    return;
  }
  fields.forEach((f, i) => {
    const type = f.type ? `  (type: ${f.type})` : "";
    console.log(`${String(i + 1).padStart(2)}. ${f.key}  —  "${f.label || f.key}"${type}`);
  });
}

function addField({ key, label, type, before, after } = {}) {
  if (!key || !key.trim()) throw new Error("A field key is required.");
  key = key.trim();

  const config = loadConfig();
  if (indexOf(config.fields, key) !== -1) {
    throw new Error(`Field "${key}" already exists.`);
  }

  const field = { key, label: label || titleCase(key) };
  if (type) field.type = type;
  if (type === "date" && config.fields.some((f) => f.type === "date")) {
    console.warn("Warning: a date field already exists; only the first is used as the note date.");
  }

  let idx = config.fields.length;
  if (before) {
    const b = indexOf(config.fields, before);
    if (b === -1) throw new Error(`--before field "${before}" not found.`);
    idx = b;
  } else if (after) {
    const a = indexOf(config.fields, after);
    if (a === -1) throw new Error(`--after field "${after}" not found.`);
    idx = a + 1;
  }

  config.fields.splice(idx, 0, field);
  writeJSON(FIELDS_PATH, config);
  console.log(`Added field "${key}" ("${field.label}")${type ? ` of type ${type}` : ""}.`);
}

function removeField(key, { purge = false } = {}) {
  const config = loadConfig();
  const idx = indexOf(config.fields, key);
  if (idx === -1) throw new Error(`Field "${key}" not found.`);

  config.fields.splice(idx, 1);
  writeJSON(FIELDS_PATH, config);
  console.log(`Removed field "${key}" from config.`);

  if (purge) {
    const entries = readJSON(ENTRIES_PATH, []);
    let n = 0;
    entries.forEach((e) => {
      if (key in e) {
        delete e[key];
        n++;
      }
    });
    writeJSON(ENTRIES_PATH, entries);
    console.log(`Purged "${key}" from ${n} entr${n === 1 ? "y" : "ies"}.`);
  } else {
    console.log(`Existing answers for "${key}" are kept (just no longer shown). Use --purge to delete them.`);
  }
}

function editField(key, { newKey, label, type, clearType } = {}) {
  const config = loadConfig();
  const idx = indexOf(config.fields, key);
  if (idx === -1) throw new Error(`Field "${key}" not found.`);
  const field = config.fields[idx];

  if (label != null) field.label = label;
  if (clearType) delete field.type;
  else if (type != null) field.type = type;

  if (newKey && newKey.trim() && newKey.trim() !== key) {
    const nk = newKey.trim();
    if (indexOf(config.fields, nk) !== -1) throw new Error(`Field "${nk}" already exists.`);
    field.key = nk;

    // Migrate the key in existing entries so answers aren't orphaned.
    const entries = readJSON(ENTRIES_PATH, []);
    let n = 0;
    entries.forEach((e) => {
      if (key in e) {
        e[nk] = e[key];
        delete e[key];
        n++;
      }
    });
    writeJSON(ENTRIES_PATH, entries);
    console.log(`Renamed key "${key}" -> "${nk}" (updated ${n} entr${n === 1 ? "y" : "ies"}).`);
  }

  writeJSON(FIELDS_PATH, config);
  console.log(`Updated field "${field.key}".`);
}

module.exports = { listFields, addField, removeField, editField };
