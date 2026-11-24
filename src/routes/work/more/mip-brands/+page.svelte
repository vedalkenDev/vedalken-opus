<p class="back"><a href="/work">← Work</a></p>
<header>
	<h1>From Figma to a live product catalogue</h1>
	<p class="intro">I directed Claude Code to build a WordPress website for MIP Brands, from a supplied Figma design through to launch.</p>
	<p class="meta">My role: creative direction, review and launch</p>
	<p class="at-glance">32 products <span>·</span> 8 working days <span>·</span> WordPress + WooCommerce</p>
	<p><a href="https://mipbrands.co.za/" target="_blank" rel="noopener noreferrer">Visit the live site ↗</a></p>
</header>

<figure class="hero">
	<img src="/work/mip/live-desktop.webp" alt="MIP Brands live homepage on desktop" width="1280" height="800" fetchpriority="high" />
	<figcaption>The live homepage, captured November 2026.</figcaption>
</figure>

<section aria-labelledby="overview">
	<h2 id="overview">The brief</h2>
	<p>Marburg Importers &amp; Prepackers needed a product-catalogue website. I used the supplied Figma design and client assets to direct an AI agent through the build, review and launch.</p>
	<p>The client supplied the design source, logos, product imagery, banners and company copy. The agent wrote the production code; I set the direction, made decisions and reviewed the results.</p>
	<dl class="facts">
		<div><dt>8</dt><dd>working days of active sessions</dd></div>
		<div><dt>32</dt><dd>products in the launch catalogue</dd></div>
		<div><dt>5 + 6</dt><dd>brands and sub-brands</dd></div>
		<div><dt>4</dt><dd>product categories</dd></div>
	</dl>
	<p class="caption">The eight working days were spread between 29 September and 11 November 2026. Product counts describe the launch build.</p>
</section>

<section aria-labelledby="workflow">
	<h2 id="workflow">Figma → Claude Code → live site</h2>
	<p>I used the same workflow across the site: bring together the design and client material, direct the agent to build, then review and correct the result.</p>
	<ol class="flow" aria-label="Website production workflow">
		<li><strong>Figma &amp; assets</strong><span>Design, logos, product images and approved copy</span></li>
		<li><strong>Claude Code</strong><span>Builds layouts, catalogue and supporting scripts</span></li>
		<li><strong>WordPress</strong><span>Divi 5 and WooCommerce, built locally first</span></li>
		<li><strong>Review &amp; launch</strong><span>Responsive checks, SEO, backup and deployment</span></li>
	</ol>
	<p>I chose native Divi components so the client can edit the pages. The build also uses a small amount of site-wide CSS.</p>
</section>

<section aria-labelledby="design-build">
	<h2 id="design-build">From design to site</h2>
	<p>The agent worked from the supplied Figma design. I reviewed its output and directed changes as real client imagery and content replaced the design’s placeholders.</p>
	<div class="comparison">
		<figure><img src="/work/mip/figma-hero.webp" alt="Supplied Figma homepage concept with placeholder content" width="1440" height="900" loading="lazy" /><figcaption>Supplied Figma concept · placeholder content</figcaption></figure>
		<figure><img src="/work/mip/live-desktop.webp" alt="Live MIP Brands homepage on desktop" width="1280" height="800" loading="lazy" /><figcaption>Live website · desktop</figcaption></figure>
	</div>
	<figure class="phone"><img src="/work/mip/live-mobile.webp" alt="Live MIP Brands homepage on a mobile viewport" width="780" height="1688" loading="lazy" /><figcaption>Live website · mobile</figcaption></figure>
</section>

<section aria-labelledby="decisions">
	<h2 id="decisions">Where I directed the work</h2>
	<div class="decisions">
		<article><h3>Changed the building method</h3><p>Browser-based editing was slowed by permission prompts. I switched the agent to generating layouts through scripts, then importing them into WordPress.</p></article>
		<article><h3>Kept it editable</h3><p>When the agent added a custom plugin for category tiles, I asked whether Divi could do the job natively. It could, so the plugin was removed.</p></article>
		<article><h3>Checked the details</h3><p>I reviewed crops, mobile layouts, spacing and content. When banner layouts obscured the copy and button, I rejected two options and chose a full-width banner.</p></article>
		<article><h3>Grounded the copy</h3><p>I required the agent to use client material and public sources for factual claims, rather than inventing brand information.</p></article>
	</div>
</section>

<section aria-labelledby="launch">
	<h2 id="launch">Preparing for launch</h2>
	<p>I directed checks across mobile, tablet, desktop and wider screens. The project history includes 158 screenshots taken during visual review.</p>
	<p>Before launch, the agent checked SEO titles, descriptions, structured data and sitemaps, prepared a privacy policy, and made a full-site backup. I had the backup archives checked and copied to an external drive with matching checksums.</p>
	<details class="launch-notes"><summary>Launch notes and open items</summary>
		<p>After launch, Facebook link previews were blank. The agent tested requests as different social bots and traced the issue to the host blocking Meta’s bots. It prepared a support request; the final resolution is not confirmed here.</p>
		<p>Some product photos were placeholders pending client assets, and unfinished merchandising sections were hidden. A catalogue download button was removed because the PDF was not ready. Analytics and Search Console were not set up at launch.</p>
	</details>
</section>

<section class="next">
	<h2>More AI-directed work</h2>
	<p>See how I directed an agent to build a reusable training programme for a creative team.</p>
	<p><a href="/work/ai-training">Explore the training programme →</a></p>
	<p><a href="/about">About my work →</a></p>
</section>

<style>
	.back { margin: 0 0 1.5rem; }
	header h1 { max-width: 19ch; font-size: clamp(1.65rem, 4.5vw, 2.4rem); line-height: 1.2; letter-spacing: -.025em; text-transform: none; }
	.intro { max-width: 54ch; font-size: 1.1rem; line-height: 1.6; }
	.meta, figcaption, .caption { color: #c3c6b9; font-size: .75rem; }
	.at-glance { color: var(--sage); font-size: .78rem; line-height: 1.7; }
	.at-glance span { color: #e5c09a; }
	a { color: inherit; text-underline-offset: .22em; }
	a:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; }
	section { margin-top: 3.5rem; }
	h2 { font-size: 1.1rem; line-height: 1.35; }
	p { max-width: 65ch; line-height: 1.7; }
	figure { margin: 0; }
	figure img { display: block; width: 100%; height: auto; border: 1px solid color-mix(in srgb, var(--cream) 23%, transparent); }
	figcaption { margin-top: .5rem; line-height: 1.5; }
	.hero { margin-top: 2rem; }
	.facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0 .5rem; padding: 1rem 0; border-block: 1px solid color-mix(in srgb, var(--cream) 25%, transparent); }
	dt { color: #e5c09a; font-size: 1.35rem; font-weight: 700; }
	dd { margin: .25rem 0 0; color: #d0d1c8; font-size: .75rem; line-height: 1.4; }
	.flow { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
	.flow li { padding: .8rem; border: 1px solid color-mix(in srgb, var(--cream) 25%, transparent); }
	.flow strong, .flow span { display: block; }
	.flow strong { color: var(--sage); font-size: .78rem; }
	.flow span { margin-top: .5rem; font-size: .72rem; line-height: 1.5; }
	.comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
	.comparison img { aspect-ratio: 8 / 5; object-fit: contain; object-position: top; background: var(--charcoal); }
	.phone { max-width: 15rem; margin-top: 1.5rem; }
	.decisions { border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.decisions article { display: grid; grid-template-columns: minmax(9rem, 13rem) 1fr; gap: 1rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); padding: 1rem 0; }
	.decisions h3 { font-size: .9rem; margin: 0; color: var(--sage); }
	.decisions p { margin: 0; font-size: .85rem; }
	.launch-notes { margin-top: 1rem; border-block: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.launch-notes summary { padding: .9rem 0; cursor: pointer; text-decoration: underline; text-underline-offset: .2em; }
	.launch-notes summary:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; }
	.next { padding-top: 1rem; border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	@media (max-width: 520px) { .facts, .flow { grid-template-columns: repeat(2, 1fr); } .comparison { grid-template-columns: 1fr; } .decisions article { grid-template-columns: 1fr; gap: .5rem; } }
</style>
