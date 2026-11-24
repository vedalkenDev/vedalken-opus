<script lang="ts">
	import { additionalWork, projects } from '#lib/projects.ts';
	import SystemGlyph from '#lib/components/SystemGlyph.svelte';

	const wordpressSites = additionalWork.filter((item) => item.slug && item.slug !== 'bargain-xpress' && item.url && item.image && item.summary.includes('WordPress'));
	const featuredSites = wordpressSites.filter((item) => ['mip-brands', 'bargain-group'].includes(item.slug!)).sort((a, b) => Number(b.slug === 'mip-brands') - Number(a.slug === 'mip-brands'));
	const otherSites = wordpressSites.filter((item) => !['mip-brands', 'bargain-group'].includes(item.slug!));
</script>

<section class="intro">
	<p class="back"><a href="/work">← All work</a></p>
	<h1>Designing and building for the web.</h1>
	<p class="intro-copy">I’m Luqmaan, a creative web developer in Durban. I design interfaces and brands, build websites from Figma to launch, and make AI tools for creative teams.</p>
	<p class="availability">Open to remote roles across EMEA</p>
	<div class="intro-actions"><a class="primary-action" href="/luqmaan-sayed-cv.pdf">Download CV <span aria-hidden="true">↗</span></a><a href="mailto:hello@vedalken.dev">Get in touch ↗</a></div>
	<nav class="jump-links" aria-label="On this page"><a href="#figma-heading">Figma</a><a href="#wordpress-heading">WordPress</a><a href="#creative-heading">Creative work</a><a href="#ai-heading">AI workflow</a></nav>
</section>

<section class="featured" aria-labelledby="featured-heading">
	<div class="featured-heading"><div><h2 id="featured-heading">Toolmac</h2><p>Research, design and development</p></div><span>WORDPRESS / WOOCOMMERCE</span></div>
	<a class="featured-image" href="/work/toolmac"><img src="/work/toolmac/storefront.webp" width="1440" height="980" alt="Toolmac online store homepage" /></a>
	<div class="featured-copy"><p>I designed and built an online store for retail shoppers and trade buyers, working directly with the client from research through launch.</p><p class="result">Reported homepage load: 12s → 0.5s</p><div class="work-links"><a href="/work/toolmac">Read the case study →</a><a href="https://toolmac.co.za/" target="_blank" rel="noopener">Visit live site ↗</a></div></div>
</section>

<section aria-labelledby="figma-heading">
	<div class="section-heading"><h2 id="figma-heading">Figma files</h2><p class="muted">UI and brand design files</p></div>
	<ul class="figma-list">
		<li><div><h3>Marburg Import Prepackers</h3><p>Product catalogue design used for the MIP build.</p></div><a href="https://www.figma.com/design/O0OvaXt0R4xw5OAWDUt5wu/Marburg-Import-Prepackers?node-id=0-1&p=f&t=XzOCPKwpGFZA7Q5x-0" target="_blank" rel="noopener">Open Figma ↗</a></li>
		<li><div><h3>MACUA</h3><p>Interface design work in Figma.</p></div><a href="https://www.figma.com/design/Omed7bHInMhoZI0SJzLlKa/MACUA?node-id=0-1&p=f&t=Vp2K6oNfyLZrVnqx-0" target="_blank" rel="noopener">Open Figma ↗</a></li>
		<li><div><h3>Fathima’s Studio</h3><p>Studio brand and interface design.</p></div><a href="https://www.figma.com/design/3zHZCH3tOk91UwBA8G04TS/Fathima-s-Studio?node-id=3-3&t=8ykXYtN3HaJRwkw4-0" target="_blank" rel="noopener">Open Figma ↗</a></li>
	</ul>
</section>

<section aria-labelledby="wordpress-heading">
	<div class="section-heading"><h2 id="wordpress-heading">More WordPress work</h2><p class="muted">Live, built websites</p></div>
	{#snippet siteCard(item: (typeof wordpressSites)[number])}
		<article class="site-item">
			<a href="/work/more/{item.slug}" class="site-image"><img src={item.image} alt="{item.title} website homepage" loading="lazy" width="1280" height="800" /></a>
			<h3>{item.title}</h3><p>{item.summary}</p>
			<div class="work-links"><a href="/work/more/{item.slug}">Project details →</a><a href={item.url} target="_blank" rel="noopener">Live site ↗</a></div>
		</article>
	{/snippet}
	<div class="site-grid">{#each featuredSites as item (item.title)}{@render siteCard(item)}{/each}</div>
	{#if otherSites.length}
		<details class="more-sites"><summary>More WordPress sites <span aria-hidden="true">↓</span></summary><div class="site-grid">{#each otherSites as item (item.title)}{@render siteCard(item)}{/each}</div></details>
	{/if}
</section>

<section aria-labelledby="ai-heading">
	<div class="section-heading"><h2 id="ai-heading">AI systems &amp; training</h2><p class="muted">Built and taught at Cerebro Creative</p></div>
	<div class="systems">
		<article><div class="system-index">WEB BUILD<SystemGlyph kind="build" /></div><div><h3>Figma to live site with an AI agent</h3><p>For MIP Brands, I directed Claude Code from a supplied Figma design through a WordPress catalogue build, review and launch.</p><p class="system-result">Figma &amp; client assets → Claude Code → WordPress → live site</p><a href="/work/more/mip-brands">See the workflow and decisions →</a></div></article>
		<article><div class="system-index">AGENTS<SystemGlyph kind="agents" /></div><div><h3>Catalogue &amp; studio agents</h3><p>I built and maintain three AI agents, including one that helps keep supermarket product catalogues current.</p><p class="system-result">25 hours saved per week across the three agents</p></div></article>
		<article><div class="system-index">WORKFLOW<SystemGlyph kind="workflow" /></div><div><h3>Content repurposing</h3><p>I built a workflow that helps two FMCG designers repurpose content.</p><p class="system-result">20 hours saved per week between two designers</p></div></article>
		<article><div class="system-index">TRAINING<SystemGlyph kind="training" /></div><div><h3>An AI training programme, built with an agent</h3><p>I directed an AI agent to produce two interactive training decks for a creative team. I set the content and design rules, reviewed the work, and used an automated checker to test the slides.</p><p>The decks use a shared generator and editable settings, so the programme can be rebranded for another client.</p><p class="system-result">75/75 and 49/49 checks passed · Two interactive decks · Reusable starter kit</p><a class="training-thumb" href="/work/ai-training"><img src="/work/ai-training/show-and-tell.webp" width="1920" height="1080" alt="Show and Tell AI training presentation" loading="lazy" /><span>Explore the training and try the lesson →</span></a></div></article>
	</div>
</section>


<section aria-labelledby="creative-heading">
	<div class="section-heading"><h2 id="creative-heading">More creative work</h2><p class="muted">Personal projects and design concepts</p></div>
	<div class="creative-list">
		{#each projects.filter((project) => project.slug !== 'toolmac') as project}
			<article class="creative-item">
				<a class="creative-image" href="/work/{project.slug}"><img src={project.preview} alt="{project.title} project preview" loading="lazy" /></a>
				<div><h3>{project.title}</h3><p>{project.summary}</p>{#if project.role}<p class="creative-role">{project.role}</p>{/if}{#if project.result}<p class="creative-result">{project.result}</p>{/if}<a href="/work/{project.slug}">View case study →</a></div>
			</article>
		{/each}
		<article class="creative-item">
			<a class="creative-image" href="/work/more/mrbuild-landing"><img src="/work/additional/mrbuild-landing.webp" alt="Mr Build landing page design concept" loading="lazy" /></a>
			<div><h3>Mr Build</h3><p>A landing page design concept for a construction and hardware supplier.</p><p class="creative-role">Design concept</p><a href="/work/more/mrbuild-landing">View project →</a></div>
		</article>
	</div>
</section>


<section>
	<h2>Get in touch</h2>
	<p>Email me at <a href="mailto:hello@vedalken.dev">hello@vedalken.dev</a> or find me on <a href="https://www.linkedin.com/in/ml-sayed" target="_blank" rel="noopener">LinkedIn</a>.</p>
	<p><a href="/luqmaan-sayed-cv.pdf" target="_blank" rel="noopener">Download my CV (PDF) ↗</a></p>
</section>

<style>
	a:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; }
	section { margin-top: 3.5rem; scroll-margin-top: 1.5rem; }
	.intro { margin-top: .5rem; padding-bottom: 1.5rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 28%, transparent); }
	.intro .back { margin: 0 0 2.25rem; font-size: .8rem; }
	.intro h1 { max-width: 16ch; margin: 0 0 1rem; font-size: clamp(1.8rem, 5vw, 2.75rem); line-height: 1.15; letter-spacing: -.025em; text-transform: none; }
	.intro-copy { max-width: 56ch; font-size: 1rem; line-height: 1.7; }
	.availability { color: var(--sage); font-size: .8rem; }
	.intro-actions, .jump-links { display: flex; flex-wrap: wrap; gap: 1rem 1.4rem; align-items: center; }
	.intro-actions { margin-top: 1.5rem; }
	.primary-action { padding: .7rem .9rem; border: 1px solid var(--cream); text-decoration: none; }
	.jump-links { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid color-mix(in srgb, var(--cream) 20%, transparent); font-size: .8rem; }
	.jump-links a { text-underline-offset: .25em; }

	h1 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
	.muted { color: #c3c6b9; font-size: 0.72rem; margin: 0 0 1rem; }

	.featured-heading { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: .5rem; margin-bottom: .8rem; }
	.featured-heading h2 { font-size: 1.3rem; margin: 0; }
	.featured-heading p { margin: .2rem 0 0; color: #c3c6b9; font-size: .8rem; }
	.featured-heading > span { color: var(--sage); font-size: .68rem; letter-spacing: .06em; }
	.featured-image { display: block; overflow: hidden; background: var(--charcoal); border: 1px solid color-mix(in srgb, var(--cream) 25%, transparent); }
	.featured-image img { display: block; width: 100%; height: auto; }
	.featured-copy { padding-top: 1rem; max-width: 58ch; }
	.featured-copy p { margin: 0 0 .7rem; }
	.featured-copy .result { color: #e5c09a; font-size: .8rem; }
	.work-links { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; font-size: .85rem; }
	.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding-bottom: 0.65rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 28%, transparent); margin-bottom: 1.5rem; }
	.section-heading h2 { margin: 0; font-size: 1rem; }
	.section-heading > p { margin: 0; }

	.creative-list { display: grid; gap: 1.5rem; }
	.creative-item { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.2rem; align-items: start; padding-bottom: 1.5rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.creative-image { display: block; border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); background: var(--charcoal); }
	.creative-image img { display: block; width: 100%; height: auto; }
	.creative-item h3 { margin: 0 0 .5rem; font-size: 1rem; }
	.creative-item p { color: #d0d1c8; margin: 0 0 .6rem; font-size: .8rem; line-height: 1.6; }
	.creative-item .creative-role { color: var(--sage); }
	.creative-item .creative-result { color: #e5c09a; }
	.creative-item a { font-size: .8rem; }
	@media (max-width: 450px) { .creative-item { grid-template-columns: 1fr; } .section-heading { display: block !important; } .section-heading .muted { margin-top: .4rem; } }
	.systems { border-top: 1px solid color-mix(in srgb, var(--cream) 25%, transparent); }
	.systems article { display: grid; grid-template-columns: minmax(7rem, 10rem) 1fr; gap: 1rem; padding: 1.3rem 0; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.system-index { color: var(--sage); font-size: .7rem; letter-spacing: .05em; }
	.systems h3 { margin: 0 0 .4rem; font-size: .95rem; }
	.systems p { margin: 0 0 .55rem; color: #d0d1c8; font-size: .85rem; line-height: 1.6; }
	.systems .system-result { color: #e5c09a; font-size: .8rem; }
	.systems a { font-size: .8rem; }
	.training-thumb { display: grid; gap: .65rem; margin-top: .9rem; }
	.training-thumb img { display: block; width: min(100%, 22rem); height: auto; border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	@media (max-width: 450px) { .systems article { grid-template-columns: 1fr; gap: .5rem; } }
	.more-sites { margin-top: 1.5rem; border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.more-sites summary { cursor: pointer; padding: 1rem 0; text-decoration: underline; text-underline-offset: .2em; }
	.more-sites[open] .site-grid { margin: .5rem 0 1rem; }
	.more-sites summary:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; }
	.site-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 1.2rem; }
	.site-item { min-width: 0; }
	.site-image { display: block; border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); background: var(--charcoal); }
	.site-image img { display: block; width: 100%; height: auto; aspect-ratio: 8 / 5; object-fit: contain; object-position: top; }
	.site-item h3 { margin: .75rem 0 .3rem; font-size: .95rem; }
	.site-item p { margin: 0 0 .7rem; color: #c3c6b9; font-size: .8rem; line-height: 1.6; }
	.site-item .work-links { font-size: .75rem; }
	@media (max-width: 450px) { .site-grid { grid-template-columns: 1fr; } }
	.figma-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.figma-list li { display: grid; grid-template-columns: 1fr auto; gap: 1.2rem; align-items: start; padding: 1.2rem 0; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.figma-list h3 { margin: 0 0 .3rem; font-size: .9rem; }
	.figma-list p { margin: 0; color: #c3c6b9; font-size: .8rem; }
	.figma-list a { white-space: nowrap; font-size: .8rem; }
	@media (max-width: 420px) { .figma-list li { grid-template-columns: 1fr; gap: .6rem; } }
</style>
