<script lang="ts">
	import { onMount } from 'svelte';
	let { kind }: { kind: 'build' | 'agents' | 'workflow' | 'training' } = $props();
	const diagrams = {
		build: { label: 'Website workflow', steps: ['Figma & assets', 'Agent builds', 'Review & launch'] },
		agents: { label: 'Catalogue agent', steps: ['Product information', 'Agent updates', 'Current catalogue'] },
		workflow: { label: 'Content workflow', steps: ['Source content', 'Repurpose', 'Design team'] },
		training: { label: 'Training programme', steps: ['Set the rules', 'Build the decks', 'Review & teach'] }
	} as const;
	let step = $state(0);
	let clickCount = $state(0);
	let glyph: HTMLButtonElement;
	let lastClick = 0;
	const diagram = $derived(diagrams[kind]);

	function advance() {
		step = (step + 1) % 3;
		clickCount += 1;
		lastClick = Date.now();
	}

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let visible = false;
		const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.25 });
		observer.observe(glyph);
		const timer = window.setInterval(() => {
			if (visible && !document.hidden && !motion.matches && Date.now() - lastClick > 3500) step = (step + 1) % 3;
		}, 2600);
		return () => { observer.disconnect(); window.clearInterval(timer); };
	});
</script>

<button bind:this={glyph} class="glyph" type="button" onclick={advance} aria-label="{diagram.label}: {diagram.steps[step]}. Show next step">
	<svg viewBox="0 0 132 68" aria-hidden="true">
		<path class="track" d="M24 51H108" />
		<circle class="traveller" cx="{24 + step * 42}" cy="51" r="2" />
		{#each [0, 1, 2] as node}
			<g class:active={step === node} transform="translate({24 + node * 42} 25)">
				{#if kind === 'build'}
					{#if node === 0}
						<rect class="surface" x="-12" y="-12" width="24" height="24" /><path d="M-8 -7H-1V0H-8Z M2 -7H8 M2 -3H8 M-8 4H8 M-8 8H3" />
					{:else if node === 1}
						<rect class="surface" x="-12" y="-11" width="24" height="22" /><path d="M-7 -5L-3 -2L-7 1 M0 3H7 M-12 -7H12" />
					{:else}
						<rect class="surface" x="-12" y="-10" width="24" height="20" /><path d="M-12 -5H12 M-8 -7.5H-6 M-7 1L-3 5L5 -3" />
					{/if}
				{:else if kind === 'agents'}
					{#if node === 0}
						<path class="surface" d="M-10 -12H5L10 -7V12H-10Z" /><path d="M5 -12V-7H10 M-6 -3H6 M-6 1H6 M-6 5H2" />
					{:else if node === 1}
						<rect class="surface" x="-10" y="-9" width="20" height="18" /><path d="M-4 -2H-3 M3 -2H4 M-4 4H4 M0 -9V-13 M-14 -3H-10 M10 -3H14" />
					{:else}
						<rect class="surface" x="-11" y="-11" width="22" height="22" /><path d="M-6 -6H-1V-1H-6Z M3 -5H7 M3 -1H7 M-6 4H7 M-6 7H3" />
					{/if}
				{:else if kind === 'workflow'}
					{#if node === 0}
						<path class="surface" d="M-10 -12H5L10 -7V12H-10Z" /><path d="M5 -12V-7H10 M-6 -3H6 M-6 1H6 M-6 5H2" />
					{:else if node === 1}
						<path class="surface" d="M-10 -10H10V10H-10Z" /><path d="M-7 -3H2 M-1 -6L2 -3L-1 0 M7 4H-2 M1 1L-2 4L1 7" />
					{:else}
						<rect class="surface" x="-12" y="-10" width="17" height="19" /><path d="M-8 -6H1 M-8 -2H1 M-8 2H-1 M5 -5H10V11H-5V9" />
					{/if}
				{:else}
					{#if node === 0}
						<rect class="surface" x="-10" y="-12" width="20" height="24" /><path d="M-6 -6L-4 -4L-1 -8 M2 -6H6 M-6 1L-4 3L-1 -1 M2 1H6 M-6 7H6" />
					{:else if node === 1}
						<path class="surface" d="M-11 -9H8V7H-11Z" /><path d="M-7 -5H4 M-7 -1H1 M-7 3H4 M8 -5H11V11H-7V7" />
					{:else}
						<rect class="surface" x="-12" y="-10" width="24" height="17" /><path d="M-7 11H7 M0 7V11 M-7 2L-3 -2L0 1L5 -4 M2 -4H5V-1" />
					{/if}
				{/if}
			</g>
		{/each}
		{#if clickCount > 0}
			{#key clickCount}<rect class="click-signal" x="{9 + step * 42}" y="10" width="30" height="30" rx="1" />{/key}
		{/if}
	</svg>
	<span class="glyph-caption">{diagram.steps[step]}</span>
	<span class="glyph-hint">Tap for next step <span aria-hidden="true">→</span></span>
</button>

<style>
	.glyph { display: grid; justify-items: start; gap: .15rem; width: 100%; max-width: 10rem; padding: .35rem .3rem .4rem; color: #d5daca; background: transparent; border: 1px solid transparent; text-align: left; cursor: pointer; font: inherit; }
	.glyph:hover, .glyph:focus-visible { border-color: #89977a; background: #1b2525; }
	.glyph:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; }
	svg { display: block; width: 100%; max-width: 132px; height: auto; overflow: visible; }
	svg path, svg rect { fill: none; stroke: #a8b499; stroke-width: 1.3; vector-effect: non-scaling-stroke; }
	svg .track { fill: none; stroke: #647364; stroke-dasharray: 2 3; }
	svg .traveller { fill: #79c8bd; transition: cx 500ms cubic-bezier(.16, 1, .3, 1); }
	svg .click-signal { fill: none; stroke: #e5c09a; stroke-width: 1; transform-box: fill-box; transform-origin: center; animation: signal 500ms ease-out both; pointer-events: none; }
	@keyframes signal { from { opacity: .9; transform: scale(.8); } to { opacity: 0; transform: scale(1.45); } }
	svg g { opacity: .55; transition: opacity 180ms ease; }
	svg g.active { opacity: 1; }
	svg .surface { fill: #101719; }
	svg g.active .surface { fill: #203b39; stroke: #79c8bd; }
	svg g.active path:not(.surface) { stroke: #e5c09a; }
	.glyph-caption { color: #d9e2ce; font-size: .75rem; line-height: 1.35; min-height: 1.9em; }
	.glyph-hint { color: #aebda6; font-size: .7rem; line-height: 1.4; text-decoration: underline; text-underline-offset: .2em; }
	@media (prefers-reduced-motion: reduce) { svg g, svg .traveller { transition: none; } svg .click-signal { animation: none; opacity: 0; } }
</style>
