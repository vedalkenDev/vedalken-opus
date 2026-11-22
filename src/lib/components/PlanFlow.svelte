<script lang="ts">
	import { onMount } from 'svelte';
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
<figure class="flow" bind:this={host} class:visible>
	<figcaption>From drawing to report</figcaption>
	<ol>
		<li><span class="symbol document" aria-hidden="true"><span>PDF</span></span><strong>Upload</strong><span>A drawing</span></li>
		<li><span class="symbol scan" aria-hidden="true"><span></span></span><strong>Check</strong><span>Rules &amp; dimensions</span></li>
		<li><span class="symbol report" aria-hidden="true"><span>✓</span><span>!</span></span><strong>Review</strong><span>Passes &amp; fixes</span></li>
	</ol>
	<p>A simplified view of the workflow. The report supports the architect’s review; it is not municipal approval.</p>
</figure>
<style>
	.flow { margin: 2rem 0; padding: 1rem; border: 1px solid color-mix(in srgb, var(--cream) 28%, transparent); background: color-mix(in srgb, var(--charcoal) 34%, var(--ground)); }
	figcaption { font-weight: 700; font-size: .85rem; padding-bottom: .8rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 20%, transparent); }
	ol { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .6rem; list-style: none; margin: 1.2rem 0 .5rem; padding: 0; }
	li { display: flex; flex-direction: column; align-items: flex-start; gap: .25rem; font-size: .72rem; min-width: 0; color: #c2c7b8; }
	li strong { color: var(--cream); font-size: .8rem; }
	.symbol { width: 3rem; height: 2.5rem; margin-bottom: .45rem; position: relative; display: grid; place-items: center; border: 1px solid var(--amber); color: #dfb990; font-size: .64rem; }
	.scan { overflow: hidden; border-color: var(--teal); background: repeating-linear-gradient(90deg,transparent 0 8px, #3fb6af22 8px 9px); }
	.scan span { position: absolute; inset: 0 auto 0 25%; width: 1px; background: var(--teal); }
	.report { grid-template-columns: 1fr 1fr; color: var(--teal); border-color: var(--sage); }
	.report span:last-child { color: var(--coral); }
	p { margin: 1rem 0 0; color: #c2c7b8; font-size: .72rem; line-height: 1.5; }
	@media (prefers-reduced-motion: no-preference) {
		.visible .scan span { animation: sweep 900ms cubic-bezier(.22, 1, .36, 1) both; }
		@keyframes sweep { from { transform: translateX(0); } to { transform: translateX(1.4rem); } }
	}
</style>
