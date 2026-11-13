<script lang="ts">
	import CartShot from '#lib/components/CartShot.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const project = $derived(data.project);
</script>

<p class="back"><a href="/work">← Work</a></p>

<h1>{project.title}</h1>
<p class="year">{project.year}</p>
<div class="cover">
	<CartShot cover={project.cover} />
</div>
{#if project.features?.length}
	<ul class="features">
		{#each project.features as line}
			<li>{line}</li>
		{/each}
	</ul>
{:else}
	<p>{project.summary}</p>
{/if}

{#if project.liveUrl || project.githubUrl}
	<p class="links">
		{#if project.liveUrl}
			<a href={project.liveUrl} rel="noreferrer">Open the generator</a>
		{/if}
		{#if project.githubUrl}
			<a href={project.githubUrl} rel="noreferrer">GitHub</a>
		{/if}
	</p>
{/if}

{#if project.stills?.length}
	<section class="stills" aria-label="Before and after">
		{#each project.stills as shot}
			<figure>
				<div class="pair">
					<img src={shot.before} alt="" />
					<img src={shot.after} alt="" />
				</div>
				<figcaption>{shot.caption}</figcaption>
			</figure>
		{/each}
	</section>
{/if}

<style>
	.back {
		margin: 0 0 1.5rem;
	}

	.year {
		margin: 0 0 1rem;
		opacity: 0.55;
	}

	.cover {
		width: min(20rem, 100%);
		height: 16rem;
		margin: 0 0 1.25rem;
		padding: 0.45rem;
		border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
		background: color-mix(in srgb, var(--cream) 4%, var(--ground));
	}

	.features {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.45rem;
	}

	.features li {
		display: flex;
		gap: 0.55rem;
	}

	.features li::before {
		content: '>';
		opacity: 0.45;
		flex-shrink: 0;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 1rem 0 0;
	}

	.stills {
		margin-top: 2rem;
		display: grid;
		gap: 1.5rem;
	}

	figure {
		margin: 0;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
		padding: 0.35rem;
		border: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
		background: color-mix(in srgb, var(--cream) 4%, var(--ground));
	}

	.pair img {
		width: 100%;
		height: 12rem;
		object-fit: cover;
		display: block;
	}

	figcaption {
		margin-top: 0.45rem;
		font-size: 0.8rem;
		opacity: 0.7;
	}
</style>
