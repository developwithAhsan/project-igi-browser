# Project I.G.I. Browser Edition — SEO implementation notes

Updated: 30 October 2026  
Primary URL assumption: https://project-igi-online.vercel.app  
Working branch: core only. The main branch is not part of this work.

## Preservation boundary

The player DOM, canvas IDs, game runtime scripts, controls, touch system, WebAssembly runtime and game design are preserved. The dedicated /play page is a copy of the existing player page with metadata and crawlable explanatory copy; it uses the same runtime files. The Instagram follow overlay was removed from the HTML, so the original loader's existing “no gate element” path bypasses it without modifying the loader or game logic.

No game files are hosted by this website. Players must select their own legally obtained game folder. The browser copies the selected data into origin-private browser storage. Do not describe the site as providing a free game download.

## Competitor and SERP research

| Target | What could be confirmed | Limitation |
|---|---|---|
| igi.sagarinfosec.site | Direct homepage, view-source, robots.txt and sitemap.xml were requested for inspection. | The live host was not accessible to the research browser, so rendered layout, all pages, headings, body word count, JSON-LD, canonical, internal links, Core Web Vitals and live ad behavior could not be independently verified. The head observations supplied in the task are treated as unverified notes, not confirmed findings. |
| openigi.com | Search results describe a browser experience that uses the visitor's own game copy and keeps files on the computer. | A full technical comparison and device test were not completed. |
| Exact top-10 SERP positions | Search samples surfaced OpenIGI, PCGamingWiki, IGDB, Wikipedia, MobyGames, Computing History, Steam and community discussions for related queries. | Search results are not a rank-ordered Google top 10; positions vary by location, device and personalization. No ranking positions or PAA questions are claimed. |

### What visible competitors do better
- The OpenIGI result states the own-copy/local-file model clearly.
- PCGamingWiki and IGDB provide recognizable game-history reference pages.
- Steam provides the official public listing for I.G.I. Origins.

### What the supplied competitor head notes suggest, but do not verify
- A brand-only title may miss explicit browser/play intent.
- A very long description may truncate in search results.
- Missing canonical, social-card metadata and structured data would be technical gaps if confirmed on the rendered site.
- A follow-to-unlock prompt and multiple ad slots could add friction if they appear before meaningful content.
- A named author is useful only when the identity is real and authorized.

### Ten concrete opportunities
1. Lead with one canonical page for the core “Project IGI online play” intent.
2. Keep a separate /play page with the actual game window and 800–1,200 words of setup copy.
3. Explain own-copy import and local browser storage before any “free” wording.
4. Publish a factual IGI 1 vs IGI 2 vs I.G.I. Origins explainer.
5. Publish a dedicated browser safety and storage page.
6. Document only features found in the current build: keyboard/mouse, touch, gyro and widescreen.
7. Add a troubleshooting hub for WebGPU, black screens, storage and memory failures.
8. Remove the social follow gate; do not put an interstitial before play.
9. Add clean URLs, canonical metadata, sitemap, robots and consistent legal links.
10. Use a real verified owner contact and upload correct 1200×630 PNG/JPG social art and iOS/Android icons.

## Keyword clusters and additions

Only the two volumes supplied in the brief are treated as measured: project igi online play (100) and igi project online play (32). All other terms below have unknown volume and need validation in Search Console/Keyword Planner.

### Core and page mapping
- Home: project igi online play; play project igi online; project igi browser.
- /play: play project igi online free (with own-copy clarification); project igi game online play; project igi browser edition.
- /project-igi-1-online: project igi 1 game online play; project igi I'm Going In browser.
- /project-igi-3-online-does-it-exist: project igi 3 game play online; is there a Project IGI 3; IGI Origins release date/status.
- /is-project-igi-online-safe: is project igi online safe; project igi game online safe download.
- /controls: project igi controls keyboard mouse; project igi touch controls; project igi gyro aim.
- /faq: project igi browser help; project igi import own files; Roman Hindi questions such as “igi game browser me kaise khele”.

### Long-tail additions (volume unknown)
1. Project IGI browser port how to import game folder
2. Project IGI own game files stay on my computer
3. Project IGI browser storage after clearing cache
4. Project IGI WebGPU not supported fix
5. Project IGI WebGPU no usable graphics adapter
6. Project IGI black screen in Chrome fix
7. Project IGI browser game memory requirements
8. Project IGI on Chromebook WebGPU requirements
9. Project IGI Android touch controls setup
10. Project IGI tablet virtual joystick layout
11. Project IGI gyro aiming permission not working
12. Project IGI widescreen display setting explained
13. Project IGI keyboard controls remap WASD
14. Project IGI mouse sensitivity browser settings
15. Project IGI local game folder import failed
16. Project IGI OPFS storage quota error
17. Project IGI browser game Safari WebGPU compatibility
18. Project IGI 1 vs IGI 2 Covert Strike differences
19. I.G.I. Origins release date official status
20. Project IGI 3 download fake website warning
21. Project IGI browser game controls on touch screen
22. Project IGI browser session lost imported files
23. How to fix Project IGI failed to start after import
24. Project IGI game-like alternatives to play in browser

PAA/autocomplete: no verified PAA extraction was available in this research pass. Treat these as topic hypotheses, not observed PAA questions.

## Page plan

| URL | Title (chars) | Meta (chars) | H1 | Primary keyword | Secondary keywords | Internal links |
|---|---|---:|---|---|---|---|
| / | Project IGI Online Play – Browser Edition (41) | 148 | Play Project I.G.I. Online | project igi online play | project igi browser; play project igi online | /play, /controls, /faq, /about |
| /play | Play Project IGI Online Free in Browser (39) | 142 | Play Project I.G.I. Online in Your Browser | play project igi online free | project igi game online play; browser edition | /, /controls, /faq, /is-project-igi-online-safe |
| /project-igi-1-online | Project IGI 1 Online – Original 2000 Game (41) | 125 | Project I.G.I. 1 Online: The Original 2000 Game | project igi 1 game online | I'm Going In; Project IGI 2000 | /play, /faq |
| /project-igi-3-online-does-it-exist | Project IGI 3 Online – Does It Exist? (37) | 128 | Project I.G.I. 3 Online: Does the Game Exist? | project igi 3 game play online | I.G.I. Origins; release date | /play, /project-igi-1-online |
| /is-project-igi-online-safe | Is Project IGI Online Safe? Browser Guide (41) | 129 | Is Project I.G.I. Online Safe to Use? | project igi game online safe download | own game files; browser storage | /privacy, /disclaimer, /play |
| /controls | Project IGI Controls – Keyboard, Mouse & Touch (46) | 112 | Project I.G.I. Controls: Keyboard, Mouse & Touch | project igi controls keyboard mouse | touch controls; gyro aim; widescreen | /play, /faq |
| /faq | Project IGI Online FAQ – Setup & Browser Help (45) | 120 | Project I.G.I. Online: Frequently Asked Questions | project igi browser help | Chromebook; Android; black screen | /play, /controls, /safe |
| /blog | Project IGI Blog – Browser Guides & Help (40) | 125 | Existing blog index heading | project igi browser guides | setup; troubleshooting; stealth | /play, /controls |
| /about | About IGI Online – Browser Edition | unique | About IGI Online | IGI Online | fan project; browser port | /play, /disclaimer |
| /contact | Contact IGI Online – Technical & Rights Requests | unique | Contact IGI Online | contact IGI Online | technical support; takedown | /dmca |
| /privacy | Privacy Policy – IGI Online | unique | Privacy Policy | IGI Online privacy | local browser storage | /cookie-policy |
| /terms | Terms of Use – IGI Online | unique | Terms of Use | IGI Online terms | own game files | /disclaimer |
| /dmca | DMCA & Copyright Takedown – IGI Online | unique | DMCA & Copyright Takedown | IGI Online DMCA | rights holder request | /contact, /disclaimer |
| /disclaimer | Project IGI Browser Edition – Disclaimer | unique | Fan Project Disclaimer | Project IGI disclaimer | unofficial browser port | /dmca |
| /cookie-policy | Cookie Policy – IGI Online | unique | Cookie & Browser Storage Policy | IGI Online cookies | OPFS; ads | /privacy |

Note: The /play page uses the same existing player markup/runtime files. No loader.js, controls.js, touch.js, netplay.js, canvas or WebAssembly game logic was changed for SEO.

## Content topics to write later (not blog posts yet)
- Chromebook WebGPU compatibility and graphics adapter checks
- Android browser and touch-control setup
- Tablet control layout and landscape behavior
- Gyroscope permission troubleshooting
- Widescreen mode: 3D view vs 4:3 menus/scopes
- Black screen after import
- Browser tab reload and memory pressure
- OPFS quota and storage eviction
- How to re-import after clearing site data
- Keyboard remapping and Modern WASD preset
- Mouse sensitivity and pointer lock
- Project I.G.I. 1 vs I.G.I.-2: Covert Strike
- What happened to I.G.I. Origins?
- How to identify fake Project IGI 3 download pages
- Own-copy import and copyright basics

## Verification status

- Static HTML title/description lengths: checked for newly authored SEO pages; a CI check is being added.
- Canonicals, robots and sitemap: added in source; live HTTP response not verified because the deployment host was not reachable in this session.
- JSON-LD: WebSite, Organization and VideoGame on home; BreadcrumbList on inner pages; FAQPage on FAQ, play and safety pages. Live Rich Results Test not run.
- Social preview: an SVG fallback is included. Upload a 1200×630 PNG/JPG under 300 KB for reliable social-card support; do not treat SVG preview as final validation.
- Lighthouse, Core Web Vitals, live mobile layout, ad CLS, broken live links and browser gameplay: not measured. Do not report scores until run against the deployed URL.
- Search Console and Bing verification tokens were not supplied; no fake verification token was inserted.

## Owner inputs still required

- Verified public contact email for E-E-A-T and private rights-holder/DMCA requests.
- Google Search Console and Bing Webmaster verification tokens.
- Final 1200×630 OG image and PNG icon assets listed in the handoff table.
- Confirm whether the primary domain should remain project-igi-online.vercel.app or be changed.

## Manual launch checklist

1. Confirm the primary production domain and configure it in Vercel.
2. Upload the PNG assets listed in the handoff table and update icon/OG references.
3. Add the verified contact email to Contact, About, Privacy and DMCA pages.
4. Add Google Search Console URL-prefix verification and submit /sitemap.xml.
5. Add Bing Webmaster verification and import Search Console data.
6. Run the IndexNow workflow after the production deployment.
7. Request indexing for Home, Play, IGI 1, IGI 3 explainer, Safety and Controls.
8. Check Search Console at day 3, 7, 14 and 30 using the schedule below.

### Search Console review cadence
- Day 3: Pages → indexing reasons; verify canonical and sitemap discovery; inspect URL for Home and Play.
- Day 7: Performance → Web Search; filter the target keyword set; record impressions, clicks and CTR; inspect queries.
- Day 14: Compare page-level query coverage; identify cannibalization between Home and Play; inspect Core Web Vitals.
- Day 30: Compare position, impressions and CTR; improve titles/snippets based on real query data; review indexed pages and excluded duplicates.

## Brand asset handoff

| Exact repository path | Required size | Format | Use |
|---|---:|---|---|
| favicon.ico | 32×32 | ICO | Legacy browser favicon |
| favicon.svg | scalable | SVG | Current geometric favicon |
| apple-touch-icon.png | 180×180 | PNG | iOS home-screen icon |
| icon-192.png | 192×192 | PNG | PWA icon |
| icon-512.png | 512×512 | PNG | PWA/splash icon |
| og-project-igi.png | 1200×630, under 300 KB | PNG or JPG | Open Graph and Twitter card |

The repository currently includes favicon.svg and og-project-igi.svg as temporary vector assets. The PNG files above are still needed for broad social/PWA/iOS compatibility.
