// Česká typografie: nezlomitelné mezery v číslech, jednotkách a telefonu.
// Spouštět ručně: node scripts/typography.mjs
import fs from "node:fs";
import path from "node:path";

const NBSP = "\u00A0";

const files = [
  ...fs.readdirSync("src/sluzby").filter((f) => f.endsWith(".md")).map((f) => "src/sluzby/" + f),
  ...fs.readdirSync("src/faq").filter((f) => f.endsWith(".md")).map((f) => "src/faq/" + f),
  ...fs.readdirSync("src/reference").filter((f) => f.endsWith(".md")).map((f) => "src/reference/" + f),
  ...fs.readdirSync("src/lokality").filter((f) => f.endsWith(".md")).map((f) => "src/lokality/" + f),
  ...fs.readdirSync("src/blog").filter((f) => f.endsWith(".md")).map((f) => "src/blog/" + f),
  "src/_data/site.json",
  "src/_data/home.json",
  "src/_data/categories.json",
  "src/_data/taxonomy.json",
  "src/_data/gallery.json",
  "src/index.njk",
  "src/sluzby.njk",
  "src/fotogalerie.njk",
  "src/kontakt.njk",
  "src/faq.njk",
  "src/reference.njk",
  "src/404.njk",
  "src/_includes/partials/cta.njk",
  "src/_includes/partials/footer.njk",
];

function fix(text) {
  return text
    .replace(/(\d)\s+(?=\d{3}(?:\D|$))/g, `$1${NBSP}`)      // tisíce: 2 000 -> 2 000 (nbsp)
    .replace(/(\d)\s+(?=(?:Kč|km|m²|m\b|hodin|hodiny|hod|%))/g, `$1${NBSP}`) // číslo + jednotka
    .replace(/\+420\s+(?=\d)/g, `+420${NBSP}`)              // telefon +420 777 -> nbsp
    .replace(/(\d)\s+(?=Kč)/g, `$1${NBSP}`);
}

let changed = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  const out = fix(src);
  if (out !== src) {
    fs.writeFileSync(f, out);
    changed++;
    console.log("upraveno: " + f);
  }
}
console.log(`Hotovo, upraveno ${changed} souborů.`);
