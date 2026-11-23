<script lang="ts">
	import { projects } from '#lib/projects.ts';
</script>

<h1>Work</h1>
<ul>
	{#each projects as project}
		<li>
			<a href="/work/{project.slug}">{project.title}</a>
			<span class="summary">{project.summary}</span>
			{#if project.result}<span class="result">{project.result}</span>{/if}
		</li>
	{/each}
</ul>
<h2>More work</h2>
<ul><li><a href="/work/earlier">Earlier web work</a><span class="summary">Bargain Xpress, Bargain Wholesalers and MIP Brands.</span></li><li><a href="/#work">AI agents &amp; studio tools</a></li></ul>

<style>
	h2 { margin-top: 2.5rem; font-size: 1rem; }
	ul { margin: 0; padding: 0; list-style: none; border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	li { display: grid; gap: 0.2rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); padding: 0.9rem 0; }
	a { width: fit-content; font-weight: 700; text-underline-offset: 0.2em; }
	.summary { color: color-mix(in srgb, var(--cream) 75%, transparent); font-size: 0.85rem; }
	.result { color: #dfb990; font-size: 0.8rem; }
</style>
