# AGENTS.md

Dokumentace projektu **Rychlé čištění Praha** – rozhodnutí, technologie a konvence.
Určeno pro vývojáře i AI agenty, kteří na projektu dál pracují.

---

## 1. Co je projekt

Statický marketingový web pro firmu **Rychlé čištění Praha** (mobilní čištění vozidel,
úklidové služby). Vznikl modernizací původního webu na Google Sites se zachováním
původních textů a obrázků, rozšířený o samostatné podstránky pro jednotlivé služby.

- **17 služeb** = 17 vlastních URL (`/sluzby/<slug>/`)
- Kategorie služeb slouží jako rozcestníky (kotvy na `/sluzby/`)
- **FAQ** (`/faq/`) a **Reference** (`/reference/`) jako kolekce
- **Lokality** (`/lokality/`) – 18 SEO landing pages (Praha 1–10, okolí, města)
- **Blog** (`/blog/`) a **Témata** (`/temata/`) jako obsahové huby
- **WhatsApp** jako klíčový kontaktní kanál (všude + plovoucí tlačítko)
- Obsah v češtině, ceny, reference, fotogalerie, kontakt

---

## 2. Technologický stack (kompletní)

| Vrstva | Technologie | Poznámka |
| --- | --- | --- |
| Generátor | **Eleventy (11ty) 3.x** | jediná přímá npm závislost |
| Šablony | **Nunjucks** (`.njk`) | layout + partials, chaining |
| Obsah | **Markdown + YAML front matter** | content-as-code, kolekce |
| Data | JSON v `src/_data/` | site, home, categories, taxonomy, gallery (editovatelné CMS) |
| Styly | **Ruční CSS3** | custom properties, grid, media queries |
| Skripty | **Vanilla JS** | bez knihoven (nav, lightbox) |
| Obrázky | **WebP + AVIF + `srcset`** | varianty přes Python/Pillow |
| Grafika | **SVG** | inline ikony (shortcode) + favicon + PNG ikony |
| Runtime | **Node.js 18+** (vyvíjeno na 24) | při buildu |
| Hosting | **Klasický sdílený hosting (Apache)** | nahrání `_site/` na FTP |
| Server | **`.htaccess`** | 301, gzip, cache, 404, HTTPS+www, HSTS, CSP |
| Formulář | **Žádný backend** | pouze `tel:`, `mailto:`, WhatsApp |
| CMS | **Sveltia CMS** | `/admin/`, Git backend, edituje Markdown i JSON |
| Analytika / cookies | **Žádná** | |

**Pravidlo: minimální počet npm závislostí.** Jediná přímá devDependency je
`@11ty/eleventy`. Nepřidávej frameworky, CSS preprocesory, JS bundlery ani
knihovny. Pomocné skripty (obrázky, ikony) používají **Python + Pillow**, nikoli
další npm moduly, a spouští se ručně (nejsou součástí buildu).

---

## 3. Struktura projektu

```
.eleventy.js                 konfigurace 11ty (kolekce+validace, filtry, shortcody)
package.json                 skripty, jediná devDependency
AGENTS.md                    tento dokument
scripts/
  build-images.mjs           sestaví images.json + srcsets.json ze src/assets/img
  make-variants.py           generuje WebP/AVIF varianty (Python + Pillow)
  make-icons.py              generuje PNG ikony (Python + Pillow)
  make-og-image.py           generuje obrázek pro sdílení 1200×630 (Python + Pillow)
  typography.mjs             české nezlomitelné mezery v obsahu
  check-links.mjs            kontrola interních odkazů v _site
  audit-meta.mjs             audit met title/description (délky, duplicity)
admin/                       Sveltia CMS (passthrough → /admin/)
  index.html                 načte Sveltia CMS z unpkg
  config.yml                 backend + kolekce (editace Markdownu i JSON)
src/
  _data/
    site.json                údaje firmy, kontakt, socials, statistiky
    home.json                texty domovské stránky
    categories.json          kategorie služeb ({ items: [id, title, description, image] })
    taxonomy.json            témata/štítky ({ items: [slug, label, intro, faq] })
    gallery.json             fotky galerie ({ items: [image, caption] })
    legacyRedirects.js       statické redirecty starých URL (bez .htaccess)
    images.json              logický název → cesta (generováno)
    srcsets.json             logický název → responzivní varianty (generováno)
  _includes/
    layouts/
      base.njk               HTML kostra, <head>, SEO, JSON-LD LocalBusiness, lightbox
      sluzba.njk             layout detailu služby (front matter + markdown)
      lokalita.njk           layout lokality (SEO landing page)
      clanek.njk             layout článku na blogu
    partials/
      header.njk footer.njk breadcrumbs.njk cta.njk
      service-card.njk lightbox.njk
      topic-chips.njk whatsapp-floating.njk
  sluzby/                    JEDEN MARKDOWN = JEDNA SLUŽBA
    sluzby.11tydata.js       directory data: layout, tags, computed description/ogImage
    <slug>.md                17 souborů služeb
  faq/                       JEDEN MARKDOWN = JEDNA OTÁZKA (bez vlastní URL)
    faq.11tydata.js          directory data: tags, permalink: false
    <slug>.md
  reference/                 JEDEN MARKDOWN = JEDNA REFERENCE (bez vlastní URL)
    reference.11tydata.js
    <slug>.md
  lokality/                  JEDEN MARKDOWN = JEDNA LOKALITA (SEO landing page)
    lokality.11tydata.js
    <slug>.md                18 lokalit
  blog/                      JEDEN MARKDOWN = JEDEN ČLÁNEK
    blog.11tydata.js
    <slug>.md                4 články
  temata/                    archiv témat generovaný z taxonomy.json
    temata.11tydata.js
    tema.njk
  sluzby.njk                 rozcestník služeb (permalink /sluzby/)
  index.njk                  domovská stránka
  fotogalerie.njk faq.njk reference.njk lokality.njk blog.njk temata.njk mapa-stranek.njk kontakt.njk 404.njk
  robots.njk sitemap.njk feed.njk
  favicon.svg site.webmanifest .htaccess
  assets/
    css/style.css js/main.js
    img/  (originály)  img/opt/ (WebP/AVIF varianty)  icons/ (PNG ikony)
```

Výstup buildu je v `_site/` (negeneruj ručně, vytváří ho 11ty).

---

## 4. Content model (Markdown + kolekce)

Obsah **není v HTML** a **není v jednom velkém datovém souboru**. Je rozdělen po
typech (content model) a verzován v Gitu (content-as-code). Kolekce se při buildu
**validují** – chybějící/neplatné pole shodí build s chybou.

### Služby = kolekce `sluzby`
`src/sluzby/<slug>.md`, front matter (YAML) + markdown tělo (úvodní odstavec).

```markdown
---
title: "Čištění autobusů – pro dopravce i soukromníky"
navTitle: "Autobusy"
category: "cisteni-vozidel"      # id z categories.json
image: "cisteni-autobusu"        # klíč do images.json
cardImage: "card-cisteni-vozidel"
excerpt: "Krátký popis do karet a meta description."
listTitle: "Seznam úkonů"
list:
  - "Hloubkové tepování všech sedadel"
pricing:
  title: "Ceník"
  items:
    - label: "Malý autobus"
      price: "od 7 000 Kč"
  note: "Nutno objednat 7 dní předem."
cta: "Objednat čištění autobusu"
order: 4
---
Zajistěte cestujícím čisté a voňavé prostředí…
```

Povinná pole (validuje se): `title`, `category`, `image`, `excerpt`, `cta`, `order`.
Volitelná: `navTitle`, `cardImage`, `benefitsTitle`, `benefits[]`, `listTitle`,
`list[]`, `groups[]` (title, list, listTitle, pricingItems[], price, duration),
`pricing` (title, items[], text, note), `topics[]`, `audience[]`,
`process[]` (title, text – **vlastní postup pro každou službu**), `priceFactors[]`,
`equipment`, `faq[]` (q, a). `category` musí existovat v `categories.json`,
`image`/`cardImage` musí existovat v `images.json` (nebo to být cesta), `topics` v `taxonomy.json`.

### FAQ = kolekce `faq`
`src/faq/<slug>.md` s front matter `question`, `order` a tělem = odpověď.
`permalink: false` → negeneruje vlastní stránku, jen se vypíše na `/faq/`
(včetně schématu `FAQPage`).

### Reference = kolekce `reference`
`src/reference/<slug>.md` s front matter `author`, `authorType` (Person/Organization),
`order` a tělem = citace. `permalink: false` → vypisuje se na `/reference/`
a na homepage (schéma `Review`).

### Lokality = kolekce `lokality`
`src/lokality/<slug>.md` s front matter `title`, `region`, `order`, `topics` a tělem
= úvodní text (4 odstavce). Vlastní URL `/lokality/<slug>/`. SEO landing pages s **odlišným**
textem (pozor na doorway pages). Layout přidá odkazy na služby, dojezd a schéma `Service`.

### Blog = kolekce `clanky`
`src/blog/<slug>.md` s front matter `title`, `date`, `topics`, `image`, `excerpt`,
`faq[]` (q, a) a tělem = článek (Markdown, včetně tabulek a interních odkazů).
URL `/blog/<slug>/`, schéma `BlogPosting` + `FAQPage`.

### Témata = číselník `taxonomy`
`src/_data/taxonomy.json` definuje témata (`slug`, `label`, `description`, `intro`, `faq`).
Služby, lokality i články je mají v `topics: [...]`. Archiv `/temata/<slug>/` se generuje
přes pagination a sdružuje související obsah (interní prolinkování = hlavní SEO přínos).
Kniha `intro` (2–3 odstavce) a `faq` zajišťují, že stránka tématu **není thin content**.
Neznámé téma shodí build. Šablona používá filtr `byTopic` a `topicLabel`.

### Zdroj pravdy (single source of truth)
- Text/ceny služeb → `.md` soubor. FAQ → `src/faq/`. Reference → `src/reference/`.
- Lokality → `src/lokality/`. Články → `src/blog/`. Témata → `src/_data/taxonomy.json`.
- Kategorie → `src/_data/categories.json`.
- Kontakt, adresa, socials → `src/_data/site.json`.
- Texty homepage → `src/_data/home.json`.
- Popisky galerie → `src/_data/gallery.json`.
- Obrázky → `src/assets/img/` + `images.json` (generováno `npm run images`).

---

## 5. Obrázky (responzivní)

- **Šablony** používají shortcode `{% picture key, alt, class, sizes, loading, fetchpriority %}`,
  který vygeneruje `<picture>` s AVIF + WebP `srcset` a fallback na originál.
  Příklad: `{% picture service.data.image, service.data.navTitle, "", "100vw", "lazy" %}`.
- **Hero na homepage** má obrázek na pozadí přes CSS proměnnou (`.hero--home` v `style.css`),
  ne inline style (kvůli CSP).
- **Postup při výměně obrázků:**
  1. Nahraj originály do `src/assets/img/`.
  2. `npm run variants` → WebP/AVIF do `src/assets/img/opt/` (vyžaduje Python + Pillow).
  3. `npm run images` → přegeneruje `images.json` + `srcsets.json`.
- `picture { display: contents }` zajišťuje, že `<picture>` neovlivní layout.
- **OG obrázek pro sdílení** `src/assets/img/og-image.jpg` (1200×630) generuje `npm run og`;
  v `base.njk` je globálně v `og:image` a `twitter:image`.
- **Preload** posílat jen tam, kde se obrázek skutečně použije (`{% if preload %}`) – jinak
  prohlížeč hlásí „preloaded but not used". Detaily služeb používají `fetchpriority="high"` u hero `<img>`.

---

## 6. Jak přidat / upravit obsah

**Nová služba:** vytvoř `src/sluzby/<slug>.md` podle vzoru (povinná pole výše),
`npm run build`. Automaticky se objeví na `/sluzby/<slug>/`, v rozcestníku
a v souvisejících službách.

**Nová FAQ / reference:** přidej `.md` do `src/faq/` resp. `src/reference/`.

**Nová lokalita:** `src/lokality/<slug>.md` (`title`, `region`, `order`, `topics`).

**Nový článek:** `src/blog/<slug>.md` (`title`, `date`, `topics`, `image`, `excerpt`)
+ text v Markdownu.

**Nové téma:** přidej do `src/_data/taxonomy.json` a přiřaď v `topics` u obsahu.

**Kategorie:** doplň do `src/_data/categories.json` (id musí odpovídat `category`).

**Úprava textů/cen:** edituj příslušný `.md`, šablon se nedotýkej.

---

## 7. Konvence

- **Obsah česky**, kód bez zbytečných komentářů.
- **Sémantické HTML**, přístupnost (skip link, aria, alt texty, focus-visible).
- **CSS**: ruční, BEM-like, `--custom-properties`, mobile-first, breakpointy
  `1024px`, `820px`, `720px`, `620px`; bez `!important` kde to jde.
- **Max 3 „boxíky" v řadě** (karty, kroky, info). Reference/infobox ≤ 3 sloupců.
- **Obrázky**: vždy přes `{% picture %}` (width/height z manifestu → bez CLS),
  `loading="lazy"` mimo LCP, `fetchpriority="high"` u hero. Fotky držet v JPEG.
- **Asset odkazy** v šablonách přes `{% asset '/assets/...' %}` (cache-busting `?v=hash`).
- **Žádné inline `style`** (CSP `style-src 'self'`).
- **Česká typografie**: nezlomitelné mezery v cenách/telefonu (`npm run typography`).
- **Žádný thin content.** Každá stránka musí mít dostatek **unikátního** obsahu:
  témata vlastní `intro` + `faq`, lokality unikátní text, služby „Pro koho" + „Jak to
  probíhá" + FAQ. Nekopíruj stejný text mezi stránkami. Štítek, který odpovídá jedné
  službě, je zbytečný (duplikace) – téma má sdružovat 2 a více položek.
- **SEO**: `title`/`description` z front matter, canonical, Open Graph, JSON-LD
  (LocalBusiness, Service, BreadcrumbList, FAQPage, Review).
- **URL**: kanonicky s koncovým lomítkem, čisté `slug` bez diakritiky.

---

## 8. Příkazy

```bash
npm install        # instalace (jediná závislost: @11ty/eleventy)
npm run serve      # vývojový server s live reload na http://localhost:8080
npm run build      # produkční build do _site/
npm run clean      # smaže _site/
npm run images     # přegeneruje images.json + srcsets.json
npm run variants   # WebP/AVIF varianty (Python + Pillow)
npm run icons      # PNG ikony (Python + Pillow)
npm run og         # obrázek pro sdílení 1200×630 (Python + Pillow)
npm run typography # české nezlomitelné mezery v obsahu
npm run audit:meta # audit met title/description (délky, duplicity)
npm run check      # kontrola interních odkazů v _site (po buildu)
```

**Náhled:** neotevírej `_site/index.html` přes `file://` – web používá absolutní cesty
(`/assets/...`). Vždy `npm run serve`.

**Nasazení:** obsah `_site/` nahraj na FTP (včetně `.htaccess`). Před nahráním `npm run build`.

---

## 9. Rozhodnutí (decision log)

- **Statický web, 11ty, minimum node modulů.** Pomocné skripty v Pythonu (Pillow).
- **1 služba = 1 vlastní URL (~17).** Kategorie jako rozcestníky (kotvy).
- **Content-as-code:** Markdown + kolekce (služby, FAQ, reference) s validací.
- **Zachovat maximum původních textů a obrázků.** Obrázky z Google Sites (~562 px),
  těžké PNG → JPEG, doplněny WebP/AVIF varianty + `srcset`. Originály ve vyšším
  rozlišení stále chybí (viz další rozvoj).
- **Opraveny zjevné překlepy** původního webu. Věcné znění zachováno.
- **Fakturační údaje:** TRIVESTIA s.r.o., Táboritská 880/14, 130 00 Praha 3, IČO 24032549.
- **Bez kontaktního formuláře** – jen telefon, e-mail, WhatsApp.
- **301 přesměrování** původních Google Sites URL přes `.htaccess`.
- **HTTPS + www**, HSTS a CSP vynuceny v `.htaccess`.
  (CSP má `script-src 'unsafe-inline'` kvůli inline JSON-LD.)
- **`.htaccess` zůstává** pro FTP/Apache. Protože GitHub Pages `.htaccess` neumí,
  jsou navíc **statické redirecty** (`src/_data/legacyRedirects.js` + `src/presmerovani.njk`
  → meta refresh + JS) a **catch-all v `main.js`** pro `/RychleCisteniPraha/*`.
- **Dvojí nasazení:** klasický FTP/Apache (base path `/`, `.htaccess` platí) a
  dočasně **GitHub Pages** přes Actions. Kvůli subpath (`/<repo>/`) je build
  parametrizovaný přes `BASE_PATH` (výchozí `/`) a `url` transform prefixuje
  root-relative cesty. CSS a webmanifest proto používají **relativní** cesty.
- **Cache-busting** assetů přes `?v=<hash>` (`{% asset %}`) + dlouhá cache v `.htaccess`.
- **Validace front matter** při buildu (chybí pole → build spadne).
- **Max 3 boxíky v řadě** a **hero s obrázkovým pozadím** (požadavky klienta).
- **Responzivní obrázky** (`<picture>` AVIF/WebP) a **česká typografie** (nbsp).
- **SEO landing pages** – lokality (`/lokality/`) s unikátním textem; blog a témata jako huby.
- **Témata (topics)** pro interní prolinkování; archivy `/temata/<slug>/`.
- **WhatsApp** jako rovnocenný kanál (hlavička, patička, CTA, detaily, plovoucí tlačítko).
- **Rozšířené texty služeb** – „Pro koho", „Jak to probíhá" a per-služba FAQ (schéma `FAQPage`).
- **Tmavá hlavička** (tmavě modrá + zlatá) kvůli brandu a návaznosti na tmavý hero a patičku.
- **Globální OG obrázek 1200×630** (`/assets/img/og-image.jpg`) pro konzistentní sdílení.
- **HTML mapa stránek** (`/mapa-stranek/`) vedle XML sitemapy; patička odkazuje na 123stranky.cz.
- **RSS/Atom feed** blogu na `/feed.xml`; v `<head>` je `<link rel="alternate">`.
- **Autor článků = Radek Ingr** (schéma `Person` + bio box u článku) kvůli E-E-A-T.
- **Prolinkování služba ↔ lokalita** – služby odkazují na relevantní lokality (podle kategorie).
- **Kontrast:** malý zlatý text na světlém pozadí používá `--gold-text` (tmavší) místo `--gold`.

---

## 10. Možný další rozvoj

- **Originální fotky ve vyšším rozlišení** od klienta (dnes ~562 px; hero se zvětšuje).
- **Revize textů** lokalit, článků a služeb klientem (texty jsou připravené, ale je
  vhodné potvrdit věcnou správnost cen a rozsahu).
- **Fotky před/po a reálné reference** – výrazně zvednou důvěru i obsah.
- **Git-based CMS (Sveltia) – hotovo v Etapě 1** (viz sekce 14): data převedena na JSON,
  obrázky na cesty, CI generuje varianty. Zbývá Etapa 2 (OAuth worker pro klienta).
- i18n (podsložka na jazyk) přes 11ty data cascade.
- Popisky fotek potvrdit/doplnit od klienta (`src/_data/gallery.json`).

---

## 11. Poznámky pro AI agenty

- Po každé změně spusť `npm run build` a `npm run check`.
- Nezaváděj nové npm závislosti bez schválení – stack je záměrně minimální.
- Neupravuj `_site/` ručně, je to generovaný výstup.
- Drž se konvencí a jazyka obsahu (čeština).
- Při změně content modelu nebo konvencí aktualizuj tento dokument.

---

## 12. Zkušenosti a poučení (lessons learned)

Poznatky z modernizace webu – co nás potrápilo a jak to řešit příště.

### 11ty / Nunjucks
- **Layouth nepoužívají `{% block %}`.** 11ty předá obsah jako proměnnou `content`;
  v layoutu musí být `{{ content | safe }}`. Když dáš do stránek `{% block content %}`,
  `<main>` zůstane prázdný.
- **Filtr není funkce.** `{{ year() }}` shodí build; použij shortcode `{% year %}`.
- **Shortcode nemá přístup ke globálním datům.** Manifest obrázků načti z disku
  v `.eleventy.js`, ne přes kolekce.
- **`selectattr` je v této verzi Nunjucks jen dvouargumentový** (`selectattr(arr, attr)`)
  a test/hodnotu ignoruje → pro výběr podle hodnoty použij vlastní filtr
  (`categoryById`, `topicLabel`, `byTopic`), jinak dostaneš první položku.
- **Directory data platí na celou složku.** `sluzby.11tydata.js` ovlivní i `index.njk`
  ve stejné složce → rozcestník přesuň mimo (např. `src/sluzby.njk`).
- **`permalink: false`** udrží položku v kolekci, ale nevytvoří stránku; `templateContent`
  jde použít pro výpis i JSON-LD.
- **ESM:** `"type": "module"`, konfigurace i data přes `export default`.
- **Pozor na kolizi dat `tags`.** Globální data pojmenovaná `tags` kolidují s 11ty `tags`
  v šablonách (front matter má vlastní `tags` pro kolekce) → číselník témat je `taxonomy`.
- **Nunjucks neumí atributové přiřazení** `{% set objekt.attr = … %}` (shodí kompilaci).
  Použij filtr (`byTopic`) nebo `namespace()`.
- **Directory data musí odpovídat názvu složky** (`blog.11tydata.js`), ne názvu šablony.
- **WhatsApp předvyplňovat** přes `?text=` + filtr `urlencode`.
- **Tvar `faq` je nyní jednotný.** Všude (témata, služby, články) je to pole objektů
  `{ q, a }` (`item.q`, `item.a`). Původně byla témata pole dvojic (`item[0]`, `item[1]`) –
  při migraci na JSON sjednoceno, pozor na starší úryvky kódu.

### Obsah a SEO
- **Thin content je největší SEO riziko.** Archivy (témata, lokality) nesmí být jen
  seznam odkazů – potřebují vlastní editorial text (úvod, FAQ). Ověřeno: stránky témat
  mají `intro` + `faq`, lokality dva unikátní odstavce.
- **Štítek (téma) nesmí být 1:1 se službou** – vznikl by duplicitní/tenký obsah. Téma
  má sdružovat alespoň 2–3 související položky napříč službami, lokalitami a články.
- **Lokality = doorway pages riziko.** Každá musí mít odlišný, konkrétní text
  (čtvrť, průmysl, dostupnost), ne přehozená slova z jedné šablony.
- **Nezdvojovat text** mezi službou, tématem a lokalitou – použij odkazy a shrnutí.
- **Sdílené bloky zabíjejí unikátnost.** Blok „Jak to probíhá" byl původně stejný na všech
  17 službách – správně má každá služba `process`, `priceFactors` a `equipment` vlastní.
- **Hloubka místo délky.** Uživatel i Google ocení konkrétní fakta (cena, doba, technika,
  postup), ne obecné fráze. Detaily služeb mají dnes přes 3 500 znaků textu a 5 FAQ.
- **Blog neopomíjet.** Články jsou stejně důležité jako služby – mají mít strukturu
  (H2/H3, tabulky, seznamy), konkrétní čísla, interní odkazy v textu a `faq` + schéma
  `FAQPage`. (V jedné iteraci byl blog opomenut a zůstal tenký.)
- **FAQ odpověď = odstavec.** Odpovědi nesmí být jednořádkové – mají mít 2–4 věty
  (kontext + konkrétní čísla). Platí pro služby, témata, články i FAQ stránku.
- **Interní odkazy v textu**, ne jen karty a seznamy – prolinkování zvyšuje hodnotu
  i SEO. Odkazuj na související služby a témata přímo ve větách.
- **Hloubka platí pro všechny typy stránek:** služby (`process`, `priceFactors`,
  `equipment`, `faq`), témata (`intro`, `faq`), lokality (4 odstavce), blog (články
  s FAQ), reference (úvod s výsledky).
- **Vše je draft k revizi.** Texty psané AI musí klient potvrdit věcně (ceny, rozsah).
- **Ceny/dostupnost držet jednotně** napříč službami, tématy, lokalitami i články;
  ideálně čerpat z jednoho místa, ať se nerozejdou.

### Obrázky
- **Google Sites URL expirují.** `lh3.googleusercontent.com/sitesv/...` po chvíli vrací
  403; stahuj stránku i obrázky **v jednom kroku** (čerstvé podpisy). Náhradní hosty
  lh4–lh6 nepomohly.
- **Google vrací jen ~562 px.** Originály ve vyšším rozlišení z webu nedostaneš –
  vyžádej je od klienta.
- **Těžké PNG → JPEG.** Fotky z Google jsou PNG o ~400–560 kB; konverze
  (System.Drawing nebo Pillow) ušetří přes 80 %.
- **`<picture>` dej `display: contents`**, aby wrapper neovlivnil layout ani selektory `img`.
- **Po každé změně obrázků** přegeneruj manifest (`npm run variants` → `npm run images`).

### SEO a bezpečnost
- **Cache + `immutable` bez fingerprintu = rok starý CSS.** Přidej `?v=<hash>` (`{% asset %}`).
- **CSP vs inline JSON-LD** – nutné `script-src 'unsafe-inline'` (nonce na statickém FTP nejde).
- **CSP vs inline `style`** – hero pozadí řeš CSS proměnnou, ne `style="..."`.
- **Schémata** (Service, FAQPage, Review, BreadcrumbList, LocalBusiness) zvyšují šanci
  na rich results; generuj je z kolekcí, ať nevzniká duplikace.

### Prostředí a workflow
- **GitHub Pages neumí `.htaccess`** – 301 ze starých URL řeš statickými přesměrováními
  (`legacyRedirects` + `presmerovani.njk`) a catch-all JS v `main.js` pro `/RychleCisteniPraha/*`.
  `.htaccess` přesto **ponech** (FTP/Apache ho využije).
- **Subpath (projektová GitHub URL)** – build čte `BASE_PATH` (např. `/RychleCisteniPraha.cz/`);
  transform prefixuje `href`/`src`/`poster`/`srcset`. CSS `url()` a webmanifest musí být
  **relativní**, jinak se na subpath rozbijí. Při `BASE_PATH=/` je výstup beze změny.
- **Windows PowerShell zobrazuje diakritiku jako mojibake** – soubory jsou v pořádku
  (UTF-8), nepanikař; ověřuj přes `[System.Text.Encoding]::UTF8`.
- **`file://` náhled nefunguje** – absolutní cesty `/assets/...`; vždy `npm run serve`.
- **Validuj front matter** – build musí spadnout při chybějícím poli; ověř i negativním
  testem (dočasně rozbitý soubor).
- **Nezdvojuj obsah** – reference ber z kolekce, ne i z `home.json`.
- **Při refactoru hledej všechna použití** – na Windows není `rg`; použij hledání v editoru.
- **Dev server po změně konfigurace restartuj** (`npm run serve`) – manifesty se čtou při startu.
- **Nepreloadovat nepoužívaný obrázek.** Fallback `ogImage or 'hero'` preloadoval logo na všech
  stránkách → warning „preloaded but not used". Preload jen přes `{% if preload %}`.
- **Portrét neřezat.** Fotky nedávat do `aspect-ratio` + `object-fit: cover`, pokud to není záměr;
  použij `width: 100%; height: auto` (kontakt).
- **Nadpisy sekcí patří do `.section__head`** – jinak chybí spodní odsazení a obsah se „lepí" na titulek.
- **Meta title/description hlídat auditem** (`npm run audit:meta`). Titulky držet ≤ ~64 znaků;
  pro služby použít `navTitle` v `<title>` (kratší a bez duplicit s tématy). Description musí
  být **unikátní** (pozor na fallback `site.description` u kolekcí bez `description`).
- **Kontrast malého zlatého textu** na bílém nestačí (WCAG) – používej `--gold-text`, `--gold`
  jen na tmavém pozadí nebo jako dekoraci.
- **Lightbox má focus trap** (Tab cyklí mezi tlačítky) a vrací fokus po zavření.

### Co se osvědčilo
- **Content-as-code** (Markdown + kolekce) pro konzistenci a snadný růst.
- **Minimum závislostí** – obrázky přes Python/Pillow, ne sharp.
- **Vlastní skripty** pro obrázky, typografii a kontrolu odkazů (`scripts/`).
- **`AGENTS.md` jako jediný zdroj** konvencí a rozhodnutí.

---

## 13. SEO checklist

Co kontrolovat u každé stránky a před nasazením.

### Po každé změně (spustit)
- `npm run build` – build bez chyb (validace front matter).
- `npm run check` – žádné rozbité interní odkazy ani chybějící zdroje.
- `npm run audit:meta` – titulky i descriptions (délky, duplicity).
- `npm run typography` – nezlomitelné mezery po úpravě textů.
- `npm run images` (+ `npm run variants`) – po přidání/výměně obrázků.

### Meta a indexace
- **`<title>`** unikátní, ≤ ~64 znaků; brand se přidává jen když se vejde; služby používají `navTitle`.
- **`description`** unikátní a výstižná (~100–170 znaků); pozor na fallback `site.description`.
- **`canonical`** = `site.domain + page.url`, kanonicky s koncovým lomítkem.
- **`robots`**: `index, follow` všude; `noindex` jen u `/404`.
- Jeden tvar URL (**HTTPS + www**) a 301 ze zbytku; staré URL přesměrované (`.htaccess`).

### Obsah
- **Žádný thin/duplicate content** – každá stránka unikátní a dost hluboká.
- **Jedno H1** na stránku, logická hierarchie H2/H3.
- **Interní odkazy v textu** s kontextem (služba ↔ lokalita ↔ téma ↔ článek).
- Konzistentní **ceny a dostupnost** napříč službami, tématy, lokalitami i články.
- **FAQ odpovědi = odstavce** (2–4 věty).

### Obrázky
- **`alt`** u každého obrázku; **`width`/`height`** (proti CLS); `loading="lazy"` mimo LCP.
- **LCP** (hero): `loading="eager"` + `fetchpriority="high"`; preload jen když se obrázek použije.
- Vše přes `{% picture %}` (AVIF/WebP + `srcset`); fotky v JPEG.
- **OG obrázek** 1200×630 zapojený v `og:image`/`twitter:image`.

### Strukturovaná data (JSON-LD)
- `LocalBusiness` (globálně), `Service` + `BreadcrumbList` (služby, lokality),
  `FAQPage` (FAQ, služby, články, témata), `BlogPosting` (články), `Review` (reference).
- Validovat (Rich Results Test / Schema.org validátor); **nevymýšlet** hodnoty (geo, rating).

### Sitemap, robots, feed
- **`/sitemap.xml`** obsahuje všechny indexovatelné stránky + `lastmod`.
- **`/robots.txt`** odkazuje na sitemapu.
- **`/feed.xml`** platný; v `<head>` je `<link rel="alternate">`.
- **HTML mapa** `/mapa-stranek/`.

### Výkon (Core Web Vitals)
- **LCP**: hero eager + `fetchpriority="high"`; **CLS**: `width`/`height` a rezervace místa.
- **Komprese a cache** v `.htaccess`; cache-busting přes `{% asset %}` (`?v=<hash>`).
- Bez webfontů (systémové písmo), minimum JS.

### Off-page (mimo kód) – největší páka pro lokální SEO
- **Google Business Profile** (kategorie, služby, fotky, otevírací doba, příspěvky).
- **Sběr recenzí** na Google + reálné reference (pak lze doplnit `aggregateRating`).
- **Google Search Console** – nahrát `sitemap.xml`, hlídat 404 a podle nich doplnit 301.
- Konzistentní **NAP** (název, adresa, telefon) a citace v katalozích.

---

## 14. CMS (Sveltia)

Git-based CMS pro editaci hotového obsahu bez zásahu do kódu. Admin je v `admin/`
(mimo `src/`) a do buildu se kopíruje přes `addPassthroughCopy({ admin: "admin" })`,
takže běží na `/admin/`.

- **Backend:** GitHub (`Staticke-weby/RychleCisteniPraha.cz`, branch `master`).
  Editace = commit do Gitu → GitHub Actions přebuildí a nasadí. Žádný backend/DB.
- **Autentizace:**
  - **Etapa 1 (hotovo): `auth_methods: [token]`** – editor vloží GitHub Personal
    Access Token (fine-grained, Contents read/write). Bez serveru.
  - **Etapa 2 (OAuth pro netechnické uživatele):** nasadit `sveltia/sveltia-cms-auth`
    na Cloudflare Workers, zaregistrovat GitHub OAuth App (callback `<worker>/callback`),
    nastavit ve workeru `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` a `ALLOWED_DOMAINS`,
    v `admin/config.yml` doplnit `backend.base_url` (a `auth_methods: [oauth, token]`).
    PKCE GitHub pro SPA zatím nepodporuje (odloženo), proto worker.
- **Kolekce v `admin/config.yml`:** služby, lokality, blog, FAQ, reference (Markdown),
  + souborové kolekce pro `taxonomy.json`, `categories.json`, `site.json`, `home.json`,
  `gallery.json`.
- **Data jako JSON:** JS moduly nejdou editovat jako položky, proto jsou data v JSON
  (`site`, `home`, `categories`, `taxonomy`, `gallery`). Pole (`categories`, `taxonomy`,
  `gallery`) jsou obalená do `{ "items": [...] }` (Sveltia edituje objektové soubory).
- **Obrázky:** `image`/`cardImage` se v obsahu ukládají jako **cesta** (`/assets/img/...`),
  shortcode `{% picture %}` ale umí i původní **klíč** z `images.json`, takže starší obsah
  funguje dál. Filtr `imgSrc` přeloží klíč i cestu (pro JSON-LD).
- **Nahrávání fotek:** media složka `src/assets/img` → `public_folder /assets/img`.
  Varianty WebP/AVIF a manifesty generuje Python/Pillow, proto je **CI** (Actions)
  spouští před buildem (`npm run variants` → `npm run images`).
- **`/admin` a CSP:** na GitHub Pages CSP není → funguje. Na FTP/Apache by CSP v `.htaccess`
  musela dovolit `https://unpkg.com` (`script-src`) a `https://api.github.com`
  (`connect-src`).
- **Pozor na slug:** nový obsah musí mít ASCII slug bez diakritiky (konvence URL).
- **Návod pro klienta** (generování tokenu a přihlášení): `docs/navod-cms-token.md`.
