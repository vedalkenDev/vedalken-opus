<script module lang="ts">
	let played = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	const TARGET = 'COSMIC ARCHIVE';
	const GLYPHS = '░▒▓█/<>-_=+*#@\\|';

	let out = $state(played);
	let line = $state(TARGET);

	function dismiss() {
		played = true;
		out = true;
	}

	onMount(() => {
		if (played) {
			out = true;
			return;
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			dismiss();
			return;
		}

		let i = 0;
		const id = setInterval(() => {
			i += 1;
			const reveal = Math.min(TARGET.length, Math.floor(i / 2));
			line = TARGET.split('')
				.map((ch, idx) => {
					if (ch === ' ') return ' ';
					if (idx < reveal) return ch;
					return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
				})
				.join('');

			if (reveal >= TARGET.length && i > TARGET.length * 2 + 6) {
				clearInterval(id);
				line = TARGET;
				setTimeout(dismiss, 240);
			}
		}, 42);

		const failsafe = setTimeout(dismiss, 1800);

		return () => {
			clearInterval(id);
			clearTimeout(failsafe);
		};
	});
</script>

<div class="preloader" class:out aria-hidden="true">
	<pre class="frame">
+==================================+
|                                  |
|          {line}          |
|          --------------          |
|          luqmaan sayed           |
|                                  |
+==================================+</pre>
</div>

<style>
	.preloader {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		background: var(--ground);
		color: var(--cream);
		pointer-events: none;
		animation: lift 1.8s ease 0.15s forwards;
	}

	.preloader.out {
		opacity: 0;
		visibility: hidden;
		animation: none;
	}

	.frame {
		margin: 0;
		font: 14px/1.45 ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
		letter-spacing: 0.04em;
		text-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
		animation: jitter 90ms steps(2, end) infinite;
	}

	@keyframes jitter {
		0% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(1px, -0.5px);
		}
		100% {
			transform: translate(-1px, 0.5px);
		}
	}

	@keyframes lift {
		0%,
		72% {
			opacity: 1;
			visibility: visible;
		}
		100% {
			opacity: 0;
			visibility: hidden;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.preloader {
			display: none;
		}
	}
</style>
