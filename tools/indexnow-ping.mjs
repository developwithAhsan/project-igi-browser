// Submit every canonical URL in the sitemap after a successful production deployment.
// Manual use: SITE_URL=https://project-igi.online node tools/indexnow-ping.mjs
const site = (process.env.SITE_URL || "https://project-igi.online").replace(/\/$/, "");
const key = "igi-online-20261030-a8f4d1c9e27b46f0";
const sitemap = await fetch(site + "/sitemap.xml");
if (!sitemap.ok) throw new Error("Could not fetch sitemap: HTTP " + sitemap.status);
const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m => m[1])
  .filter(u => u.startsWith(site + "/"));
if (!urls.length) throw new Error("Sitemap contained no canonical URLs");
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(site).host,
    key,
    keyLocation: site + "/indexnow-key.txt",
    urlList: urls
  })
});
if (![200, 202].includes(response.status)) {
  throw new Error("IndexNow returned HTTP " + response.status + ": " + await response.text());
}
console.log("IndexNow accepted " + urls.length + " canonical URLs (HTTP " + response.status + ").");
