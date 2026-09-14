// Audit met title a description v hotovém buildu _site.
// Spouštět po buildu:  npm run audit:meta
import fs from "node:fs";
import path from "node:path";

const ROOT = "_site";
const TITLE_MIN = 25, TITLE_MAX = 65;
const DESC_MIN = 100, DESC_MAX = 170;

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) files.push(p);
  }
})(ROOT);

const rows = [];
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  // Neindexovatelné stránky (404, přesměrování) do auditu met nezahrnujeme.
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim();
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [, ""])[1].trim();
  const url = f.replace(/\\/g, "/").replace(/^_site\//, "/").replace(/index\.html$/, "");
  rows.push({ url, title, desc, tl: title.length, dl: desc.length });
}

const flag = (r) => {
  const f = [];
  if (r.tl > TITLE_MAX) f.push("title↑");
  if (r.tl < TITLE_MIN) f.push("title↓");
  if (r.dl > DESC_MAX) f.push("desc↑");
  if (r.dl < DESC_MIN) f.push("desc↓");
  if (!r.desc) f.push("desc✗");
  return f.join(" ");
};

const seenT = new Map(), seenD = new Map();
for (const r of rows) {
  seenT.set(r.title, (seenT.get(r.title) || 0) + 1);
  seenD.set(r.desc, (seenD.get(r.desc) || 0) + 1);
}

console.log("URL".padEnd(46) + "T".padStart(4) + "D".padStart(5) + "  flags");
for (const r of rows.sort((a, b) => a.url.localeCompare(b.url))) {
  const dupT = seenT.get(r.title) > 1 ? "DUP-title" : "";
  const dupD = r.desc && seenD.get(r.desc) > 1 ? "DUP-desc" : "";
  const flags = [flag(r), dupT, dupD].filter(Boolean).join(" ");
  if (!flags) continue;
  console.log(r.url.padEnd(46) + String(r.tl).padStart(4) + String(r.dl).padStart(5) + "  " + flags);
}

const problems = rows.filter((r) => flag(r) || seenT.get(r.title) > 1 || (r.desc && seenD.get(r.desc) > 1));
console.log(`\nCelkem stránek: ${rows.length}, s připomínkou: ${problems.length}`);
