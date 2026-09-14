// Kontrola interních odkazů a zdrojů v hotovém buildu _site.
// Spouštět po buildu:  npm run check
import fs from "node:fs";
import path from "node:path";

const ROOT = "_site";
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) files.push(p);
  }
})(ROOT);

function exists(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || !clean.startsWith("/") || clean.startsWith("//")) return true;
  const target = clean.endsWith("/")
    ? path.join(ROOT, clean, "index.html")
    : path.join(ROOT, clean);
  return fs.existsSync(target);
}

const broken = [];
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!exists(m[1])) broken.push(`${f} -> ${m[1]}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url && !exists(url)) broken.push(`${f} -> (srcset) ${url}`);
    }
  }
}

if (broken.length) {
  console.log(`ROZBITÉ ODKAZY (${broken.length}):`);
  for (const b of broken) console.log("  " + b);
  process.exitCode = 1;
} else {
  console.log(`OK: všechny interní odkazy a zdroje existují (${files.length} stránek).`);
}
