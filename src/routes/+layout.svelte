<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { metadataFor } from '#lib/metadata.ts';
	import GameMenu from '#lib/components/GameMenu.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const metadata = $derived(metadataFor(page.url.pathname));

	onNavigate((navigation) => {
		if (
			navigation.from?.url.pathname === navigation.to?.url.pathname ||
			!document.startViewTransition ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) return;

		return new Promise<void>((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			// If the browser cannot start a transition, navigation must still continue.
			transition.ready.catch(() => resolve());
		});
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/favicon.png" />
	<title>{metadata.title}</title>
	<meta name="description" content={metadata.description} />
	<link rel="canonical" href={metadata.url} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Luqmaan Sayed · Cosmic Archive" />
	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.description} />
	<meta property="og:url" content={metadata.url} />
	<meta property="og:image" content={metadata.image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Luqmaan Sayed, creative web developer, with a pixel-art space helmet." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.description} />
	<meta name="twitter:image" content={metadata.image} />
	<meta name="twitter:image:alt" content="Luqmaan Sayed, creative web developer, with a pixel-art space helmet." />
</svelte:head>

<Stars />

<div class="site">
	<header>
		<p class="name">Luqmaan Sayed</p>
		<p class="role">Creative web developer</p>
		<nav aria-label="Primary">
			<a href="/">Home</a>
			<a href="/work">Work</a>
			<a href="/shelf">Shelf</a>
			<a href="/about">About</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<GameMenu />

<style>
	:global(main) { view-transition-name: archive-page; }
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) { animation: none; }
	:global(::view-transition-old(archive-page)) { animation: archive-leave 130ms ease-in both; }
	:global(::view-transition-new(archive-page)) { animation: archive-enter 220ms cubic-bezier(.22, 1, .36, 1) both; }
	@keyframes archive-leave { to { opacity: 0; transform: translateY(-4px); } }
	@keyframes archive-enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(archive-page)), :global(::view-transition-new(archive-page)) { animation: none; }
	}

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
				cursor: url('/cursors/default.png') 10 10, auto;
			}

			:global(a[href]) {
				cursor: url('/cursors/pointer.png') 10 10, pointer;
			}

			:global(a[href]:active) {
				cursor: url('/cursors/click.png') 10 10, pointer;
			}

			:global(button),
			:global([type='submit']),
			:global([type='button']),
			:global([role='button']) {
				cursor: url('/cursors/hover.png') 10 10, pointer;
			}

			:global(button:active),
			:global([type='submit']:active),
			:global([type='button']:active),
			:global([role='button']:active) {
				cursor: url('/cursors/click.png') 10 10, pointer;
			}

			:global(input:not([type='submit']):not([type='button']):not([type='checkbox']):not([type='radio'])),
			:global(textarea),
			:global([contenteditable='true']),
			:global(main p) {
				cursor: url('/cursors/text.png') 6 10, text;
			}

			:global(img),
			:global(canvas) {
				cursor: url('/cursors/highlight.png') 15 15, crosshair;
			}

			:global(a.pak),
			:global(a.pak *) {
				cursor: url('/cursors/grab.png') 10 10, grab;
			}

			:global(a.pak:active),
			:global(a.pak:active *) {
				cursor: url('/cursors/grabbing.png') 10 10, grabbing;
			}

			:global(html :disabled),
			:global(html [aria-disabled='true']) {
				cursor: url('/cursors/disabled.png') 10 10, not-allowed;
			}

			:global([aria-busy='true']) {
				cursor: url('/cursors/wait.png') 10 10, wait;
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
		margin: 0.25rem 0 1.15rem;
		font-size: clamp(1.2rem, 3.5vw, 1.7rem);
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.02em;
		color: var(--cream);
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
