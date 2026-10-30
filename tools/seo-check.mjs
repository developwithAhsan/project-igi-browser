import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "web";
const BASE = "https://project-igi-online.vercel.app";
const errors = [];
const titles = new Map();
const canonicals = new Map();

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

for (const file of await walk(ROOT)) {
  const html = await readFile(file, "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\\s+content="([^"]*)"/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) errors.push(file + ": missing title");
  else {
    if (title.length >= 60) errors.push(file + ": title is " + title.length + " chars (must be under 60)");
    if (titles.has(title)) errors.push(file + ": duplicate title with " + titles.get(title));
    titles.set(title, file);
  }
  if (!description) errors.push(file + ": missing meta description");
  else if (description.length >= 160) errors.push(file + ": description is " + description.length + " chars (must be under 160)");
  if (!canonical) errors.push(file + ": missing canonical");
  else {
    if (!canonical.startsWith(BASE)) errors.push(file + ": canonical is outside primary domain: " + canonical);
    if (canonicals.has(canonical)) errors.push(file + ": duplicate canonical with " + canonicals.get(canonical));
    canonicals.set(canonical, file);
  }
  if (h1Count !== 1) errors.push(file + ": expected exactly one H1, found " + h1Count);
  if (/free/i.test(title || "") && !/own|legally obtained|bring your own/i.test(description || "")) {
    errors.push(file + ": title uses free without own-copy clarification in description");
  }
}

if (errors.length) {
  console.error("SEO validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("SEO validation passed for " + titles.size + " HTML pages.");
