<script lang="ts">
	const stars = [
		{ x: 2.2, y: 8, s: 2, o: 0.28 },
		{ x: 4.6, y: 16, s: 1, o: 0.18 },
		{ x: 1.4, y: 27, s: 1.5, o: 0.22 },
		{ x: 5.8, y: 41, s: 1, o: 0.14 },
		{ x: 3.1, y: 54, s: 2, o: 0.2 },
		{ x: 6.4, y: 67, s: 1, o: 0.16 },
		{ x: 2.6, y: 79, s: 1.5, o: 0.22 },
		{ x: 96.8, y: 7, s: 1.5, o: 0.24 },
		{ x: 94.2, y: 15, s: 1, o: 0.15 },
		{ x: 97.6, y: 26, s: 2, o: 0.2 },
		{ x: 93.8, y: 39, s: 1, o: 0.16 },
		{ x: 96.1, y: 52, s: 1.5, o: 0.22 },
		{ x: 98.2, y: 64, s: 1, o: 0.14 },
		{ x: 94.8, y: 76, s: 2, o: 0.2 },
		{ x: 97.1, y: 88, s: 1, o: 0.18 }
	];
</script>

<div class="field" aria-hidden="true">
	{#each stars as star}
		<span
			class="star"
			style="left:{star.x}%;top:{star.y}%;width:{star.s}px;height:{star.s}px;opacity:{star.o}"
		></span>
	{/each}
	<span class="ring" style="left:3.2%;top:34%"></span>
	<span class="ring far" style="right:3.6%;top:58%"></span>
	<span class="speck" style="left:5.5%;top:22%"></span>
	<span class="speck" style="right:6%;top:18%"></span>
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.star {
		position: absolute;
		border-radius: 50%;
		background: var(--cream);
		box-shadow: 0 0 6px color-mix(in srgb, var(--teal) 45%, transparent);
	}

	.ring,
	.speck {
		position: absolute;
		border-radius: 50%;
	}

	.ring {
		width: 2.4rem;
		height: 2.4rem;
		border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
		opacity: 0.28;
		box-shadow: inset 0 0 0 0.35rem color-mix(in srgb, var(--violet) 8%, transparent);
	}

	.ring.far {
		width: 1.35rem;
		height: 1.35rem;
		opacity: 0.2;
		border-color: color-mix(in srgb, var(--teal) 35%, transparent);
	}

	.speck {
		width: 0.35rem;
		height: 0.35rem;
		background: color-mix(in srgb, var(--amber) 70%, var(--cream));
		opacity: 0.22;
	}

	@media (max-width: 960px) {
		.field {
			display: none;
		}
	}
</style>
