<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { books, coverSrc, coverSrcset, filterKeys, optionsFor, type FilterKey } from '#lib/shelf.ts';

	let hydrated = $state(false);
	onMount(() => { hydrated = true; });
	const groups = filterKeys.map(key => ({ key, options: optionsFor(key) }));
	const selected = $derived(groups.map(({ key, options }) => {
		const value = hydrated ? page.url.searchParams.get(key) : '';
		return value && options.includes(value) ? value : '';
	}));
	const visible = $derived(books.filter(book =>
		groups.every(({ key }, i) => !selected[i] || book[key] === selected[i])
	));

	function updateFilter(key?: FilterKey, value = '') {
		const url = new URL(page.url.href);
		if (!key) {
			for (const name of filterKeys) url.searchParams.delete(name);
		} else if (value) {
			url.searchParams.set(key, value);
		} else {
			url.searchParams.delete(key);
		}
		void goto(url, { reset: false });
	}
	let revealed = $state<string | null>(null);
	let loadedCovers = $state<Set<string>>(new Set());
	let failedCovers = $state<Set<string>>(new Set());
	function loadAscii(isbn: string) {
		if (!loadedCovers.has(isbn)) loadedCovers = new Set([...loadedCovers, isbn]);
	}
	// A short-lived radial wave, with a fresh irregular edge for every crossing.
	function coverWave(node: HTMLElement) {
		let frame = 0;
		let delay: ReturnType<typeof setTimeout> | undefined;
		let hovered = false;
		let waiting = false;
		let progress = 0;
		let entry = { x: 0, y: 0 };
		const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const point = (event: PointerEvent) => {
			const r = node.getBoundingClientRect();
			return { x: Math.max(0, Math.min(r.width, event.clientX - r.left)), y: Math.max(0, Math.min(r.height, event.clientY - r.top)) };
		};
		function animate(origin: { x: number; y: number }, opening: boolean) {
			cancelAnimationFrame(frame);
			if (reduce()) {
				progress = opening ? 1 : 0;
				node.style.setProperty('--wave', opening ? 'none' : 'circle(0px at 0 0)');
				return;
			}
			const width = node.clientWidth, height = node.clientHeight;
			const radius = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) * 1.35;
			const seed = Math.random() * Math.PI * 2;
			const frequency = 3 + Math.floor(Math.random() * 3);
			const initial = progress;
			let start: number | undefined;
			const draw = (now: number) => {
				start ??= now;
				const t = Math.min(1, (now - start) / (opening ? 750 : 430));
				const eased = 1 - Math.pow(1 - t, 3);
				progress = opening ? initial + (1 - initial) * eased : initial * (1 - eased);
				if (opening && t === 1) node.style.setProperty('--wave', 'none');
				else {
					const coords = Array.from({ length: 64 }, (_, i) => {
						const a = i * Math.PI * 2 / 64;
						const ripple = 1 + .075 * Math.sin(a * frequency + seed + t * 2) + .035 * Math.sin(a * (frequency + 3) - seed);
						const r = radius * progress * ripple;
						return `${(origin.x + Math.cos(a) * r).toFixed(1)}px ${(origin.y + Math.sin(a) * r).toFixed(1)}px`;
					});
					node.style.setProperty('--wave', `polygon(${coords.join(',')})`);
				}
				if (t < 1) frame = requestAnimationFrame(draw);
			};
			frame = requestAnimationFrame(draw);
		}
		function enter(event: PointerEvent) {
			if (event.pointerType === 'touch') return;
			hovered = true;
			if (delay) clearTimeout(delay);
			entry = point(event);
			const image = node.querySelector<HTMLImageElement>('.ascii-cover');
			if (image?.complete && image.naturalWidth) animate(entry, true);
			else waiting = true;
		}
		function loaded(event: Event) {
			if (waiting && hovered && (event.target as Element).classList.contains('ascii-cover')) {
				waiting = false;
				animate(entry, true);
			}
		}
		function leave(event: PointerEvent) {
			if (event.pointerType === 'touch') return;
			hovered = false;
			waiting = false;
			cancelAnimationFrame(frame);
			const exit = point(event);
			delay = setTimeout(() => animate(exit, false), reduce() ? 0 : 250);
		}
		node.addEventListener('pointerenter', enter);
		node.addEventListener('pointerleave', leave);
		node.addEventListener('load', loaded, true);
		return { destroy() { cancelAnimationFrame(frame); if (delay) clearTimeout(delay); node.removeEventListener('pointerenter', enter); node.removeEventListener('pointerleave', leave); node.removeEventListener('load', loaded, true); } };
	}

	const pad = (n: number) => String(n).padStart(3, '0');
</script>

<header>
	<div><h1>My library</h1><p>Books I own, collected here on my shelf.</p><p class="hint">Hover to reveal ASCII. Tap or press a cover to see it in full.</p></div>
	<span class="count" aria-live="polite">{visible.length} of {books.length} books shown</span>
</header>

{#if books.length === 0}
	<p class="empty">Nothing on the shelf yet.</p>
{:else}
	<p class="filter-heading">Browse the collection</p>
	<div class="filters" role="group" aria-label="Filter my library">
		{#each groups as group, i (group.key)}
			<label>
				{group.key}
				<select value={selected[i]} onchange={(e) => updateFilter(group.key, e.currentTarget.value)}>
					<option value="">All {group.key === 'category' ? 'categories' : group.key === 'author' ? 'authors' : 'series'}</option>
					{#each group.options as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>
		{/each}
		{#if selected.some(Boolean)}
			<button class="clear-filters" onclick={() => updateFilter()}>Clear filters ×</button>
		{/if}
	</div>
	{#if !visible.length}
		<p class="empty" role="status">No books match these filters. Try a different combination or clear the filters.</p>
	{/if}
	<ol>
		{#each visible as book, i (book.isbn)}
			{@const src = coverSrc(book)}
			{@const srcset = coverSrcset(book)}
			<li>
				<div class="book">
					<img class="glow" {src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
					<button class="cover" class:revealed={revealed === book.isbn} use:coverWave type="button" aria-label="Toggle ASCII cover for {book.title}" aria-pressed={revealed === book.isbn} onpointerenter={() => loadAscii(book.isbn)} onfocus={() => loadAscii(book.isbn)} onclick={(event) => { if (event.detail === 0 || !window.matchMedia('(hover: hover)').matches) { loadAscii(book.isbn); revealed = revealed === book.isbn ? null : book.isbn; } }}>
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
						{#if loadedCovers.has(book.isbn) && !failedCovers.has(book.isbn)}<img class="ascii-cover" src={src.replace('-600.webp', '-ascii.webp?look=visor')} alt="" aria-hidden="true" decoding="async" onerror={() => { failedCovers = new Set([...failedCovers, book.isbn]); revealed = null; }} />{/if}
						{#if failedCovers.has(book.isbn)}<span class="cover-error">ASCII cover unavailable</span>{/if}
					</button>
				</div>
				<div class="meta">
					<span class="no">No. {pad(books.indexOf(book) + 1)}</span>
					<span class="title">{book.title}</span>
					<span class="author">{book.author}</span>
					{#if book.category}<span class="book-category">{book.category}{#if book.series && book.seriesNo} · {book.series} {book.seriesNo}{/if}</span>{/if}
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
		padding-bottom: 1.35rem;
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 24%, transparent);
	}

	header h1 {
		margin: 0;
		font-size: clamp(1.35rem, 3vw, 1.8rem);
		letter-spacing: .01em;
	}
	header p { margin: .6rem 0 0; max-width: 40ch; color: #c3c6b9; line-height: 1.5; }
	header .hint { font-size: .75rem; color: #b6c5a5; }
	@media (max-width: 520px) { header { display: block; margin-bottom: 1.25rem; padding-bottom: 1rem; } .count { display: block; margin-top: .65rem; } .filter-heading { margin-bottom: .55rem; } .filters { margin-bottom: 1.25rem; } }

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

	.filter-heading { margin: 0 0 .8rem; color: var(--cream); font-size: .85rem; font-weight: 700; }
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.filters label { flex: 1 1 9rem; min-width: 0; }
	label {
		display: grid;
		gap: 0.35rem;
		max-width: 100%;
		text-transform: capitalize;
		font-size: 0.8rem;
	}
	select, button {
		font: inherit;
		color: var(--cream);
		background: var(--charcoal);
		border: 1px solid color-mix(in srgb, var(--cream) 40%, transparent);
		padding: 0.5rem;
		min-height: 2.5rem;
		max-width: 100%;
	}
	.clear-filters { color: var(--cream); border-color: var(--sage); cursor: pointer; }
	.clear-filters:hover { background: #27332f; }
	.filters select { box-sizing: border-box; width: 100%; min-width: 0; }
	ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(10.5rem, calc(50% - 0.5rem)), 1fr));
		gap: 2.75rem 1rem;
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
		border-bottom: 2px solid color-mix(in srgb, var(--cream) 30%, transparent);
		box-shadow: 0 5px 0 -3px color-mix(in srgb, var(--amber) 50%, transparent);
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
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		cursor: pointer;
		aspect-ratio: 2 / 3;
		border-radius: 2px 5px 5px 2px;
		overflow: hidden;
		background: var(--charcoal);
		box-shadow:
			0 1px 0 color-mix(in srgb, var(--cream) 10%, transparent) inset,
			0 14px 22px -10px rgb(0 0 0 / 0.85),
			0 3px 6px rgb(0 0 0 / 0.5);
		transform-origin: left center;
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
	.cover .ascii-cover {
		position: absolute; inset: 0; pointer-events: none;
		clip-path: var(--wave, circle(0px at 0 0));
	}
	.cover-error { position: absolute; inset: auto .4rem .4rem; padding: .4rem; background: #080e10; color: #f4f3e8; font-size: .7rem; z-index: 2; }
	@media (hover: hover) {
		.cover:hover, .cover:hover img { cursor: none; }
	}
	.cover.revealed .ascii-cover { clip-path: none; }
	.cover:focus-visible, select:focus-visible, .filters button:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; }

	@media (prefers-reduced-motion: reduce) { .cover, .glow, .cover .ascii-cover { transition: none; } }

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-top: 0.75rem;
		font-size: 0.8rem;
		line-height: 1.35;
	}

	.book-category { color: var(--sage); font-size: .7rem; margin-top: .25rem; }
	.title {
		color: var(--cream);
	}

	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		li:hover .glow {
			opacity: 0.6;
		}
	}
</style>
