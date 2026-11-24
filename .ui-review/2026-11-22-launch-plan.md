# Launch review and plan

Ready to ship: no, pending the remaining interaction and screen-reader checks. The homepage contains three misleading button roles, and the fixed Index control overlaps page content at 390 px.

## Review record

Assumed purpose: show Luqmaan's work and give prospective collaborators a way to contact him. Reviewed a local production build on 22 November 2026. Guarded captures and accessibility trees: `/`, `/work`, `/shelf`, `/about`, `/work/plancheck`, at 390 × 900 and 1280 × 900, reduced motion; `.ui-review/launch/`. `npm run check`, `npm run build`, capture, and axe scan exited 0. Axe found no violations on those routes plus Toolmac and Cosmic Archive ASCII at both widths. Automated scans do not establish accessibility conformance. User confirmed project claims are valid.

## Findings and plan

1. **Should fix — misleading controls** (criterion 5, homepage, both widths). The decorative words “cosmic archive”, “interfaces”, “motion” are exposed as buttons but Enter has no effect. Decide whether to expose them as ordinary text with decorative previews or implement meaningful keyboard activation. Then test with a screen reader. Previous evidence: `.ui-review/2026-11-22-home-accessibility.md`.
2. **Should fix — fixed Index overlaps content** (criterion 12, 390 px, across routes). The fixed trigger appears over body text in mobile full-page captures (for example `launch/about-before-390.png`). Move it into a reserved area or give it an unobtrusive background and clearance; check while scrolling and while tabbing, including short viewports.
3. **Must verify — assistive technology and interaction paths.** Perform a real VoiceOver pass and full keyboard walk through all navigation, index dialog, archive folders, shelf filters and cover toggle, project demos, and contact form. Check focus visibility, announcements, focus return, zoom, touch and reduced motion. Prior audit tested only part of homepage.
4. **Must verify — end-to-end.** On real desktop and phone, test all internal and external project links, direct loads and refreshes, shelf filtering, video controls, contact mail-app handoff, and motion. The local test confirmed all seven main routes returned 200, one shelf category survived reload at both widths, and the PlanCheck 2.7-second preview changes from a title to a product screen. This does not verify all links or real-device motion. Image loading below the fold was not established from still captures.
5. **Metadata implemented.** Prerendered pages have one description each, page-specific titles, Open Graph and Twitter tags, canonical URLs and a 1200×630 shared image. Assumes `https://vedalken.dev` is the final origin; confirm before launch. After deployment, verify public crawler access and actual platform previews, including cache refresh and cropping.

## Edge cases not shown

Loading under throttling, failure/offline states, mail-app handoff, touch and live screen-reader behaviour, all direct links, zoom, full keyboard path, performance timing, and the remaining project routes. The guarded capture blocked external requests; this is not a weather-service test. Reduced motion was enabled in captures; normal-motion experience requires a separate real-time check. No press latency measurement was made.

## For a person to decide

Choose the semantics of the three word previews; verify final social image and production domain. The user has already confirmed project claims.

## Dismissed and left out

No aesthetic findings; still captures alone cannot establish motion quality. Below-fold cover placeholders in capture are not classified as failures without checking lazy loading by scrolling.

Coverage: homepage, work, shelf, about, PlanCheck captures at 390 and 1280; axe on those plus Toolmac and Cosmic Archive ASCII, reduced motion and one shelf filter/reload. No live screen reader or real device test.
