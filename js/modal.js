/* The fullscreen Instagram-post carousel: turns one entry into a cover card
 * plus one card per field, with random non-repeating tones and decorative
 * shapes. Navigated with arrows, dots, and the keyboard. */

import { rand, pick } from "./random.js";
import { appendHighlighted } from "./highlight.js";
import { makeShapeSpec, shapeToEl } from "./shapes.js";
import { assignTones } from "./tones.js";
import { PLAYFUL_FONTS } from "./fonts.js";

const modalEl = document.getElementById("modal");
const postCardEl = document.getElementById("postCard");
const dotsEl = document.getElementById("dots");

let slides = [];
let slideIndex = 0;
let slideTones = [];

function buildSlides(entry, fields, dateKey) {
  const dateValue = dateKey ? String(entry[dateKey] || "") : "";
  const list = [];

  if (dateValue) {
    list.push({ kind: "cover", date: dateValue });
  }

  fields.forEach((field) => {
    if (field.key === dateKey) return;
    const value = entry[field.key];
    if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }
    list.push({
      kind: "field",
      label: field.label || field.key,
      value: String(value),
      date: dateValue,
    });
  });

  // Give each card its own random shapes and a random playful font.
  list.forEach((slide) => {
    const count = Math.round(rand(2, 3));
    slide.shapes = Array.from({ length: count }, makeShapeSpec);
    slide.font = pick(PLAYFUL_FONTS);
  });

  return list;
}

function renderSlide() {
  const slide = slides[slideIndex];
  if (!slide) return;

  postCardEl.className = "post-card tone-" + slideTones[slideIndex];
  postCardEl.style.fontFamily = slide.font || "";
  postCardEl.innerHTML = "";

  const shapesLayer = document.createElement("div");
  shapesLayer.className = "post-shapes";
  (slide.shapes || []).forEach((spec) => shapesLayer.appendChild(shapeToEl(spec)));
  postCardEl.appendChild(shapesLayer);

  const content = document.createElement("div");
  content.className = "post-content";

  if (slide.kind === "cover") {
    const kicker = document.createElement("div");
    kicker.className = "post-kicker";
    kicker.textContent = "Daily Routine";

    const date = document.createElement("div");
    date.className = "post-date-big";
    date.textContent = slide.date;

    content.append(kicker, date);
  } else {
    const label = document.createElement("div");
    label.className = "post-label";
    label.textContent = slide.label;

    const value = document.createElement("div");
    value.className = "post-value";
    appendHighlighted(value, slide.value);

    content.append(label, value);
  }

  postCardEl.appendChild(content);

  if (slide.kind === "field" && slide.date) {
    const foot = document.createElement("div");
    foot.className = "post-foot";
    foot.textContent = slide.date;
    postCardEl.appendChild(foot);
  }

  Array.from(dotsEl.children).forEach((dot, i) => {
    dot.classList.toggle("active", i === slideIndex);
  });
}

function renderDots() {
  dotsEl.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Card ${i + 1}`);
    dot.addEventListener("click", () => {
      slideIndex = i;
      renderSlide();
    });
    dotsEl.appendChild(dot);
  });
}

function step(delta) {
  if (!slides.length) return;
  slideIndex = (slideIndex + delta + slides.length) % slides.length;
  renderSlide();
}

export function openModal(entry, fields, dateKey) {
  slides = buildSlides(entry, fields, dateKey);
  if (!slides.length) return;
  slideTones = assignTones(slides.length);
  slideIndex = 0;
  renderDots();
  renderSlide();
  modalEl.classList.remove("hidden");
}

function closeModal() {
  modalEl.classList.add("hidden");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("navPrev").addEventListener("click", () => step(-1));
document.getElementById("navNext").addEventListener("click", () => step(1));
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (modalEl.classList.contains("hidden")) return;
  if (e.key === "Escape") closeModal();
  else if (e.key === "ArrowLeft") step(-1);
  else if (e.key === "ArrowRight") step(1);
});
