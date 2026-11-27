<script lang="ts">
	import AgentArchive from '#lib/components/AgentArchive.svelte';
	import Arcade from '#lib/components/Arcade.svelte';
	import Contact from '#lib/components/Contact.svelte';
	import Helmet from '#lib/components/Helmet.svelte';
	import Preloader from '#lib/components/Preloader.svelte';
	import WordVideo from '#lib/components/WordVideo.svelte';
	import { projects } from '#lib/projects.ts';

	let arcade: Arcade | undefined = $state();
	let arcadeOpen = $state(false);
</script>

<Preloader />

<section id="about">
	<p>I design and build websites in Durban, from first sketch to launch. I’m also building <a class="intro-link" href="/work/plancheck">PlanCheck</a>, a tool for checking architectural drawings against SANS 10400.</p>
	<p>This is my <WordVideo src="/videos/cosmic-archive.mp4">cosmic archive</WordVideo> of websites, <WordVideo src="/work/ascii-image-generator/cells-80-columns.webp" image project>interfaces</WordVideo> and <WordVideo src="/videos/plancheck-preview.mp4" poster="/videos/plancheck-preview.webp" project>motion</WordVideo>.</p>
</section>
<section class="hero" aria-label="ASCII helmet"><Helmet onactivate={(canvas) => arcade?.activate(canvas)} asleep={arcadeOpen} /></section>

<section id="work">
	<h2>Projects</h2>
	<ul class="projects">
		{#each [...projects].sort((a, b) => Number(b.slug === 'plancheck') - Number(a.slug === 'plancheck')) as project}
			<li>
				<a class="project" href="/work/{project.slug}">
					<span class="project-copy">
						<span class="project-title">{project.title}</span>
						<span class="project-summary">{project.summary}</span>
						{#if project.role}<span class="project-role"><span class="meta-label">Role</span> {project.role}</span>{/if}
						{#if project.result}<span class="project-result"><span class="meta-label">Result</span> {project.result}</span>{/if}
						{#if project.slug === 'toolmac' || project.slug === 'ascii-image-generator'}
							<span class="project-signal" aria-hidden="true">
								<span class="signal-before"></span>
								<span class:toolmac-signal={project.slug === 'toolmac'} class="signal-after"></span>
							</span>
						{:else if project.slug === 'plancheck'}
							<span class="flow-signal" aria-hidden="true"><span>PDF</span><span>→</span><span>CHECK</span><span>→</span><span>REPORT</span></span>
						{/if}
					</span>
					<span class="project-year">{project.year}</span>
					{#if project.preview || project.cover.art}
						<img class="project-preview" src={project.preview ?? project.cover.art} alt="" loading="lazy" decoding="async" />
					{/if}
				</a>
			</li>
		{/each}
	</ul>
	<div class="agents-section">
		<AgentArchive />
	</div>
	<h2 class="additional-heading">More work</h2>
	<ul class="additional-work"><li><a class="additional-link" href="/work/earlier"><span class="additional-copy"><strong>Earlier web work</strong><span class="additional-summary">Bargain Xpress, Bargain Wholesalers and MIP Brands.</span><span class="detail-label">View projects →</span></span></a></li></ul>
</section>

<Contact />

<Arcade bind:this={arcade} bind:open={arcadeOpen} />

<style>
	.hero { margin-bottom: 0; }
	#about + .hero { margin-top: .5rem; }
	.hero + #work { margin-top: -1.25rem; }
	.hero :global(.home) { margin-top: 0; margin-bottom: 0; }

	.intro-link { display: inline-flex; align-items: center; min-height: 44px; }

	#about p + p { margin-top: 0.75rem; }

	section[id] {
		scroll-margin-top: 1.5rem;
	}

	p {
		margin: 0;
		max-width: 38rem;
	}

	.agents-section { margin-top: 2.5rem; }

	.additional-heading {
		margin: 2.5rem 0 0;
		font-size: 1rem;
	}

	.additional-work {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
	}

	.additional-work li {
		display: grid;
		gap: 0.2rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
	}

	.additional-summary {
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--cream) 75%, transparent);
	}


	.additional-link {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(6rem, 10rem);
		gap: 1rem;
		align-items: center;
		color: inherit;
		text-decoration: none;
	}
	.additional-copy { display: grid; gap: 0.25rem; }
	.additional-link strong { text-decoration: underline; text-underline-offset: 0.2em; }
	.additional-link:focus-visible { outline: 2px solid var(--cream); outline-offset: 5px; }
	.detail-label { font-size: 0.75rem; color: var(--sage); }
	@media (max-width: 420px) { .additional-link { grid-template-columns: 1fr 5.5rem; gap: 0.7rem; } }

	.meta-label { color: color-mix(in srgb, var(--cream) 70%, transparent); margin-right: 0.35rem; }

	.project-signal { display: grid; grid-template-columns: 5rem 5rem; gap: 0.35rem; width: fit-content; margin-top: 0.3rem; }
	.project-signal span { display: block; height: 0.22rem; background: color-mix(in srgb, var(--cream) 15%, transparent); position: relative; }
	.project-signal span::after { content: ''; position: absolute; inset: 0 auto 0 0; background: var(--amber); width: 100%; }
	.project-signal .signal-after::after { width: 10.31%; background: var(--teal); }
	.project-signal .toolmac-signal::after { width: 4.17%; }
	.flow-signal { display: flex; flex-wrap: wrap; gap: .45rem; color: var(--sage); font-size: .65rem; letter-spacing: .04em; margin-top: .3rem; }
	.flow-signal span:nth-child(even) { color: var(--teal); }
	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.project-signal span::after { transform-origin: left; transition: transform 220ms cubic-bezier(.22,1,.36,1); }
		.project:hover .signal-after::after { transform: scaleY(1.8); }
	}

	.project-role { font-size: 0.75rem; color: var(--sage); }
	.project-result { font-size: 0.8rem; color: #dfb990; }
	.project-title { font-weight: 700; }
	.project:hover .project-title { text-decoration-thickness: 2px; }

	.projects {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
		border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
	}

	.project {
		position: relative;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
		color: inherit;
		text-decoration: none;
	}

	.project:focus-visible {
		outline: 2px solid var(--cream);
		outline-offset: 4px;
	}

	.project-copy {
		display: grid;
		gap: 0.2rem;
		max-width: 38rem;
	}

	.project-title {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.project-summary,
	.project-year {
		font-size: 0.85rem;
		color: color-mix(in srgb, var(--cream) 75%, transparent);
	}

	.project-year {
		flex-shrink: 0;
	}

	.project-preview {
		display: block;
		flex: 0 0 clamp(5rem, 23vw, 9rem);
		width: clamp(5rem, 23vw, 9rem);
		aspect-ratio: 4 / 3;
		object-fit: contain;
		background: var(--ground);
		border: 1px solid color-mix(in srgb, var(--cream) 30%, transparent);
	}

	@media (max-width: 520px) {
		#about { font-size: 13px; line-height: 1.35; }
		#about p + p { margin-top: .4rem; }
		.projects { margin-top: .5rem; }
		.project { padding: .5rem 0; }
		.project { display: grid; grid-template-columns: minmax(0, 1fr) 5.25rem; gap: 0.6rem; }
		.project-copy { grid-column: 1; grid-row: 1 / 3; min-width: 0; }
		.project-year { grid-column: 2; grid-row: 1; text-align: right; }
		.project-preview { grid-column: 2; grid-row: 2; width: 100%; }
	}

	@media (hover: hover) and (pointer: fine) and (min-width: 900px) {
		.project-preview {
			display: block;
			position: absolute;
			left: calc(100% + 2rem);
			width: min(9rem, calc((100vw - 42rem) / 2 - 3rem));
			top: 50%;
			aspect-ratio: 4 / 3;
			object-fit: contain;
			background: var(--ground);
			border: 1px solid color-mix(in srgb, var(--cream) 35%, transparent);
			opacity: 1;
			transform: translateY(-50%);
			pointer-events: none;
			transition: opacity 180ms ease, transform 180ms ease;
			z-index: 2;
		}

		.project:hover .project-preview,
		.project:focus-visible .project-preview {
			opacity: 1;
			transform: translateY(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.project-preview {
			transition: none;
		}
	}
</style>
