<script lang="ts">
	import { onMount } from 'svelte';

	let { title, before, after, unit, context }: {
		title: string; before: number; after: number; unit: string; context: string;
	} = $props();

	let host: HTMLElement;
	let visible = $state(false);
	onMount(() => {
		if (!('IntersectionObserver' in window)) { visible = true; return; }
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				visible = true;
				observer.disconnect();
			}
		}, { threshold: 0.15 });
		observer.observe(host);
		return () => observer.disconnect();
	});
</script>

<figure class="metric" bind:this={host} class:visible>
	<figcaption><span>{title}</span><span class="unit">{unit} · lower is better</span></figcaption>
	<div class="chart" aria-label="{title}. Before: {before} {unit}. After: {after} {unit}.">
		<div class="row">
			<span class="label">Before</span>
			<div class="track"><span class="bar before" style:--size="100%"></span></div>
			<strong>{before}</strong>
		</div>
		<div class="row">
			<span class="label">After</span>
			<div class="track"><span class="bar after" style:--size="{after / before * 100}%"></span></div>
			<strong>{after}</strong>
		</div>
	</div>
	<p>{context}</p>
</figure>

<style>
	.metric { margin: 2rem 0; padding: 1rem; border: 1px solid color-mix(in srgb, var(--cream) 28%, transparent); background: color-mix(in srgb, var(--charcoal) 34%, var(--ground)); }
	figcaption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .35rem 1rem; padding-bottom: .8rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 20%, transparent); font-weight: 700; font-size: .85rem; }
	.unit { color: #c2c7b8; font-weight: 400; font-size: .7rem; }
	.chart { display: grid; gap: .7rem; padding: 1.2rem 0 .6rem; }
	.row { display: grid; grid-template-columns: 4.5rem minmax(0,1fr) 3.7rem; align-items: center; gap: .7rem; font-size: .78rem; }
	.label { color: #d4d3c9; }
	strong { text-align: right; font-variant-numeric: tabular-nums; }
	.track { height: .8rem; background: color-mix(in srgb, var(--cream) 8%, transparent); }
	.bar { display: block; width: var(--size); height: 100%; transform-origin: left; }
	.before { background: var(--amber); }
	.after { background: var(--teal); }
	p { margin: .65rem 0 0; color: #c2c7b8; font-size: .72rem; line-height: 1.5; }
	@media (prefers-reduced-motion: no-preference) {
		.visible .bar { animation: draw 650ms cubic-bezier(.22, 1, .36, 1) both; }
		.visible .after { animation-delay: 120ms; }
		@keyframes draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
	}
	@media(max-width: 380px) { .metric { padding: .75rem; } .row { grid-template-columns: 3.5rem minmax(0,1fr) 3.3rem; gap: .4rem; } }
</style>
