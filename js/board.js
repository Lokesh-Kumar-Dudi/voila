/* The sticky-note grid: renders each entry as a note and opens the Instagram
 * carousel when a note is clicked. */

import { appendHighlighted } from "./highlight.js";
import { openModal } from "./modal.js";

const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");

export function setStatus(message, isError) {
  if (!message) {
    statusEl.classList.add("hidden");
    return;
  }
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
  statusEl.classList.toggle("error", Boolean(isError));
}

export function dateFieldKey(fields) {
  const byType = fields.find((f) => f.type === "date");
  if (byType) return byType.key;
  const byName = fields.find((f) => f.key.toLowerCase() === "date");
  return byName ? byName.key : null;
}

function buildNote(entry, fields, dateKey) {
  const note = document.createElement("article");
  note.className = "note";
  note.tabIndex = 0;
  note.setAttribute("role", "button");
  note.setAttribute("aria-label", "Open as Instagram post");
  note.addEventListener("click", () => openModal(entry, fields, dateKey));
  note.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(entry, fields, dateKey);
    }
  });

  if (dateKey && entry[dateKey]) {
    const dateEl = document.createElement("span");
    dateEl.className = "date";
    dateEl.textContent = String(entry[dateKey]);
    note.appendChild(dateEl);
  }

  fields.forEach((field) => {
    if (field.key === dateKey) return; // shown above
    const value = entry[field.key];
    if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }

    const row = document.createElement("div");
    row.className = "field";

    const val = document.createElement("span");
    val.className = "value";
    appendHighlighted(val, String(value));

    row.appendChild(val);
    note.appendChild(row);
  });

  return note;
}

export function render(fields, entries, dateKey) {
  if (!entries.length) {
    setStatus("No entries yet — run `npm run add` to create one.", false);
    return;
  }

  const sorted = [...entries];
  if (dateKey) {
    sorted.sort((a, b) =>
      String(b[dateKey] || "").localeCompare(String(a[dateKey] || ""))
    );
  }

  boardEl.innerHTML = "";
  sorted.forEach((entry) => {
    boardEl.appendChild(buildNote(entry, fields, dateKey));
  });
  setStatus(null);
}
