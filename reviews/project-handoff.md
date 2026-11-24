# Portfolio handoff

## Role and intent

Luqmaan Sayed is a creative web developer based in Durban, open to remote roles across EMEA. He enjoys owning a website from research and design through development and launch. At Cerebro Creative he also builds AI agents and tools, and teaches the team how to use them. The site should communicate that quickly, directly and in natural language.

## Hiring scorecard

The existing interactive scorecard is in `reviews/portfolio-scorecard.html`. It is based on the portfolio review at https://youtu.be/0pfidFgk7G8; its criteria and point weights are the assistant's interpretation, not a hiring probability. Each criterion is worth five points, four criteria per category:

- **Role fit:** identify the discipline and location; make the desired role and a relevant product problem visible immediately.
- **Work visible at a glance:** name featured projects, show the lead product, explain each project before the click and include an outcome.
- **Proof behind the work:** show a working product, state Luqmaan's contribution, explain a decision and support an outcome with evidence.
- **Distinctive craft:** use a recognisable visual idea, make it functional, keep work accessible without hover and respect reduced motion.
- **Curation and reviewer effort:** provide a work index and contact, give each featured project substance and prioritise finished flagship work.

The last recorded assessment in the scorecard was **75/100**: role fit 10/20, work at a glance 10/20, proof 20/20, distinctive craft 20/20, curation 15/20. This assessment is historical and has not been rerun after the later changes. In particular, its comments about Burning Wish and Zone of Awareness are stale: the user requested both be removed. The HTML stores checkbox changes in browser local storage, which may differ from its default score.

## Recruiter materials (UI/UX & brand design role)

- **Figma files:** https://www.figma.com/design/O0OvaXt0R4xw5OAWDUt5wu/Marburg-Import-Prepackers?node-id=0-1&p=f&t=XzOCPKwpGFZA7Q5x-0 ; https://www.figma.com/design/Omed7bHInMhoZI0SJzLlKa/MACUA?node-id=0-1&p=f&t=Vp2K6oNfyLZrVnqx-0 ; https://www.figma.com/design/3zHZCH3tOk91UwBA8G04TS/Fathima-s-Studio?node-id=3-3&t=8ykXYtN3HaJRwkw4-0 . Verify view access is open before sending.
- **WordPress/Divi sites (standard, fully built):** Bargain Xpress (https://bargainxpress.co.za/), Bargain Wholesalers (https://bargainwholesalers.co.za/), MIP Brands (https://mipbrands.co.za/), Bargain Group (https://bargaingroup.co.za/), FFS Refiners (https://ffs-refiners.com/), Mr Build Landing (https://vedalkendev.github.io/mrbuild-landing/index.html) — designed and built with Cerebro Creative's senior director (except Mr Build Landing, noted as a construction/hardware supplier landing page).
- **Additional live sites to include:** Toolmac (https://toolmac.co.za/) — end-to-end owned project, homepage load 12 sec → 0.5 sec.
- **Recruiter page:** `/src/routes/work/for-recruiters/+page.svelte` — a dedicated page holding Figma links, WordPress sites, creative range case studies, AI workflow metrics and contact. Rendered from `src/lib/projects.ts` (`additionalWork`). Not yet linked from navigation; add a link if desired.
- **AI workflow:** Leads AI systems at Cerebro Creative; three AI agents saving 25 hours/week; content repurposing system saving two FMCG designers 20 hours/week; AI training project with two sessions on the agent loop, briefing, folder routing and token-saving context.
- **CV:** CV file `luqmaan-sayed-cv.pdf` provided by the user and copied to `static/luqmaan-sayed-cv.pdf`. Linked from the recruiter page as a download.

## Key decisions and current work

- Preserve the Cosmic Archive visual identity and the ASCII helmet. Its gaze and bottom-right dock work on desktop and mobile. The visor cracking and hyperspace sequence were explicitly removed at the user's request.
- Featured case studies: Toolmac, PlanCheck and Cosmic Archive ASCII. Toolmac was owned end to end; one documented design correction changed a symmetrical heading to an asymmetrical one after revisiting the client's brand principles. Reported homepage load time improved from 12 seconds to 0.5 seconds after caching. PlanCheck has six beta testers. Cosmic Archive ASCII includes measured rendering improvements. Keep figures attributed to the existing project material and avoid inventing outcomes.
- The home page includes AI agents, studio tools and a link to the AI training project. Its two-session training includes interactive demonstrations of the agent loop, briefing, folder routing and token-saving context. The source kit is `/Users/Admin/Documents/projects/AI_AGENT_PRESENTATION/portfolio-white-label/`.
- The user prefers direct, concise copy, grounded claims and distinctive, useful visuals over generic filler. They asked for a Humanizer pass; this was applied locally. Respect attributions and factual scope.
- The shelf is Luqmaan's personal book library. Category, author and series filters update the URL; a hydration fix ensures filtered direct links show the correct covers. Hover reveals a 400-column Visor-look ASCII cover with an irregular radial spread from the entry point, lasting 0.75 seconds. It holds while hovered, waits 0.25 seconds on exit, and retracts toward the exit point. Covers do not move on hover. The cursor and border are hidden over covers, per user request. Touch and keyboard can toggle the full ASCII cover. Reduced motion is supported. Each cover's character grid came from the local ASCII generator and was rasterized to WebP; images are loaded on interaction. The current assets live under `static/shelf/`.
- The user values actual design iterations and checks. When they request a specific number of review rounds, carry out that many distinct rounds with changes and evaluation; do not substitute a list of small edits or claim rounds were completed when they were not. Ask targeted questions when the interaction brief has meaningful ambiguity.
- The user previously noted the PlanCheck intro hover preview used a segment without real motion. That concern should be verified before describing it as resolved.

## Workspace state

Repository: `/Users/Admin/Documents/projects/luqmaan/vedalken-opus`, branch `main`. There are extensive uncommitted changes and untracked assets from the ongoing portfolio work; preserve them. Do not reset, overwrite or commit/push without a fresh instruction. The local development server has been run at http://localhost:5173/. Previous Svelte and production build checks passed after the shelf changes; the final Visor asset replacement passed Svelte and interaction checks but did not receive a separate production build.
