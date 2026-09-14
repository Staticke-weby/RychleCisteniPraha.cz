// Sestaví src/_data/images.json a src/_data/srcsets.json ze složky src/assets/img.
// Spouštět po přidání/změně obrázků:  npm run images
import fs from "node:fs";
import path from "node:path";

const IMG = "src/assets/img";
const OPT = path.join(IMG, "opt");
const DATA = "src/_data";

function png(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function gif(buf) {
  return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
}
function jpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
function webp(buf) {
  const type = buf.toString("ascii", 12, 16);
  if (type === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (type === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  return null;
}
function dims(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(1, 4).toString() === "PNG") return png(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) return jpeg(buf);
  if (buf.slice(0, 3).toString() === "GIF") return gif(buf);
  if (buf.slice(8, 12).toString() === "WEBP") return webp(buf);
  return null;
}

const sources = fs
  .readdirSync(IMG)
  .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
  .sort();

const images = {};
const srcsets = {};
for (const f of sources) {
  const key = f.replace(/\.[a-z0-9]+$/i, "");
  images[key] = "/assets/img/" + f;
  const d = dims(path.join(IMG, f));
  srcsets[key] = { w: d?.w, h: d?.h, webp: [], avif: [] };
}
images.gallery = sources
  .map((f) => f.replace(/\.[a-z0-9]+$/i, ""))
  .filter((k) => k.startsWith("gallery-"));

if (fs.existsSync(OPT)) {
  for (const f of fs.readdirSync(OPT).sort()) {
    const m = f.match(/^(.*)-(\d+)\.(webp|avif)$/);
    if (!m) continue;
    const [, key, width, ext] = m;
    if (!srcsets[key]) continue;
    srcsets[key][ext].push({ w: Number(width), url: "/assets/img/opt/" + f });
  }
  for (const key of Object.keys(srcsets)) {
    srcsets[key].webp.sort((a, b) => a.w - b.w);
    srcsets[key].avif.sort((a, b) => a.w - b.w);
  }
}

fs.writeFileSync(path.join(DATA, "images.json"), JSON.stringify(images, null, 2));
fs.writeFileSync(path.join(DATA, "srcsets.json"), JSON.stringify(srcsets, null, 2));
console.log(`images.json: ${Object.keys(images).length - 1} klíčů, galerie ${images.gallery.length}`);
console.log(`srcsets.json: ${Object.keys(srcsets).length} klíčů`);
