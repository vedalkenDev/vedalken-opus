<script lang="ts">
	import Cartridge from '#lib/components/Cartridge.svelte';
	import Contact from '#lib/components/Contact.svelte';
	import Helmet from '#lib/components/Helmet.svelte';
	import Preloader from '#lib/components/Preloader.svelte';
	import WordVideo from '#lib/components/WordVideo.svelte';
	import { projects } from '#lib/projects.ts';
</script>

<Preloader />

<section class="hero" aria-label="ASCII helmet">
	<Helmet />
</section>

<section id="about">
	<h1>About</h1>
	<p>
		Luqmaan Sayed is a web designer and developer based in Durban, transitioning into product. He works on a <WordVideo src="/videos/cosmic.mp4">cosmic</WordVideo> archive, web design, <WordVideo src="/videos/interfaces.mp4">interfaces</WordVideo>, and <WordVideo src="/videos/motion.mp4">motion</WordVideo>.
	</p>
</section>

<section id="work">
	<h1>Projects</h1>
	<ul class="carts">
		{#each projects as project}
			<li>
				<Cartridge {project} />
			</li>
		{/each}
	</ul>
</section>

<Contact />

<style>
	.hero {
		margin: 0 0 3.5rem;
	}

	section[id] {
		scroll-margin-top: 1.5rem;
	}

	p {
		margin: 0;
		max-width: 38rem;
	}

	.carts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.15rem 0.75rem;
		width: 100%;
		margin: 0;
		padding: 1.5rem 0 1.8rem;
		list-style: none;
		perspective: 900px;
		perspective-origin: 50% 30%;
	}

	.carts li {
		position: relative;
		container-type: inline-size;
		transform-style: preserve-3d;
		padding-top: 1.15rem;
		padding-bottom: 0.95rem;
	}

	.carts li :global(.pak) {
		z-index: 1;
	}

	.carts li::after {
		content: '';
		position: absolute;
		left: 10%;
		right: 10%;
		bottom: 0;
		height: 0.95rem;
		z-index: 0;
		border: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
		border-radius: 0 0 0.28rem 0.28rem;
		background: #000;
		box-shadow: inset 0 3px 5px #000;
		pointer-events: none;
	}

	@media (max-width: 720px) {
		.carts {
			grid-template-columns: minmax(0, 15.5rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.carts {
			perspective: none;
		}
	}
</style>
