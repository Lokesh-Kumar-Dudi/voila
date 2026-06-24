/* Appends text to an element, wrapping numbers (e.g. 73, 5k, 72.4) in a
 * highlight span. Builds DOM nodes directly so values stay safe. */
export function appendHighlighted(el, text) {
  const re = /\d+(?:[.,]\d+)*/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      el.appendChild(document.createTextNode(text.slice(last, match.index)));
    }
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = match[0];
    el.appendChild(num);
    last = re.lastIndex;
  }
  if (last < text.length) {
    el.appendChild(document.createTextNode(text.slice(last)));
  }
}
