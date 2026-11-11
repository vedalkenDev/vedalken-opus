<script lang="ts">
	import { projects } from '#lib/projects.ts';
</script>

<h1>Work</h1>

<ul>
	{#each projects as project}
		<li>
			<a href="/work/{project.slug}">{project.title}</a>
			<span class="year">{project.year}</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		border-top: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
		padding: 0.65rem 0;
	}

	li:last-child {
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
	}

	.year {
		opacity: 0.55;
	}
</style>
