<script lang="ts">
	let { title, facts, note }: { title: string; facts: { value: string; label: string }[]; note: string } = $props();
</script>
<figure class="facts">
	<figcaption>{title}</figcaption>
	<dl>{#each facts as fact}<div><dt>{fact.value}</dt><dd>{fact.label}</dd></div>{/each}</dl>
	<p>{note}</p>
</figure>
<style>
	.facts { margin: 2rem 0; padding: 1rem; border: 1px solid color-mix(in srgb,var(--cream) 28%,transparent); background: color-mix(in srgb,var(--charcoal) 34%,var(--ground)); }
	figcaption { padding-bottom: .8rem; border-bottom: 1px solid color-mix(in srgb,var(--cream) 20%,transparent); font-size: .85rem; font-weight: 700; }
	dl { display: grid; grid-template-columns: repeat(auto-fit,minmax(7rem,1fr)); gap: .7rem; margin: 1.1rem 0 .5rem; }
	dl div { padding: .2rem .5rem .2rem 0; }
	dt { color: #dfb990; font-size: 1.4rem; font-weight: 700; font-variant-numeric: tabular-nums; }
	dd { margin: .15rem 0 0; color: #d4d3c9; font-size: .72rem; line-height: 1.4; }
	p { color: #c2c7b8; font-size: .72rem; line-height: 1.5; margin: .9rem 0 0; }
</style>
