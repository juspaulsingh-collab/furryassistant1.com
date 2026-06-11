const ADSENSE_CLIENT = "ca-pub-9251992510412646";
const SCRIPT_ID = "adsense-script";

export function loadAdSense() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}

export function isAdSenseLoaded(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.getElementById(SCRIPT_ID));
}
