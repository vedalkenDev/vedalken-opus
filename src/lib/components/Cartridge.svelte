<script lang="ts">
	import { goto } from '$app/navigation';
	import CartShot from '#lib/components/CartShot.svelte';
	import type { Project } from '#lib/projects.ts';

	let { project }: { project: Project } = $props();
	let slotted = $state(false);

	function insert(event: MouseEvent) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		event.preventDefault();
		if (slotted) return;
		slotted = true;
		window.setTimeout(() => {
			goto(`/work/${project.slug}`);
		}, 560);
	}
</script>

<a class="pak" class:slotted href="/work/{project.slug}" onclick={insert}>
	<span class="motion">
		<span class="body">
			<span class="mouth" aria-hidden="true">
				<span class="pins"></span>
			</span>
			<span class="ridges left" aria-hidden="true">
				<span></span><span></span><span></span><span></span>
			</span>
			<span class="ridges right" aria-hidden="true">
				<span></span><span></span><span></span><span></span>
			</span>
			<span class="badge">ARCHIVE</span>
			<span class="window">
				<span class="shot">
					<CartShot cover={project.cover} />
				</span>
				<span class="caption">
					<span class="title">{project.title}</span>
					<span class="year">{project.year}</span>
				</span>
			</span>
			<span class="arrow" aria-hidden="true"></span>
		</span>
	</span>
</a>

<style>
	.pak {
		position: relative;
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 155 / 181;
		font-size: calc(100cqi / 15.5);
		text-decoration: none;
		color: inherit;
		perspective: 900px;
	}

	a.pak:hover,
	a.pak:focus-visible {
		outline: none;
		text-shadow: none;
	}

	.motion {
		display: block;
		width: 100%;
		height: 100%;
		transform-origin: 50% 100%;
		transform: translateY(-1.05em);
		transform-style: preserve-3d;
		transition: transform 0.52s cubic-bezier(0.18, 0.85, 0.22, 1);
	}

	a.pak.slotted .motion {
		transform: translateY(0.48em);
	}

	.body {
		--line: color-mix(in srgb, var(--cream) 22%, transparent);
		position: relative;
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 1.55em 0.95em 1.15em;
		border: 1px solid var(--cream);
		border-radius: 0.45em 0.45em 0.7em 0.7em;
		clip-path: polygon(
			0 0,
			calc(100% - 1.2em) 0,
			calc(100% - 1.2em) 0.82em,
			100% 0.82em,
			100% 100%,
			0 100%
		);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--cream) 10%, var(--charcoal)) 0%,
			var(--charcoal) 36%,
			color-mix(in srgb, #000 32%, var(--charcoal)) 100%
		);
		filter:
			drop-shadow(1px 0 0 var(--coral)) drop-shadow(-1px 0 0 var(--teal))
			drop-shadow(0 0.18em 0 color-mix(in srgb, #000 40%, var(--charcoal)));
		transition: filter 0.42s ease;
	}

	a.pak.slotted .body {
		filter:
			drop-shadow(1px 0 0 var(--coral)) drop-shadow(-1px 0 0 var(--teal))
			drop-shadow(0 0.35em 0 #000);
	}

	.mouth {
		position: absolute;
		top: 0;
		left: 9%;
		right: 1.35em;
		height: 0.72em;
		border: 1px solid var(--line);
		border-top: 0;
		background: var(--ground);
		overflow: hidden;
	}

	.pins {
		display: block;
		height: 100%;
		background: repeating-linear-gradient(
			90deg,
			var(--cream) 0 0.11em,
			var(--charcoal) 0.11em 0.2em
		);
		opacity: 0.72;
		transform: translateY(0.12em);
	}

	a.pak.slotted .pins {
		opacity: 1;
	}

	.ridges {
		position: absolute;
		top: 0.82em;
		display: flex;
		flex-direction: column;
		gap: 0.16em;
		width: 1.05em;
	}

	.ridges span {
		display: block;
		height: 0.16em;
		background: color-mix(in srgb, #000 28%, var(--charcoal));
		border: 1px solid var(--line);
		border-radius: 1px;
	}

	.ridges.left {
		left: 0.55em;
	}

	.ridges.left span {
		transform: skewX(-22deg);
	}

	.ridges.right {
		right: 0.55em;
	}

	.ridges.right span {
		transform: skewX(22deg);
	}

	.badge {
		display: block;
		margin: 0.15em auto 0.55em;
		width: 72%;
		padding: 0.22em 0;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: color-mix(in srgb, #000 22%, var(--charcoal));
		box-shadow: inset 0 1px 2px #000, 0 1px 0 var(--line);
		font-size: 0.55em;
		letter-spacing: 0.22em;
		text-align: center;
		text-indent: 0.22em;
		opacity: 0.7;
	}

	.window {
		display: flex;
		flex-direction: column;
		height: calc(100% - 2.1em);
		padding: 0.4em 0.4em 0.35em;
		border: 1px solid transparent;
		border-radius: 0.4em;
		background:
			linear-gradient(var(--ground), var(--ground)) padding-box,
			var(--visor) border-box;
		box-shadow:
			inset 0 2px 5px #000,
			inset 0 -1px 0 var(--line);
	}

	.shot {
		flex: 1;
		min-height: 0;
		margin: 0;
		padding: 0.28em 0.22em 0.22em;
		border: 1px solid color-mix(in srgb, var(--cream) 16%, transparent);
		background: color-mix(in srgb, var(--cream) 5%, var(--ground));
		overflow: hidden;
	}

	.caption {
		display: flex;
		justify-content: space-between;
		gap: 0.4em;
		align-items: baseline;
		padding-top: 0.25em;
		border-top: 1px solid var(--line);
		font-size: 0.62em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.year {
		opacity: 0.55;
		flex-shrink: 0;
	}

	.arrow {
		position: absolute;
		left: 50%;
		bottom: 0.38em;
		width: 0;
		height: 0;
		border-left: 0.32em solid transparent;
		border-right: 0.32em solid transparent;
		border-top: 0.38em solid var(--line);
		transform: translateX(-50%);
	}

	@media (prefers-reduced-motion: reduce) {
		.motion,
		a.pak.slotted .motion {
			transform: none;
			transition: none;
		}
	}
</style>
