<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { src, children, image = false, project = false, poster }: { src: string; children: Snippet; image?: boolean; project?: boolean; poster?: string } = $props();

	let on = $state(false);
	let x = $state(0);
	let y = $state(0);
	let video: HTMLVideoElement | undefined = $state();
	// Touch and reduced-motion visitors never see the clip, so they never download it.
	let armed = $state(false);

	function allowed() {
		return (
			window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	onMount(() => {
		if (!allowed() || image) return;
		// Fetch after the page settles so first hover still plays at once.
		const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
		const cancel = window.cancelIdleCallback ?? window.clearTimeout;
		const id = idle(() => (armed = true));
		return () => cancel(id);
	});

	function showAt(clientX: number, clientY: number) {
		if (!allowed()) return;
		on = true;
		x = clientX;
		y = clientY;
		if (!video) return;
		if (!armed) {
			// Hovered before idle fired. Set src now so play() below has data to load.
			armed = true;
			video.src = src;
		}
		try {
			video.currentTime = 0;
		} catch {
			/* not seekable until data arrives */
		}
		video.muted = true;
		const play = video.play();
		if (play) play.catch(() => {});
	}

	function enter(event: MouseEvent) {
		showAt(event.clientX, event.clientY);
	}

	function move(event: MouseEvent) {
		if (!on) return;
		x = event.clientX;
		y = event.clientY;
	}

	function leave() {
		on = false;
		if (!video) return;
		video.pause();
		try {
			video.currentTime = 0;
		} catch {
			/* ignore */
		}
	}
</script>

<span class="wrap"
	><!-- svelte-ignore a11y_no_static_element_interactions (The preview is decorative and provides no additional content.) --><span
		class="word"
		onmouseenter={enter}
		onmousemove={move}
		onmouseleave={leave}>{@render children()}</span
	>{#if image}
		<img
			class="float project"
			class:show={on}
			style:left="{x}px"
			style:top="{y}px"
			{src}
			alt=""
			aria-hidden="true"
		/>
	{:else}<video
		bind:this={video}
		class="float"
		class:project
		class:show={on}
		style:left="{x}px"
		style:top="{y}px"
		src={armed ? src : undefined}
		muted
		loop
		playsinline
		{poster}
		preload={armed ? 'auto' : 'none'}
		aria-hidden="true"
	></video>{/if}</span
>

<style>
	.wrap {
		display: inline;
	}

	.word {
		font: inherit;
		color: inherit;
	}

	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
		.word { border-bottom: 1px dotted currentColor; }
	}

	.float {
		position: fixed;
		z-index: 30;
		width: 10rem;
		height: auto;
		margin: 0;
		pointer-events: none;
		transform: translate(-50%, 18px);
		mix-blend-mode: screen;
		border: 1px solid var(--cream);
		opacity: 0;
		visibility: hidden;
	}

	.float.project {
		width: min(20rem, 70vw);
		aspect-ratio: 16 / 9;
		object-fit: contain;
		background: var(--ground);
		mix-blend-mode: normal;
	}

	.float.show {
		opacity: 1;
		visibility: visible;
	}
</style>
