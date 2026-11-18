<script lang="ts">
	import { books, coverSrc, coverSrcset } from '#lib/shelf.ts';

	const pad = (n: number) => String(n).padStart(3, '0');
</script>

<svelte:head>
	<title>Shelf</title>
</svelte:head>

<header>
	<h1>Shelf</h1>
	<span class="count">{pad(books.length)} {books.length === 1 ? 'volume' : 'volumes'}</span>
</header>

{#if books.length === 0}
	<p class="empty">Nothing on the shelf yet.</p>
{:else}
	<ol>
		{#each books as book, i (book.isbn)}
			{@const src = coverSrc(book)}
			{@const srcset = coverSrcset(book)}
			<li>
				<div class="book">
					<img class="glow" {src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
					<div class="cover">
						<img
							{src}
							{srcset}
							sizes="(max-width: 40rem) 44vw, 13rem"
							alt="{book.title} by {book.author}, cover"
							width="1200"
							height="1800"
							loading={i < 6 ? 'eager' : 'lazy'}
							decoding="async"
						/>
					</div>
				</div>
				<div class="meta">
					<span class="no">No. {pad(i + 1)}</span>
					<span class="title">{book.title}</span>
					<span class="author">{book.author}</span>
				</div>
			</li>
		{/each}
	</ol>
{/if}

<style>
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	header h1 {
		margin: 0;
	}

	.count,
	.no,
	.author,
	.empty {
		color: color-mix(in srgb, var(--cream) 55%, transparent);
	}

	.count,
	.no {
		font-size: 0.7rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
		gap: 2.75rem 1.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-direction: column;
	}

	/* The ledge each book stands on; a row of them reads as a shelf. */
	.book {
		position: relative;
		padding: 0 0.6rem 0.9rem;
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
		perspective: 900px;
	}

	/* Ambient light thrown by the cover's own colours. */
	.glow {
		position: absolute;
		inset: 12% 14% 18%;
		width: 72%;
		height: 70%;
		object-fit: cover;
		filter: blur(26px) saturate(1.4);
		opacity: 0.35;
		transition: opacity 0.4s ease;
		pointer-events: none;
	}

	.cover {
		position: relative;
		aspect-ratio: 2 / 3;
		border-radius: 2px 5px 5px 2px;
		overflow: hidden;
		background: var(--charcoal);
		box-shadow:
			0 1px 0 color-mix(in srgb, var(--cream) 10%, transparent) inset,
			0 14px 22px -10px rgb(0 0 0 / 0.85),
			0 3px 6px rgb(0 0 0 / 0.5);
		transform-origin: left center;
		transition:
			transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
			box-shadow 0.45s ease;
	}

	/* Spine crease and a soft gloss, like light catching a paperback. */
	.cover::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				90deg,
				rgb(0 0 0 / 0.35) 0%,
				rgb(255 255 255 / 0.16) 1.6%,
				rgb(0 0 0 / 0.22) 3.4%,
				transparent 7%
			),
			linear-gradient(115deg, rgb(255 255 255 / 0.1) 0%, transparent 38%);
		pointer-events: none;
	}

	.cover img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-top: 0.75rem;
		font-size: 0.8rem;
		line-height: 1.35;
	}

	.title {
		color: var(--cream);
	}

	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		li:hover .cover {
			transform: translateY(-6px) rotateY(-14deg);
			box-shadow:
				0 1px 0 color-mix(in srgb, var(--cream) 10%, transparent) inset,
				14px 24px 30px -12px rgb(0 0 0 / 0.9),
				0 3px 6px rgb(0 0 0 / 0.5);
		}

		li:hover .glow {
			opacity: 0.6;
		}
	}
</style>
