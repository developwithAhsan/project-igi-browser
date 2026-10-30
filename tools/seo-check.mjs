import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = "web";
const BASE = "https://project-igi.online";
const errors = [];
const titles = new Map();
const canonicals = new Map();
const routes = new Set([
  "/", "/play", "/project-igi-1-online", "/project-igi-3-online-does-it-exist",
  "/is-project-igi-online-safe", "/controls", "/faq", "/about", "/contact",
  "/privacy", "/terms", "/dmca", "/disclaimer", "/cookie-policy", "/blog",
  "/blog/getting-started", "/blog/stealth-tactics", "/blog/browser-performance"
]);

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
function attr(tag, name) {
  return tag.match(new RegExp('(?:^|\\s)' + name + '=["\\']([^"\\']*)["\\']', "i"))?.[1] ?? "";
}
function meta(html, key, property = false) {
  const tags = [...html.matchAll(/<meta\\b[^>]*>/gi)].map(m => m[0]);
  const tag = tags.find(t => new RegExp((property ? 'property' : 'name') + '=["\\']' + key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '["\\']', "i").test(t));
  return tag ? attr(tag, "content") : "";
}
function expectedPath(file) {
  const p = relative(ROOT, file).replaceAll("\\", "/");
  if (p === "index.html") return "/";
  if (p === "play.html") return "/play";
  if (p === "blogs/index.html") return "/blog";
  return "/" + p.replace(/^blogs\\//, "blog/").replace(/\\.html$/, "");
}
for (const file of await walk(ROOT)) {
  const html = await readFile(file, "utf8");
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  const expected = BASE + expectedPath(file);
  const title = html.match(/<title>([\\s\\S]*?)<\\/title>/i)?.[1]?.trim() ?? "";
  const description = meta(html, "description");
  const canonical = html.match(/<link\\s+rel=["']canonical["']\\s+href=["']([^"']+)["']/i)?.[1] ?? "";
  const h1Count = (html.match(/<h1\\b/gi) || []).length;
  const ogUrl = meta(html, "og:url", true);
  const ogImage = meta(html, "og:image", true);
  const twitterCard = meta(html, "twitter:card");
  const twitterImage = meta(html, "twitter:image");
  const ogType = meta(html, "og:type", true);

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
    if (canonical !== expected) errors.push(rel + ": canonical mismatch; expected " + expected + ", got " + canonical);
    if (canonicals.has(canonical)) errors.push(rel + ": duplicate canonical with " + canonicals.get(canonical));
    canonicals.set(canonical, rel);
  }
  if (h1Count !== 1) errors.push(rel + ": expected exactly one H1, found " + h1Count);
  if (!meta(html, "robots")) errors.push(rel + ": missing robots meta");
  if (!meta(html, "author")) errors.push(rel + ": missing author meta");
  if (ogUrl !== canonical) errors.push(rel + ": og:url must equal canonical");
  if (!ogImage.startsWith(BASE + "/") || !ogImage.endsWith(".png")) errors.push(rel + ": og:image must be a canonical-domain PNG");
  if (twitterCard !== "summary_large_image") errors.push(rel + ": missing large-image Twitter card");
  if (twitterImage !== ogImage) errors.push(rel + ": twitter:image must equal og:image");
  if (!["website", "article"].includes(ogType)) errors.push(rel + ": invalid og:type");
  if (!html.includes('rel="manifest"') || !html.includes('rel="apple-touch-icon"') || !html.includes('rel="icon"')) errors.push(rel + ": missing icon or manifest links");
  if (!html.includes('class="legal-note"')) errors.push(rel + ": missing fan-project/legal footer note");
  if (/project-igi-online\\.vercel\\.app/i.test(html)) errors.push(rel + ": contains old Vercel canonical host");
  if (/free/i.test(title) && !/own legally obtained|legally obtained game files/i.test(description)) errors.push(rel + ": uses free in title without own-copy clarification");
  if (/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.test(html) === false) errors.push(rel + ": description meta ordering could not be validated");
  if (rel.startsWith("blogs/") && rel !== "blogs/index.html" && !/"@type"\\s*:\\s*"Article"/.test(html)) errors.push(rel + ": missing Article JSON-LD");
}

// Site-level crawl directives must expose only the primary-domain sitemap.
const robots = await readFile("robots.txt", "utf8");
if (!robots.includes("Sitemap: " + BASE + "/sitemap.xml")) errors.push("robots.txt: missing primary-domain sitemap reference");
if (/vercel\\.app/i.test(robots)) errors.push("robots.txt: old Vercel host remains");
const sitemap = await readFile("sitemap.xml", "utf8");
for (const url of routes) {
  if (!sitemap.includes("<loc>" + BASE + url + "</loc>")) errors.push("sitemap.xml: missing canonical URL " + url);
}
if (/vercel\\.app/i.test(sitemap)) errors.push("sitemap.xml: old Vercel host remains");

if (errors.length) {
  console.error("SEO validation failed:\\n- " + errors.join("\\n- "));
  process.exit(1);
}
console.log("SEO validation passed: " + titles.size + " HTML pages, " + canonicals.size + " unique canonicals.");
