<script lang="ts">
	import { onMount } from 'svelte';
	let { title, sources, destination, note }: { title: string; sources: string[]; destination: string; note: string } = $props();
	let host: HTMLElement;
	let visible = $state(false);
	onMount(() => {
		if (!('IntersectionObserver' in window)) { visible = true; return; }
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) { visible = true; observer.disconnect(); }
		}, { threshold: 0.15 });
		observer.observe(host);
		return () => observer.disconnect();
	});
</script>
<figure class="route" bind:this={host} class:visible>
	<figcaption>{title}</figcaption>
	<div class="routing">
		<ul>{#each sources as source}<li><span aria-hidden="true">▸</span> {source}</li>{/each}</ul>
		<span class="connector" aria-hidden="true"><span></span></span>
		<div class="destination"><span aria-hidden="true">●</span> {destination}</div>
	</div>
	<p>{note}</p>
</figure>
<style>
	.route { margin: 2rem 0; padding: 1rem; border: 1px solid color-mix(in srgb,var(--cream) 28%,transparent); background: color-mix(in srgb,var(--charcoal) 34%,var(--ground)); }
	figcaption { padding-bottom: .8rem; border-bottom: 1px solid color-mix(in srgb,var(--cream) 20%,transparent); font-size: .85rem; font-weight: 700; }
	.routing { display: grid; grid-template-columns: minmax(0,1fr) 3rem minmax(0,1fr); align-items: center; padding: 1.2rem 0 .5rem; }
	ul { list-style: none; padding: 0; margin: 0; display: grid; gap: .45rem; }
	li,.destination { font-size: .75rem; line-height: 1.45; }
	li span { color: var(--amber); }
	.destination { border: 1px solid color-mix(in srgb,var(--teal) 65%,transparent); padding: .7rem; color: var(--cream); }
	.destination span { color: var(--teal); }
	.connector { height: 1px; background: color-mix(in srgb,var(--cream) 35%,transparent); position: relative; }
	.connector span { position: absolute; right: 0; top: -2px; width: 5px; height: 5px; background: var(--teal); }
	p { color: #c2c7b8; font-size: .72rem; line-height: 1.5; margin: .8rem 0 0; }
	@media(prefers-reduced-motion:no-preference) { .visible .connector span { animation: travel 750ms cubic-bezier(.22,1,.36,1) both; } @keyframes travel { from { transform: translateX(-2.7rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } } }
	@media(max-width:380px) { .routing { grid-template-columns: minmax(0,1fr) 1rem minmax(0,1fr); } }
</style>
