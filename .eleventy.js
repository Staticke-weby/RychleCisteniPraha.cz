import fs from "node:fs";
import crypto from "node:crypto";
import categories from "./src/_data/categories.js";
import taxonomy from "./src/_data/taxonomy.js";

// Base path (subpath) pro nasazení mimo kořen domény, např. dočasná GitHub URL
// https://staticke-weby.github.io/RychleCisteniPraha.cz/ → BASE_PATH=/RychleCisteniPraha.cz/
// Na vlastní doméně (FTP/Apache) se nepoužívá → výchozí "/".
const BASE_PATH = (() => {
  let p = process.env.BASE_PATH || "/";
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.endsWith("/")) p += "/";
  return p;
})();

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/.htaccess");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");

  eleventyConfig.addShortcode("year", () => new Date().getFullYear());

  // Cache-busting: /assets/css/style.css?v=<hash obsahu>
  eleventyConfig.addShortcode("asset", (url) => {
    try {
      const hash = crypto
        .createHash("sha1")
        .update(fs.readFileSync("src" + url))
        .digest("hex")
        .slice(0, 8);
      return `${url}?v=${hash}`;
    } catch {
      return url;
    }
  });

  // Responzivní <picture> s AVIF/WebP + fallback na originál
  let IMAGES = {};
  let SRCSETS = {};
  try { IMAGES = JSON.parse(fs.readFileSync("src/_data/images.json", "utf8")); } catch {}
  try { SRCSETS = JSON.parse(fs.readFileSync("src/_data/srcsets.json", "utf8")); } catch {}

  eleventyConfig.addShortcode("picture", (key, alt, cls, sizes, loading, fetchpriority) => {
    const src = IMAGES[key];
    if (!src) return "";
    const meta = SRCSETS[key];
    const s = sizes || "100vw";
    const l = loading || "lazy";
    const fp = fetchpriority ? ` fetchpriority="${fetchpriority}"` : "";
    const clsAttr = cls ? ` class="${cls}"` : "";
    let sources = "";
    if (meta && meta.avif && meta.avif.length) {
      sources += `<source type="image/avif" srcset="${meta.avif.map((v) => `${v.url} ${v.w}w`).join(", ")}" sizes="${s}">`;
    }
    if (meta && meta.webp && meta.webp.length) {
      sources += `<source type="image/webp" srcset="${meta.webp.map((v) => `${v.url} ${v.w}w`).join(", ")}" sizes="${s}">`;
    }
    const dims = meta && meta.w ? ` width="${meta.w}" height="${meta.h}"` : "";
    return `<picture>${sources}<img src="${src}" alt="${alt}"${clsAttr}${dims} loading="${l}" decoding="async"${fp}></picture>`;
  });

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("isoNow", () => new Date().toISOString());
  eleventyConfig.addFilter("rssDate", (d) => new Date(d).toUTCString());
  eleventyConfig.addFilter("bySlug", (items, slugs) =>
    (items || []).filter((i) => slugs.includes(i.fileSlug))
  );

  // Kontextové prolinkování služba → lokalita (podle kategorie)
  const LOCALITIES_BY_CATEGORY = {
    "cisteni-vozidel": ["praha-1", "praha-9", "praha-vychod"],
    "uklidove-sluzby": ["praha-2", "praha-5", "praha-6"],
    "cisteni-interieru": ["praha-3", "praha-7", "praha-10"],
    "specialni-cisteni": ["praha-3", "kladno", "beroun"],
    "prumyslove-cisteni": ["praha-9", "praha-vychod", "kladno"],
    "doplnkove-sluzby": ["praha-4", "praha-8", "ricany"],
  };
  eleventyConfig.addFilter("localitiesFor", (categoryId) => LOCALITIES_BY_CATEGORY[categoryId] || []);
  eleventyConfig.addFilter("czDate", (d) =>
    new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d))
  );
  eleventyConfig.addFilter("byTopic", (items, slug) =>
    (items || []).filter((i) => (i.data.topics || []).includes(slug))
  );
  eleventyConfig.addFilter("categoryById", (id) => categories.find((c) => c.id === id));
  eleventyConfig.addFilter("topicLabel", (slug) => (taxonomy.find((t) => t.slug === slug) || {}).label || slug);

  // --- Validace obsahu: build spadne při chybějícím/neplatném poli ---
  const categoryIds = new Set(categories.map((c) => c.id));
  const topicSlugs = new Set(taxonomy.map((t) => t.slug));
  const byOrder = (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0);
  const fail = (item, msgs) => {
    if (msgs.length) throw new Error(`[${item.inputPath}] ${msgs.join("; ")}`);
  };

  eleventyConfig.addCollection("sluzby", (api) => {
    const items = api.getFilteredByTag("sluzby");
    for (const item of items) {
      const d = item.data;
      const errs = [];
      for (const key of ["title", "category", "image", "excerpt", "cta", "order"]) {
        if (d[key] === undefined || d[key] === "") errs.push(`chybí "${key}"`);
      }
      if (d.category && !categoryIds.has(d.category)) errs.push(`neznámá kategorie "${d.category}"`);
      for (const key of ["image", "cardImage"]) {
        if (d[key] && !(d[key] in IMAGES)) errs.push(`obrázek "${d[key]}" není v images.json`);
      }
      for (const t of d.topics || []) if (!topicSlugs.has(t)) errs.push(`neznámé téma "${t}"`);
      fail(item, errs);
    }
    return items.sort(byOrder);
  });

  eleventyConfig.addCollection("faq", (api) => {
    const items = api.getFilteredByTag("faq");
    for (const item of items) {
      const errs = [];
      if (!item.data.question) errs.push('chybí "question"');
      if (item.data.order === undefined) errs.push('chybí "order"');
      fail(item, errs);
    }
    return items.sort(byOrder);
  });

  eleventyConfig.addCollection("reference", (api) => {
    const items = api.getFilteredByTag("reference");
    for (const item of items) {
      const errs = [];
      if (!item.data.author) errs.push('chybí "author"');
      if (item.data.order === undefined) errs.push('chybí "order"');
      fail(item, errs);
    }
    return items.sort(byOrder);
  });

  eleventyConfig.addCollection("lokality", (api) => {
    const items = api.getFilteredByTag("lokality");
    for (const item of items) {
      const errs = [];
      for (const key of ["title", "region", "order"]) if (!item.data[key]) errs.push(`chybí "${key}"`);
      for (const t of item.data.topics || []) if (!topicSlugs.has(t)) errs.push(`neznámé téma "${t}"`);
      fail(item, errs);
    }
    return items.sort(byOrder);
  });

  eleventyConfig.addCollection("clanky", (api) => {
    const items = api.getFilteredByTag("clanky");
    for (const item of items) {
      const errs = [];
      for (const key of ["title", "date", "excerpt", "image"]) if (!item.data[key]) errs.push(`chybí "${key}"`);
      for (const t of item.data.topics || []) if (!topicSlugs.has(t)) errs.push(`neznámé téma "${t}"`);
      if (item.data.image && !(item.data.image in IMAGES)) errs.push(`obrázek "${item.data.image}" není v images.json`);
      fail(item, errs);
    }
    return items.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  eleventyConfig.addFilter("absoluteUrl", (url) => {
    const base = "https://www.rychlecistenipraha.cz";
    return base + url;
  });

  eleventyConfig.addShortcode("icon", function (name) {
    const icons = {
      phone: '<path d="M5 4h3l1.5 4L8 9.5a11 11 0 0 0 5.5 5.5l1.5-1.5 4 1.5v3a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4Z"/>',
      mail: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="m3 6 9 7 9-7"/>',
      whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/><path d="M8.8 7.6c.2-.4.4-.5.7-.5h.6c.2 0 .5 0 .7.5l.7 1.6c.1.3 0 .6-.2.8l-.5.5c-.2.2-.2.4-.1.6.4.8 1.3 1.7 2.1 2.1.2.1.5.1.6-.1l.5-.5c.2-.2.5-.3.8-.2l1.6.7c.4.2.5.5.5.7v.6c0 .3-.1.5-.5.7-.5.3-1.2.5-1.9.3-2.1-.5-4.5-2.9-5-5-.2-.7 0-1.4.3-1.9Z"/>',
      facebook: '<path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.3 1.4-1.3h1.4V5.6c-.2 0-1-.1-1.9-.1-1.9 0-3.3 1.2-3.3 3.4v2.3H8.8V14h2.3v7Z"/>',
      instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.3" cy="6.7" r="1"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      pin: '<path d="M12 21s7-5.3 7-11a7 7 0 0 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
      check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
      arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
      chevron: '<path d="m6 9 6 6 6-6"/>',
      star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
      shield: '<path d="M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Z"/>',
      sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    };
    const body = icons[name] || "";
    return `<svg class="icon icon--${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  });

  // Prefixuje root-relative URL (href/src/poster/srcset) o base path při subpath nasazení.
  // Při BASE_PATH="/" je transformace no-op, takže výstup na FTP/Apache je beze změny.
  eleventyConfig.addTransform("basePath", function (content, outputPath) {
    if (BASE_PATH === "/" || !outputPath || !String(outputPath).endsWith(".html")) return content;
    const prefix = BASE_PATH.slice(0, -1);
    const already = (u) => u.startsWith("//") || u.startsWith("/#") || u.startsWith(BASE_PATH);
    let out = content.replace(/(\s(?:href|src|poster)=")(\/[^"]*)"/g, (m, attr, url) =>
      already(url) ? m : `${attr}${prefix}${url}"`
    );
    out = out.replace(/srcset="([^"]*)"/g, (m, set) => {
      const rewritten = set
        .split(",")
        .map((part) => {
          const t = part.trim();
          const sp = t.indexOf(" ");
          const url = sp === -1 ? t : t.slice(0, sp);
          const rest = sp === -1 ? "" : t.slice(sp);
          if (!url.startsWith("/") || already(url)) return t;
          return prefix + url + rest;
        })
        .join(", ");
      return `srcset="${rewritten}"`;
    });
    return out;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
    pathPrefix: BASE_PATH,
  };
}
