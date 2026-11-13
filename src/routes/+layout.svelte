<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import GameMenu from '#lib/components/GameMenu.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Luqmaan Sayed</title>
</svelte:head>

<Stars />

<div class="site">
	<header>
		<p class="name">Luqmaan Sayed</p>
		<p class="role">web designer and developer</p>
		<nav aria-label="Primary">
			<a href="/">Home</a>
			<a href="/work">Work</a>
			<a href="/about">About</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<GameMenu />

<style>
	:global(:root) {
		--ground: #050508;
		--charcoal: #242a30;
		--cream: #f4f3e8;
		--violet: #592aa4;
		--blue: #4277a2;
		--teal: #3fb6af;
		--sage: #939e7a;
		--amber: #c18d5d;
		--coral: #d96350;
		--visor: linear-gradient(
			90deg,
			#592aa4 0%,
			#4277a2 20%,
			#3fb6af 40%,
			#939e7a 60%,
			#c18d5d 80%,
			#d96350 100%
		);
	}

	:global(html) {
		background: var(--ground);
		color: var(--cream);
		color-scheme: dark;
	}

	:global(body) {
		margin: 0;
		font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
		font-size: 15px;
		line-height: 1.6;
	}

	@media (hover: hover) and (pointer: fine) {
		@media (prefers-reduced-motion: no-preference) {
			:global(html) {
				cursor: url('/cursors/default.png') 1 1, auto;
			}

			:global(a[href]) {
				cursor: url('/cursors/pointer.png') 6 1, pointer;
			}

			:global(a[href]:active) {
				cursor: url('/cursors/click.png') 2 2, pointer;
			}

			:global(button),
			:global([type='submit']),
			:global([type='button']),
			:global([role='button']) {
				cursor: url('/cursors/hover.png') 1 1, pointer;
			}

			:global(button:active),
			:global([type='submit']:active),
			:global([type='button']:active),
			:global([role='button']:active) {
				cursor: url('/cursors/click.png') 2 2, pointer;
			}

			:global(input:not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio'])),
			:global(textarea),
			:global([contenteditable='true']),
			:global(main p) {
				cursor: url('/cursors/text.png') 3 7, text;
			}

			:global(img),
			:global(canvas) {
				cursor: url('/cursors/highlight.png') 11 9, crosshair;
			}

			:global(a.pak),
			:global(a.pak *) {
				cursor: url('/cursors/grab.png') 9 8, grab;
			}

			:global(a.pak:active),
			:global(a.pak:active *) {
				cursor: url('/cursors/grabbing.png') 8 6, grabbing;
			}

			:global(html :disabled),
			:global(html [aria-disabled='true']) {
				cursor: url('/cursors/disabled.png') 8 8, not-allowed;
			}
		}
	}

	:global(::selection) {
		background: var(--cream);
		color: var(--charcoal);
	}

	.site {
		position: relative;
		z-index: 1;
		max-width: 42rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 5rem;
	}

	header {
		margin-bottom: 2.5rem;
	}

	.name {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.role {
		margin: 0.25rem 0 1rem;
		opacity: 0.7;
	}

	nav {
		display: flex;
		gap: 1rem;
	}

	nav a,
	main :global(a) {
		color: inherit;
	}

	nav a:hover,
	main :global(a:hover) {
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	main :global(h1) {
		margin: 0 0 0.75rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	main :global(section + section) {
		margin-top: 3rem;
	}
</style>
