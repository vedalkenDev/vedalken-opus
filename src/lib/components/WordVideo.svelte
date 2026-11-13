<script lang="ts">
	import type { Snippet } from 'svelte';

	let { src, children }: { src: string; children: Snippet } = $props();

	let on = $state(false);
	let x = $state(0);
	let y = $state(0);
	let video: HTMLVideoElement | undefined = $state();

	function allowed() {
		return (
			window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function showAt(clientX: number, clientY: number) {
		if (!allowed()) return;
		on = true;
		x = clientX;
		y = clientY;
		video?.play().catch(() => {});
	}

	function enter(event: MouseEvent) {
		showAt(event.clientX, event.clientY);
	}

	function move(event: MouseEvent) {
		if (!on) return;
		x = event.clientX;
		y = event.clientY;
	}

	function focus(event: FocusEvent) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		showAt(rect.left + rect.width / 2, rect.top);
	}

	function leave() {
		on = false;
		video?.pause();
	}
</script>

<span class="wrap"
	><span
		class="word"
		role="button"
		tabindex="0"
		onmouseenter={enter}
		onmousemove={move}
		onmouseleave={leave}
		onfocus={focus}
		onblur={leave}>{@render children()}</span
	><video
		bind:this={video}
		class="float"
		class:show={on}
		style:left="{x}px"
		style:top="{y}px"
		{src}
		muted
		loop
		playsinline
		preload="metadata"
		aria-hidden="true"
	></video></span
>

<style>
	.wrap {
		display: inline;
	}

	.word {
		border-bottom: 1px dotted currentColor;
		font: inherit;
		color: inherit;
	}

	.float {
		display: none;
		position: fixed;
		z-index: 30;
		width: 10rem;
		height: auto;
		margin: 0;
		pointer-events: none;
		transform: translate(-50%, -120%);
		mix-blend-mode: screen;
		border: 1px solid var(--cream);
	}

	.float.show {
		display: block;
	}
</style>
