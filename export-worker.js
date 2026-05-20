// Web Worker: fetch the deployed deck + all its referenced assets, inline them
// as data: URIs (skipping mp4), and post back a single self-contained HTML
// string for the main thread to download.

self.onmessage = async (e) => {
  const { baseUrl } = e.data;
  try {
    const html = await buildStandalone(baseUrl);
    self.postMessage({ html });
  } catch (err) {
    self.postMessage({ error: String(err.message || err) });
  }
};

function progress(p) { self.postMessage({ progress: p }); }

async function buildStandalone(baseUrl) {
  progress("fetching index.html");
  const indexRes = await fetch(baseUrl + "/index.html?_t=" + Date.now(), { cache: "no-store" });
  let html = await indexRes.text();

  // 1. Inline <link rel="stylesheet" href="X.css"> (same-origin only)
  progress("inlining stylesheets");
  html = await replaceAsync(html, /<link[^>]+rel=["']stylesheet["'][^>]*>/g, async (tag) => {
    const m = tag.match(/href=["']([^"']+)["']/);
    if (!m) return tag;
    const href = m[1];
    if (/^https?:/i.test(href)) return tag;     // leave CDN links
    const css = await fetchText(new URL(href, baseUrl + "/").toString());
    const inlined = await inlineCssUrls(css, new URL(href, baseUrl + "/").toString());
    return `<style data-from="${href}">\n${inlined}\n</style>`;
  });

  // 2. Inline <script src="X.js"> (same-origin only)
  progress("inlining scripts");
  html = await replaceAsync(html, /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/g,
    async (tag, pre, src, post) => {
      if (/^https?:/i.test(src)) return tag;
      const js = await fetchText(new URL(src, baseUrl + "/").toString());
      const attrs = (pre + " " + post).replace(/\s+/g, " ").trim();
      return `<script ${attrs} data-from="${src}">\n${js}\n</script>`;
    });

  // 3. Inline <img src="..."> → data: URI (skip mp4-as-img, n/a)
  progress("inlining images");
  html = await replaceAsync(html, /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g, async (tag, src) => {
    if (src.startsWith("data:")) return tag;
    if (/^https?:/i.test(src)) return tag;
    try {
      const dataUrl = await fetchAsDataUrl(new URL(src, baseUrl + "/").toString());
      return tag.replace(src, dataUrl);
    } catch (e) {
      return tag; // leave as-is if fetch fails
    }
  });

  // 4. <video src="X.mp4"> — do NOT inline (too large). Rewrite to absolute URL
  //    so the standalone file still works while online.
  progress("rewriting videos to absolute URLs");
  html = html.replace(/<video\b([^>]*)\bsrc=["']([^"']+)["']/g, (tag, attrs, src) => {
    if (src.startsWith("data:")) return tag;
    if (/^https?:/i.test(src)) return tag;
    const abs = new URL(src, baseUrl + "/").toString();
    return tag.replace(src, abs);
  });

  // 5. Inline .image-slots.state.json (the runtime fetches it). Read it and
  //    pre-populate via the existing <script id="image-slots-state-data">
  //    pattern if present, otherwise inject a <script> that shims fetch.
  progress("inlining image-slots state");
  try {
    const stateText = await fetchText(baseUrl + "/.image-slots.state.json?_t=" + Date.now());
    const shim = `<script id="image-slots-state-data" type="application/json">${stateText}</script>
<script>
(function(){
  var data = document.getElementById("image-slots-state-data");
  if (!data) return;
  var STATE = JSON.parse(data.textContent);
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.endsWith(".image-slots.state.json")) {
      return Promise.resolve(new Response(JSON.stringify(STATE), {
        status: 200, headers: { "Content-Type": "application/json" }
      }));
    }
    return origFetch.apply(this, arguments);
  };
})();
</script>`;
    html = html.replace(/<\/head>/i, shim + "\n</head>");
  } catch {
    // state file missing — OK
  }

  return html;
}

// CSS @font-face url(...) inlining (recursive into stylesheet).
async function inlineCssUrls(css, cssAbsUrl) {
  return replaceAsync(css, /url\(\s*(['"]?)([^'")]+)\1\s*\)/g, async (full, q, url) => {
    if (url.startsWith("data:")) return full;
    if (/^https?:/i.test(url)) return full;
    try {
      const abs = new URL(url, cssAbsUrl).toString();
      const dataUrl = await fetchAsDataUrl(abs);
      return `url(${dataUrl})`;
    } catch {
      return full;
    }
  });
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return res.text();
}

async function fetchAsDataUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const blob = await res.blob();
  const buf = await blob.arrayBuffer();
  const mime = blob.type || guessMime(url);
  return `data:${mime};base64,${arrayBufferToBase64(buf)}`;
}

function guessMime(url) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  return {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
    woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
    ttc: "font/collection", otf: "font/otf",
    mp4: "video/mp4", webm: "video/webm",
    json: "application/json",
  }[ext] || "application/octet-stream";
}

function arrayBufferToBase64(buf) {
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function replaceAsync(str, regex, asyncReplacer) {
  const promises = [];
  str.replace(regex, (...args) => { promises.push(asyncReplacer(...args)); return ""; });
  const data = await Promise.all(promises);
  let i = 0;
  return str.replace(regex, () => data[i++]);
}
