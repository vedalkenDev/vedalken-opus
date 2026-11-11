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
<p>{project.summary}</p>

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
</style>
