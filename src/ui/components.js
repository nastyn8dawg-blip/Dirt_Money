export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attrs(map = {}) {
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
    .join(" ");
}

function dataAttributeName(key) {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function button(action, label, options = {}) {
  const data = {
    "data-action": action,
    class: `dm-button ${options.variant ?? ""}`.trim(),
    disabled: options.disabled
  };
  for (const [key, value] of Object.entries(options.data ?? {})) {
    data[`data-${dataAttributeName(key)}`] = value;
  }
  return `<button ${attrs(data)}>${escapeHtml(label)}</button>`;
}

export function icon(name) {
  return `<img class="stat-icon" src="./assets/placeholders/icons/${name}.svg" alt="" aria-hidden="true" />`;
}

export function meter(value, label = "") {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return `<span class="meter" aria-label="${escapeHtml(label)} ${safe}%"><span style="width:${safe}%"></span></span>`;
}
