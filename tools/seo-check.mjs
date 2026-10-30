import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = "web";
const BASE = "https://project-igi.online";
const errors = [];
const titles = new Map();
const canonicals = new Map();
const expectedRoutes = [
  "/", "/play", "/project-igi-1-online", "/project-igi-3-online-does-it-exist",
  "/is-project-igi-online-safe", "/controls", "/faq", "/about", "/contact",
  "/privacy", "/terms", "/dmca", "/disclaimer", "/cookie-policy", "/blog",
  "/blog/getting-started", "/blog/stealth-tactics", "/blog/browser-performance"
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "ad.html") out.push(path);
  }
  return out;
}
function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}
function getAttr(tag, name) {
  const match = tag.match(new RegExp("\\b" + escapeRegExp(name) + "=[\\\"']([^\\\"']*)[\\\"']", "i"));
  return match ? match[1] : "";
}
function getMeta(html, name, property = false) {
  const selector = property ? "property" : "name";
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]);
  const tag = tags.find(item => new RegExp("\\b" + selector + "=[\\\"']" + escapeRegExp(name) + "[\\\"']", "i").test(item));
  return tag ? getAttr(tag, "content") : "";
}
function routeForFile(file) {
  const path = relative(ROOT, file).split(/[\\/]/).join("/");
  if (path === "index.html") return "/";
  if (path === "play.html") return "/play";
  if (path === "blogs/index.html") return "/blog";
  return "/" + path.replace(/^blogs\//, "blog/").replace(/\.html$/, "");
}
function jsonLdObjects(html, file) {
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects = [];
  for (const block of blocks) {
    try {
      objects.push(JSON.parse(block[1]));
    } catch (error) {
      errors.push(file + ": invalid JSON-LD: " + error.message);
    }
  }
  return objects;
}

const files = await walk(ROOT);
const pageHtml = new Map();
for (const file of files) {
  const html = await readFile(file, "utf8");
  pageHtml.set(routeForFile(file), html);
  const rel = relative(ROOT, file).split(/[\\/]/).join("/");
  const route = routeForFile(file);
  const expectedCanonical = BASE + route;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const description = getMeta(html, "description");
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? "";
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const ogUrl = getMeta(html, "og:url", true);
  const ogImage = getMeta(html, "og:image", true);
  const ogWidth = getMeta(html, "og:image:width", true);
  const ogHeight = getMeta(html, "og:image:height", true);
  const twitterCard = getMeta(html, "twitter:card");
  const twitterImage = getMeta(html, "twitter:image");
  const ogType = getMeta(html, "og:type", true);
  const schemas = jsonLdObjects(html, rel);
  const schemaTypes = schemas.flatMap(value => {
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value["@graph"])) return value["@graph"].map(item => item["@type"]).filter(Boolean);
    return [value["@type"]].filter(Boolean);
  });

  if (!title) errors.push(rel + ": missing title");
  else {
    if (title.length >= 60) errors.push(rel + ": title is " + title.length + " chars (must be under 60)");
    if (titles.has(title)) errors.push(rel + ": duplicate title with " + titles.get(title));
    titles.set(title, rel);
  }
  if (!description) errors.push(rel + ": missing meta description");
  else if (description.length >= 160) errors.push(rel + ": description is " + description.length + " chars (must be under 160)");
  if (!canonical) errors.push(rel + ": missing canonical");
  else {
    if (canonical !== expectedCanonical) errors.push(rel + ": canonical mismatch; expected " + expectedCanonical + ", got " + canonical);
    if (canonicals.has(canonical)) errors.push(rel + ": duplicate canonical with " + canonicals.get(canonical));
    canonicals.set(canonical, rel);
  }
  if (h1Count !== 1) errors.push(rel + ": expected exactly one H1, found " + h1Count);
  if (getMeta(html, "robots") !== "index,follow,max-image-preview:large") errors.push(rel + ": missing or invalid robots meta");
  if (!getMeta(html, "author")) errors.push(rel + ": missing author meta");
  if (ogUrl !== canonical) errors.push(rel + ": og:url must equal canonical");
  if (!ogImage.startsWith(BASE + "/") || !ogImage.endsWith(".png")) errors.push(rel + ": og:image must be a primary-domain PNG");
  if (ogWidth !== "1200" || ogHeight !== "630") errors.push(rel + ": expected 1200x630 social image dimensions");
  if (twitterCard !== "summary_large_image") errors.push(rel + ": missing large-image Twitter card");
  if (twitterImage !== ogImage) errors.push(rel + ": twitter:image must equal og:image");
  if (!html.includes('rel="manifest"') || !html.includes('rel="apple-touch-icon"') || !html.includes('rel="icon"')) errors.push(rel + ": missing icon or manifest links");
  if (!html.includes('class="legal-note"')) errors.push(rel + ": missing fan-project/legal footer note");
  if (/project-igi-online\.vercel\.app/i.test(html)) errors.push(rel + ": contains old Vercel host");
  if (/free/i.test(title) && !/own legally obtained|legally obtained game files/i.test(description)) errors.push(rel + ": uses free in title without own-copy clarification");
  if (route !== "/" && route !== "/play" && !schemaTypes.includes("BreadcrumbList")) errors.push(rel + ": missing BreadcrumbList JSON-LD");
  if (rel.startsWith("blogs/") && rel !== "blogs/index.html") {
    if (ogType !== "article") errors.push(rel + ": blog post should use og:type=article");
    if (!schemaTypes.includes("Article")) errors.push(rel + ": missing Article JSON-LD");
  }
  if ((route === "/" || route === "/play") && !schemaTypes.includes("VideoGame")) errors.push(rel + ": missing VideoGame JSON-LD");
  if (route === "/") {
    if (!/Project I\.G\.I\. Online Play/i.test(title)) errors.push(rel + ": title must contain Project I.G.I. and Online Play");
    if (!html.includes("<noscript")) errors.push(rel + ": missing a short noscript summary");
    const main = html.indexOf('<main id="main-content">');
    const h1 = html.indexOf("<h1", main);
    const about = html.indexOf('id="about-game"', main);
    const gallery = html.indexOf('id="screenshots"', main);
    const stage = html.indexOf('<div id="stage"', main);
    if (!(main >= 0 && h1 > main && about > h1 && gallery > about && stage > gallery)) errors.push(rel + ": H1, About and screenshots must appear before the game stage in source order");
    if (/Checking your browser…/.test(html)) errors.push(rel + ": static loading placeholder is present in crawlable HTML");
    if (!/<p id="status"[^>]*>\s*<\/p>/.test(html)) errors.push(rel + ": loader status must start empty and be populated on demand");
    if (!/<div id="crashnote"[^>]*>\s*<\/div>/.test(html)) errors.push(rel + ": crash message must be rendered only after an actual crash");
    if (/Field notes before deployment|Comments area reserved|All rights reserved/i.test(html)) errors.push(rel + ": a removed placeholder or old footer phrase remains");
    if (/id="disqus_thread"|class="comments-section"|class="promo-head"/.test(html)) errors.push(rel + ": a disabled comments/ad placeholder remains");
    if (/if mapped/i.test(html)) errors.push(rel + ": hedged key-binding wording remains");
  }
  if (route === "/play") {
    if (/id="faq"[^>]*>[\s\S]*?Frequently asked questions/i.test(html)) errors.push(rel + ": duplicate FAQ block on player page");
    if (/Comments area reserved|All rights reserved|Field notes before deployment/i.test(html)) errors.push(rel + ": old placeholder/footer copy remains");
  }

  // Every content image needs an alt attribute. Empty alt is allowed for decorative logos/background art.
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(image[0])) errors.push(rel + ": image missing alt attribute: " + image[0].slice(0, 100));
  }
  if (/vercel\.app/i.test(html)) errors.push(rel + ": old Vercel hostname remains in public HTML");
}

if (canonicals.size !== expectedRoutes.length) errors.push("Expected " + expectedRoutes.length + " canonical pages; found " + canonicals.size);

// The deployed root file must be the real home page, not a redirect stub.
const rootIndex = await readFile("index.html", "utf8");
const webIndex = await readFile("web/index.html", "utf8");
if (rootIndex !== webIndex) errors.push("root index.html must match the full web/index.html game page");
if (/Opening IGI Online|window\.location\.replace\('\/web\/'\)|http-equiv="refresh"/i.test(rootIndex)) errors.push("root index.html is still a redirect stub");

// Home-only requirements.
const home = pageHtml.get("/");
if (home && !home.includes("Original campaign: single-player")) errors.push("Home page must distinguish the original single-player campaign from browser netplay");
if (home && !home.includes("separate 1v1 online-room option")) errors.push("Home page must explain the added browser-only 1v1 feature");

// Screenshot assets and descriptive names.
for (const asset of [
  "images/project-igi-gameplay-compound.jpg",
  "images/project-igi-gameplay-yard.jpg",
  "images/project-igi-gameplay-interior.jpg"
]) {
  try { await stat(asset); } catch { errors.push("Missing screenshot asset: " + asset); }
}

// The full FAQ page retains expanded answers; Play and Safety have their own visible FAQs.
const faq = pageHtml.get("/faq") || "";
const play = pageHtml.get("/play") || "";
if ((faq.match(/<h2\b/gi) || []).length < 12) errors.push("The full FAQ page should retain its expanded question-and-answer headings");
if (!/"@type"\s*:\s*"FAQPage"/.test(faq) || !/"@type"\s*:\s*"BreadcrumbList"/.test(faq)) errors.push("The FAQ page should keep its BreadcrumbList and FAQPage schema");

// Site-wide navigation links should be absolute clean routes, not anchor-only section shortcuts.
for (const [route, html] of pageHtml) {
  if (!html.includes('href="/play"') || !html.includes('href="/controls"') || !html.includes('href="/faq"') || !html.includes('href="/blog"')) {
    errors.push(route + ": header navigation must use clean /play, /controls, /faq and /blog URLs");
  }
}
const robots = await readFile("robots.txt", "utf8");
if (!robots.includes("User-agent: *") || !robots.includes("Allow: /")) errors.push("robots.txt: crawler access rules missing");
if (!robots.includes("Sitemap: " + BASE + "/sitemap.xml")) errors.push("robots.txt: missing primary-domain sitemap reference");
if (/vercel\.app/i.test(robots)) errors.push("robots.txt: old Vercel host remains");

const sitemap = await readFile("sitemap.xml", "utf8");
for (const route of expectedRoutes) {
  if (!sitemap.includes("<loc>" + BASE + route + "</loc>")) errors.push("sitemap.xml: missing " + route);
}
if (/vercel\.app/i.test(sitemap)) errors.push("sitemap.xml: old Vercel host remains");

const key = (await readFile("indexnow-key.txt", "utf8")).trim();
const pingScript = await readFile("tools/indexnow-ping.mjs", "utf8");
if (!key || !pingScript.includes(key)) errors.push("IndexNow key does not match the submission script");

const manifest = JSON.parse(await readFile("site.webmanifest", "utf8"));
if (!manifest.icons?.some(icon => icon.src === "/icon-192.png")) errors.push("site.webmanifest: missing 192px PNG icon");
if (!manifest.icons?.some(icon => icon.src === "/icon-512.png")) errors.push("site.webmanifest: missing 512px PNG icon");

const about = pageHtml.get("/about") || "";
const aboutArticle = about.match(/<article class="inner-card about-article">([\s\S]*?)<\/article>/)?.[1] || "";
const aboutWords = (aboutArticle.replace(/<[^>]+>/g, " ").replace(/&amp;/g, " ").match(/\b[\w’'-]+\b/g) || []).length;
if (aboutWords < 800 || aboutWords > 1200) errors.push("About page must contain 800–1,200 words; found " + aboutWords);
if (!about.includes("images/project-igi-gameplay-compound.jpg") || !about.includes("alt=")) errors.push("About page needs its screenshot gallery with alt text");

if (errors.length) {
  console.error("SEO validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("SEO validation passed: " + titles.size + " HTML pages, " + canonicals.size + " canonicals, root page, screenshot gallery and FAQ uniqueness. About: " + aboutWords + " words.");
