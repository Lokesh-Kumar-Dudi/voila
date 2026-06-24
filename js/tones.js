/* Pastel tone selection for the Instagram cards. Tone N maps to the
 * `.post-card.tone-N` CSS rule (background + matching number color). */

import { shuffle } from "./random.js";

export const TONE_COUNT = 12;

/* A random tone (1..TONE_COUNT) per slide with no color repeated. When there
 * are more slides than tones, reshuffle and only avoid repeating adjacently. */
export function assignTones(count) {
  const tones = [];
  let pool = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      pool = shuffle(Array.from({ length: TONE_COUNT }, (_, n) => n + 1));
      if (tones.length && pool[0] === tones[tones.length - 1]) {
        pool.push(pool.shift());
      }
    }
    tones.push(pool.shift());
  }
  return tones;
}
