// Sends a custom event to Umami. Does nothing if the script is blocked or not configured.
export function track(name, data) {
  try { window.umami?.track(name, data); } catch {}
}
