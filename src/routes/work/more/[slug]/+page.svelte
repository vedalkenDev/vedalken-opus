<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const project = $derived(data.project);
</script>

<p class="back"><a href="/work">← Work</a></p>
<h1>{project.title}</h1>
<p class="intro">{project.summary}</p>
{#if project.slug === 'mrbuild-landing'}
	<dl><div><dt>Project</dt><dd>Landing page design concept</dd></div></dl>
{:else if project.slug === 'ffs-refiners'}
	<dl><div><dt>Project</dt><dd>WordPress site build</dd></div></dl>
{:else}
	<dl>
		<div><dt>My contribution</dt><dd>Web design and development</dd></div>
		<div><dt>Collaboration</dt><dd>Cerebro Creative’s senior director</dd></div>
		<div><dt>Platform</dt><dd>WordPress and Divi</dd></div>
	</dl>
{/if}
<figure>
	<img src={project.image} alt="{project.title} website homepage" width="1280" height="800" />
	<figcaption>{project.slug === 'mrbuild-landing' ? 'Landing page concept, captured November 2026.' : 'The live homepage, captured November 2026.'}</figcaption>
</figure>
<p><a href={project.url}>{project.slug === 'mrbuild-landing' ? 'View the concept' : 'Visit the live site'} ↗</a></p>
<p><a href="/work">← More projects</a></p>

<style>
	.back { margin: 0 0 1.5rem; }
	h1 { margin-bottom: 0.5rem; }
	.intro { max-width: 55ch; line-height: 1.6; }
	dl { display: grid; gap: 0.75rem; margin: 1.5rem 0 2rem; }
	dl div { display: grid; grid-template-columns: minmax(8rem, 10rem) 1fr; gap: 1rem; }
	dt { color: var(--sage); } dd { margin: 0; }
	figure { margin: 0; }
	img { display: block; width: 100%; height: auto; border: 1px solid color-mix(in srgb, var(--cream) 24%, transparent); }
	figcaption { color: var(--sage); font-size: 0.75rem; margin-top: 0.5rem; }
	@media (max-width: 420px) { dl div { grid-template-columns: 1fr; gap: 0; } }
</style>
