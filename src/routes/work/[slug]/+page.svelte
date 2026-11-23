<script lang="ts">
	import CosmicArchiveAscii from '#lib/case-studies/cosmic-archive-ascii.svelte';
	import PlanCheck from '#lib/case-studies/plancheck.svelte';
	import Toolmac from '#lib/case-studies/toolmac.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const project = $derived(data.project);
</script>

<p class="back"><a href="/work">← Work</a></p>

<h1>{project.title}</h1>
<p class="year">{project.year}</p>
<p class="overview">{project.summary}</p>
{#if project.role}<p class="role"><strong>My role</strong> · {project.role}</p>{/if}
{#if project.result}<p class="result">{project.result}</p>{/if}
{#if project.liveUrl || project.githubUrl}
	<p class="links">
		{#if project.liveUrl}<a href={project.liveUrl} rel="noreferrer">{project.liveLabel ?? 'Try the generator'}</a>{/if}
		{#if project.githubUrl}<a href={project.githubUrl} rel="noreferrer">GitHub</a>{/if}
	</p>
{/if}
{#if project.slug === 'plancheck'}
	<PlanCheck />
{:else if project.slug === 'toolmac'}
	<Toolmac />
{:else if project.slug === 'ascii-image-generator'}
	<CosmicArchiveAscii />
{:else if project.features?.length}
	<ul class="features">
		{#each project.features as line}
			<li>{line}</li>
		{/each}
	</ul>
{:else}
	<p>{project.summary}</p>
{/if}

{#if project.stills?.length}
	<section class="stills" aria-label="Before and after">
		{#each project.stills as shot}
			<figure>
				<div class="pair">
					<img src={shot.before} alt="" loading="lazy" decoding="async" />
					<img src={shot.after} alt="" loading="lazy" decoding="async" />
				</div>
				<figcaption>{shot.caption}</figcaption>
			</figure>
		{/each}
	</section>
{/if}

<style>

	:global(article) { max-width: 62ch; line-height: 1.65; }
	:global(article h2) { margin: 2rem 0 0.5rem; line-height: 1.2; }
	:global(article dt) { font-weight: bold; }
	:global(article dd) { margin: 0 0 .6rem; }

	.overview { font-size: 1.1rem; line-height: 1.5; max-width: 50ch; }
	.role { color: color-mix(in srgb, var(--cream) 80%, transparent); font-size: 0.85rem; }
	.result { color: #dfb990; }
	.links { margin-bottom: 2rem; }
	:global(article h3) { margin: 1.5rem 0 0.5rem; line-height: 1.3; }
	:global(article p), :global(article li) { line-height: 1.7; }
	:global(article a) { text-underline-offset: 0.2em; }

	.back a, .links a { display: inline-flex; align-items: center; min-height: 44px; }
	.back {
		margin: 0 0 1.5rem;
	}

	.year {
		margin: 0 0 1rem;
		opacity: 0.55;
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
