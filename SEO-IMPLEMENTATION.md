# Project I.G.I. Browser Edition — SEO implementation report

Last reviewed: 30 October 2026  
Primary site: https://project-igi.online  
Repository branch: \`redesign-oct30\`  
Scope: SEO, content, metadata, crawl structure, social previews and safe deployment configuration only. The game runtime, loader, controls/input code, WebAssembly build and game-folder import flow were not edited for this SEO pass.

## 1. Executive summary

The site-wide SEO foundation has been aligned to the non-www HTTPS domain \`https://project-igi.online\`.

Implemented in the repository:
- Unique page titles, meta descriptions, one H1 per indexable page, primary-domain canonicals, robots metadata and author metadata for 18 HTML pages.
- Open Graph and Twitter metadata, including a shared 1200×630 PNG social preview path.
- PNG-backed favicon/PWA icon pipeline using the repository's \`logo.png\` brand file.
- Primary-domain sitemap and robots sitemap reference.
- BreadcrumbList, FAQPage, VideoGame and Article JSON-LD on the applicable pages.
- A branded 404 page, fan-project/footer disclaimer, internal links and clean URL routing.
- A path-preserving 301 host redirect rule for \`.vercel.app\` hostnames that are routed to this Vercel project, plus a Vercel-managed 301 redirect from \`www.project-igi.online\` to \`project-igi.online\`.
- IndexNow key file, submission script and a GitHub Actions workflow for successful deployments.
- A GitHub Actions SEO validator that checks titles, descriptions, canonicals, H1 counts, social metadata, JSON-LD, robots, sitemap, icons and own-copy wording.

Not completed or not measurable from the repository connection:
- Search Console and Bing Webmaster account verification/ownership steps.
- Lighthouse and field Core Web Vitals measurement.
- Google's Rich Results Test and final public social-card crawler verification.
- A full live technical audit of \`igi.sagarinfosec.site\`; the host did not respond to the research browser.
- Redirect validation for an old Vercel alias that is not attached to the current Vercel project (details below).
- A verified public owner name and public contact/DMCA email. No identity or email has been invented.

SEO is an ongoing process; this implementation does not guarantee a search position or a Lighthouse score.

## 2. Editorial and copyright rules

The site copy must consistently say:
- The website is free to access and has no sign-up or separate installer; the player does not include the commercial game.
- Visitors must select their own legally obtained Project I.G.I. game folder.
- The game folder is copied into browser-managed origin storage (OPFS where supported); the site does not host or distribute the original commercial game data.
- The player is an independent fan project, not the official game website and not affiliated with or endorsed by the original developers or publishers.
- Device support depends on browser and hardware compatibility. Touch, gyro and widescreen are options present in this codebase, not guarantees for every device.

Do not use “free download”, “full game included”, “official version” or “play IGI 3 here”. The Project I.G.I. 3 explainer distinguishes the original 2000 game, I.G.I.-2: Covert Strike and I.G.I. Origins. The official Steam listing for I.G.I. Origins currently displays “To be announced”; the browser page runs the original Project I.G.I.: I'm Going In, not Origins.

## 3. Domain move and redirects

### Canonical domain configuration

- Canonical host: \`https://project-igi.online\`
- Protocol: HTTPS
- Host: non-www
- URL style: clean lowercase paths, no \`.html\`, no trailing slash except the domain root.
- \`robots.txt\` points at \`https://project-igi.online/sitemap.xml\`.
- \`sitemap.xml\` contains primary-domain URLs only.
- All indexable HTML page canonicals, \`og:url\`, \`twitter:image\`, \`og:image\` and JSON-LD page URLs were moved to the primary domain.
- Vercel project domain \`www.project-igi.online\` is configured as a 301 redirect to \`project-igi.online\`.
- \`vercel.json\` has a 301 host-conditioned redirect from \`.vercel.app\` hostnames routed to this project, keeping the requested path.

### Vercel alias inventory and known limit

The Vercel project currently reports these active aliases:
- \`project-igi.online\`
- \`project-igi-browser-tostoreusefuldata-7699.vercel.app\`
- \`project-igi-browser-git-redesign-oct30-tostoreusefuldata-7699.vercel.app\`

The Vercel Alias API returned 404 for \`project-igi-online.vercel.app\`, so that hostname is not an active alias on the current project. A host redirect in this repository can only handle requests that actually reach this Vercel project. The old Vercel project/alias was not deleted, transferred, or modified. If that old hostname is still expected to resolve, its owning Vercel project/account needs to be identified and its redirect configured there. Do not claim it redirects until that is checked from the old project.

### Redirect test matrix

The status column is filled only after the deployed HTTP responses are tested. Expected destination is path-preserving, not a homepage redirect.

| Old URL | Expected new URL | Expected status | Final canonical |
|---|---|---:|---|
| \`https://www.project-igi.online/faq\` | \`https://project-igi.online/faq\` | 301 | \`https://project-igi.online/faq\` |
| \`https://project-igi-browser-tostoreusefuldata-7699.vercel.app/faq\` | \`https://project-igi.online/faq\` | 301 | \`https://project-igi.online/faq\` |
| \`https://project-igi-browser-git-redesign-oct30-tostoreusefuldata-7699.vercel.app/controls\` | \`https://project-igi.online/controls\` | 301 | \`https://project-igi.online/controls\` |
| \`https://project-igi-online.vercel.app/\` | Not attached to current project; old project must be checked | Not verified | \`https://project-igi.online/\` |

Do not delete old Vercel projects or aliases as part of this migration. Keep them available until the old-host response is confirmed and the move has been monitored.

## 4. Competitor and search-result research

### Requested competitor: igi.sagarinfosec.site

| Audit item | Result |
|---|---|
| Direct homepage / view-source | Requested; host was unavailable to the research browser during this pass |
| Rendered page and all subpages | Not independently inspected |
| Headings, page text and word counts | Not verified |
| Canonical, JSON-LD, robots and sitemap | Not verified live |
| Internal links and mobile layout | Not verified live |
| Ad load and Core Web Vitals | Not measured |
| Notes supplied in the brief | Treated as unverified observations, not confirmed facts |

The supplied notes about a brand-only title, long description, missing canonical/social tags, a follow gate and several ad slots are useful test hypotheses, but they are not reported as confirmed live-site findings.

### Sampled SERP/research results

Search samples for the four requested intents surfaced established game-reference and gaming pages including PCGamingWiki, IGDB, Steam, Wikipedia and MobyGames, as well as browser-port/community pages. The result sample was not a location-fixed, rank-ordered Google top 10. Rankings can vary by location, device and personalization. People Also Ask extraction was not available, so no PAA questions are claimed as observed.

### Ten practical opportunities

1. Own one canonical home page for the combined “Project IGI online play” intent instead of creating word-order variants.
2. Keep \`/play\` as the player/setup page with a clearly stated own-copy requirement.
3. Put the no-hosted-game-files explanation next to every “free” claim.
4. Make the Project I.G.I. 1 / I.G.I.-2 / I.G.I. Origins distinction clear.
5. Publish an honest browser-storage and safety guide.
6. Document only controls and display settings actually present in the build.
7. Keep real HTML content crawlable and outside the game runtime's loading UI.
8. Avoid any sign-up, follow, subscription or download gate before meaningful page content.
9. Use a single domain, social preview, manifest and consistent icon family.
10. Improve trust through a real owner identity, a working rights/contact channel, updated policies and measurable performance evidence.

## 5. Keyword map

Only two volumes were provided as measured in the user's keyword tool:
- \`project igi online play\`: 100
- \`igi project online play\`: 32

All other keyword volumes below are unknown and must be checked in Search Console or a keyword tool; none are invented.

| Intent cluster | Main target | Natural secondary coverage |
|---|---|---|
| Core browser play | \`/\` | project igi online play; play project igi online; project igi browser |
| Player / free access | \`/play\` | project igi game online play; project igi online free (with own-copy explanation); browser edition |
| Original 2000 game | \`/project-igi-1-online\` | project igi 1 game online; I'm Going In; Project IGI 2000 |
| IGI 3 explainer | \`/project-igi-3-online-does-it-exist\` | is there a Project IGI 3; Project IGI 3 game play online; I.G.I. Origins status |
| Trust and safety | \`/is-project-igi-online-safe\` | project igi online safe; project igi game online safe download |
| Browser/device controls | \`/controls\` | keyboard and mouse controls; touch controls; gyro aim; widescreen |
| Help | \`/faq\` | Chromebook, Android and tablet setup; import issue; black screen; browser storage |
| Brand and trust | \`/about\`, \`/contact\`, legal pages | independent browser port; own game files; DMCA |

The competitor's name is not a target keyword. Search monitoring can include it only as a competitive observation, not as page copy.

## 6. Page-by-page on-page plan

Title and description lengths below are the actual current HTML attribute string lengths. HTML entities such as \`&amp;\` are counted as stored in the source; rendered visible text is slightly shorter. Titles are under 60 and descriptions under 160 characters.

| URL | Title (chars) | Meta description (chars) | H1 | Primary keyword | Secondary terms / internal links |
|---|---|---|---|---|---|
| \`/\` | Project IGI Online Play – Browser Edition (41) | 137 | Play Project I.G.I. Online | project igi online play | project igi browser; /play, /controls, /faq, /about |
| \`/play\` | Play Project IGI Online Free in Browser (39) | 128 | Play Project I.G.I. Online in Your Browser | play project igi online free | game online play; own-copy note; /, /controls, /faq, /is-project-igi-online-safe |
| \`/project-igi-1-online\` | Project IGI 1 Online – Original 2000 Game (41) | 132 | Project I.G.I. 1 Online: The Original 2000 Game | project igi 1 game online | I'm Going In; /play, /controls, /faq, /project-igi-3-online-does-it-exist |
| \`/project-igi-3-online-does-it-exist\` | Project IGI 3 – Does It Exist? Honest Guide (43) | 119 | Project I.G.I. 3 Online: Does the Game Exist? | project igi 3 game play online | I.G.I. Origins; /play, /project-igi-1-online |
| \`/is-project-igi-online-safe\` | Is Project IGI Online Safe? Browser Guide (41) | 120 | Is Project I.G.I. Online Safe to Use? | is project igi online safe | local storage; /play, /privacy, /disclaimer, /dmca |
| \`/controls\` | Project IGI Controls – Keyboard, Mouse &amp; Touch (50) | 101 | Project I.G.I. Controls: Keyboard, Mouse &amp; Touch | project igi controls keyboard mouse | touch, gyro and widescreen; /play, /faq |
| \`/faq\` | Project IGI Online FAQ – Setup &amp; Browser Help (49) | 119 | Project I.G.I. Online: Frequently Asked Questions | project igi browser help | Roman Urdu/Hindi queries; /play, /controls, /is-project-igi-online-safe |
| \`/about\` | About IGI Online – Browser Edition (34) | 127 | About IGI Online | IGI Online | port, file import; /play, /disclaimer |
| \`/contact\` | Contact IGI Online – Technical &amp; Rights Requests (52) | 98 | Contact IGI Online | contact IGI Online | technical issue, takedown; /dmca |
| \`/privacy\` | Privacy Policy – IGI Online (27) | 108 | Privacy Policy | IGI Online privacy | browser storage, third parties; /cookie-policy |
| \`/terms\` | Terms of Use – IGI Online (25) | 117 | Terms of Use | IGI Online terms | lawful file ownership; /disclaimer |
| \`/dmca\` | DMCA &amp; Copyright Takedown – IGI Online (42) | 103 | DMCA &amp; Copyright Takedown | IGI Online DMCA | rights holder request; /contact, /disclaimer |
| \`/disclaimer\` | Project IGI Browser Edition – Disclaimer (40) | 109 | Fan Project Disclaimer | Project IGI disclaimer | unofficial port; /dmca, /terms |
| \`/cookie-policy\` | Cookie Policy – IGI Online (26) | 98 | Cookie &amp; Browser Storage Policy | IGI Online cookie policy | OPFS, ads; /privacy |
| \`/blog\` | Project IGI Blog – Browser Guides &amp; Help (44) | 97 | Field reports &amp; guides | Project IGI browser guides | /play, /controls, /faq |
| \`/blog/getting-started\` | How to Play Project IGI in Browser – Setup Guide (48) | 100 | How to Play Project I.G.I. in Your Browser | Project IGI browser setup | own files; /play, /controls |
| \`/blog/stealth-tactics\` | Project IGI Stealth Tactics – Beginner Guide (44) | 98 | Project I.G.I. Stealth Tactics for Difficult Missions | Project IGI stealth tactics | observation, cover; /play, /project-igi-1-online |
| \`/blog/browser-performance\` | Project IGI Browser Performance – Troubleshooting (49) | 97 | Project I.G.I. Browser Performance: Troubleshooting | Project IGI browser performance | graphics, memory; /play, /faq |

The title/description/one-H1/canonical checks are enforced by \`tools/seo-check.mjs\`. The three existing blog posts currently contain concise articles; add genuinely useful depth before creating additional posts.

## 7. Crawlable content and internal structure

- Home and \`/play\` contain real HTML headings, explanatory text, controls summaries and FAQ content; they do not depend on JavaScript execution to create their core descriptive copy.
- Home includes a \`noscript\` summary with the original-game identity, own-copy requirement and links.
- The game/loading control panel is marked \`data-nosnippet\` so launcher/error UI is not the principal search snippet.
- The first-visit game folder is still the visitor's own; the site does not host the commercial game files.
- Inner pages have a consistent header, logo, tagline, page navigation and footer with a fan-project/copyright note and DMCA/contact links.
- All 18 indexable pages have exactly one H1 and one unique canonical according to the automated check.
- Home and \`/play\` serve as hubs; guides link to the player and related help pages. Do not add separate pages for word-order variants of the same query.

## 8. Features verified in the source code

These are code-level observations, not a cross-device QA guarantee:
- Keyboard and mouse controls include configurable bindings and mouse settings.
- The touch code implements an on-screen movement stick and action controls for supported touch devices.
- Gyroscope aiming and motion-permission handling exist in the controls code.
- A widescreen option exists; some UI/menu/scope views retain 4:3 behavior.
- A multiplayer host/join UI exists in the current player page. Do not expand multiplayer claims beyond what a successful live session test demonstrates.
- The loader uses OPFS/origin-private browser storage for the visitor-selected files.
- Browser, GPU, memory and motion-sensor support varies by device and browser. Avoid promising universal Android, iOS, Chromebook or tablet compatibility.

No loader, game runtime, controls/input file, WebAssembly build or import-flow file was changed for this SEO work.

## 9. Metadata, icons, social cards and schema

Each indexable page has:
- A unique title and description with the target intent near the start.
- \`<html lang="en">\`, robots meta, author meta and theme color.
- A unique primary-domain canonical.
- Open Graph title, description, type, URL, site name, locale and image metadata.
- Twitter \`summary_large_image\`, title, description and image.
- Links to the site manifest, favicon and Apple touch icon.

Generated image paths:
- \`/favicon.ico\`: legacy multi-resolution favicon, including 16, 32 and 48 pixel renditions.
- \`/favicon.svg\`: SVG wrapper using the same \`logo.png\` file as its embedded artwork.
- \`/apple-touch-icon.png\`: 180×180 PNG.
- \`/icon-192.png\`: 192×192 PNG.
- \`/icon-512.png\`: 512×512 PNG.
- \`/og-project-igi.png\`: 1200×630 PNG social card derived from the repository's text-and-grid SVG artwork, not original game art.

The reproducible generator is \`tools/generate-brand-assets.py\`; workflow \`.github/workflows/generate-brand-assets.yml\` runs on the existing \`redesign-oct30\` branch. The exact generated files and deployed MIME types must be checked after that workflow has completed.

JSON-LD types:
- Home and player: WebSite, Organization, VideoGame and FAQPage.
- Inner pages: BreadcrumbList.
- FAQ, player and safety page: FAQPage.
- Blog posts: Article.

The automated check parses each JSON-LD block as JSON and enforces the expected types on the relevant routes. This is not a substitute for Google Rich Results Test or Search Console enhancement reports.

## 10. Sitemap, robots and IndexNow

- \`sitemap.xml\` lists all 18 canonical page URLs on \`https://project-igi.online\`, with \`lastmod\` of 2026-10-30.
- \`robots.txt\` allows crawling and points only to \`https://project-igi.online/sitemap.xml\`.
- \`indexnow-key.txt\` contains the same key as \`tools/indexnow-ping.mjs\`.
- \`tools/indexnow-ping.mjs\` reads canonical URLs from the live sitemap and submits them to IndexNow.
- \`.github/workflows/indexnow.yml\` is configured for successful deployment status on \`redesign-oct30\` and for manual dispatch.

An IndexNow ping is a discovery notification to participating search engines; it is not a promise of indexing or ranking.

## 11. Performance and accessibility

Existing code observations:
- The player is isolated from descriptive copy; the player container has \`data-nosnippet\`.
- The stage has a fixed 4:3 layout/aspect treatment in the responsive CSS, helping reserve space before the canvas paints.
- Ads load after idle or user interaction, rather than as an immediate content-blocking request.
- The home page comment states that analytics is not connected. No fabricated analytics ID was added.
- Touch/desktop layouts and keyboard navigation controls exist in the codebase.

Not measured in this pass:
- Lighthouse Performance, Accessibility, Best Practices or SEO scores.
- CrUX/field LCP, INP or CLS.
- Ad-induced layout shift on real devices.
- GPU, OPFS and storage behavior across current browser/device combinations.
- Production accessibility contrast audit.

Do not publish a “90+ Lighthouse” claim until a measured report for the live production URL is available. After deployment, test desktop and mobile with the ad configuration both enabled and disabled.

## 12. Content-gap topics to prioritize later

1. Chromebook WebGPU compatibility and graphics-adapter checks.
2. Android browser and touch-control setup.
3. Tablet control layout and landscape mode.
4. Gyroscope permission troubleshooting.
5. Widescreen mode: 3D viewport versus 4:3 menus and scopes.
6. Black screen after importing a folder.
7. Browser tab reloads and memory pressure.
8. OPFS quota and browser storage eviction.
9. Re-importing after clearing site data.
10. Keyboard remapping and Modern WASD preset.
11. Mouse sensitivity and pointer lock.
12. Project I.G.I. 1 versus I.G.I.-2: Covert Strike.
13. What happened to I.G.I. Origins?
14. How to spot fake “Project IGI 3 download” pages.
15. Own-copy import, privacy and copyright basics.

Write these as useful guides only when the exact behavior is tested and there is enough original advice to justify a separate page.

## 13. Measurement template and review cadence

CSV file: \`seo/keyword-tracking-template.csv\`

Required columns: \`keyword,target_url,position,impressions,clicks,CTR,date\`.

Search Console review:
- Day 3: Pages → indexing reasons; inspect Home and Play URL inspection; confirm Google-selected canonical and sitemap discovery.
- Day 7: Performance → Web Search; filter the target keyword set; record impressions, clicks, CTR and queries.
- Day 14: compare Home vs Play query coverage and cannibalization; review Core Web Vitals.
- Day 30: compare page-level changes, excluded duplicates and search query coverage; revise titles/snippets based on actual search data.

## 14. Owner actions still required

1. Add a Google Search Console **Domain** property for \`project-igi.online\`, publish the DNS TXT record at the registrar and verify ownership.
2. Keep the old Vercel URL-prefix property for move monitoring where it exists; use the Change of Address tool only if Search Console offers it and both properties meet Google's requirements.
3. Submit \`https://project-igi.online/sitemap.xml\` in Search Console and request indexing for Home, Play, IGI 1, IGI 3 explainer, Safety and Controls after the deployed pages are verified.
4. Import Search Console data into Bing Webmaster Tools or complete Bing site verification; provide the real Bing verification token if a meta tag is desired.
5. Provide the real public owner/team identity and a monitored public contact/rights-request email. These have not been invented or published.
6. Identify the owner/project for \`project-igi-online.vercel.app\` if it must remain active as a redirect. The current Vercel project does not report it as an active alias.
7. Run Lighthouse and mobile/desktop QA on the production URL; save the reports and only then set performance targets or make claims.
8. Check the live social card with an external preview crawler and run the official Rich Results Test.
9. Review IndexNow workflow outcome and Search Console discovery after the first successful production release.

## 15. Sources for game-history and platform claims

- IGDB press kit — [Project I.G.I.: I'm Going In](https://www.igdb.com/games/project-i-dot-g-i-dot-im-going-in/presskit): original title, developer, publisher and release details.
- PCGamingWiki — [Project I.G.I.: I'm Going In](https://www.pcgamingwiki.com/wiki/Project_I.G.I.:_I%27m_Going_In): game record and technical history.
- GameSpot — [Project IGI: I'm Going In review](https://www.gamespot.com/reviews/project-igi-im-going-in-review/1900-2668524/): contemporary game description.
- Steam — [I.G.I. Origins](https://store.steampowered.com/app/1186430/IGI_Origins/): official listing currently displays “To be announced”.
- Google Search Central — [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes): permanent redirects, canonical URLs and move monitoring.
- Google Search Central — [Change of Address](https://support.google.com/webmasters/answer/9370220): requirements and submission process for eligible site moves.
- Vercel — [vercel.json project configuration](https://vercel.com/docs/project-configuration/vercel-json): host matching and redirects.

---
