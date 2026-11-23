<script lang="ts">
	import { onMount } from 'svelte';
	import { slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let reducedMotion = $state(true);
	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (reducedMotion = preference.matches);
		update();
		preference.addEventListener('change', update);
		return () => preference.removeEventListener('change', update);
	});
	const folders = [
		{
			name: 'Catalogue agent',
			path: 'catalogue_agent',
			type: 'AI AGENT',
			intro: 'Keeps product catalogues current for supermarket client websites, including Bargain Group.',
			detail: 'One of three AI agents I built for the Cerebro Creative team. Together, the agents save the team 25 hours a week.',
			role: 'Built and maintained the agents',
			stages: [
				{ name: 'input', text: 'Product catalogue information for supermarket client websites.' },
				{ name: 'process', text: 'An agent helps keep product catalogues current.' },
				{ name: 'outcome', text: 'Three agents together save the team 25 hours a week.' }
			]
		},
		{
			name: 'Content repurposing',
			path: 'content_repurposing',
			type: 'STUDIO TOOL',
			intro: 'A content repurposing system for the studio’s FMCG designers.',
			detail: 'The system saves two designers 20 hours a week between them.',
			role: 'Built the content workflow',
			stages: [
				{ name: 'input', text: 'Content prepared for the studio’s FMCG design work.' },
				{ name: 'process', text: 'A system for repurposing content for the design team.' },
				{ name: 'outcome', text: 'Two designers save 20 hours a week between them.' }
			]
		},
		{
			name: 'AI agent training & starter kit',
			path: 'agent_training',
			type: 'TRAINING & SYSTEMS',
			intro: 'Two sessions teaching a creative team how to build and use AI agents.',
			detail: 'Two interactive presentations and a reusable job-folder starter kit, created with AI-agent assistance.',
			role: 'Training design and delivery',
			stages: [
				{ name: '01_inbox', text: 'Client inputs and source files for a job.' },
				{ name: '02_research', text: 'Briefs and research, with stage-specific context.' },
				{ name: '03_drafts', text: 'Draft work stays in its own stage.' },
				{ name: '04_review', text: 'A dedicated review stage for checks before handover.' },
				{ name: '05_final', text: 'Final files are kept in a separate stage.' },
				{ name: '_brand', text: 'Brand context is available when the task needs it.' }
			]
		},
		{
			name: 'Team enablement',
			path: 'team_enablement',
			type: 'KNOWLEDGE',
			intro: 'I teach the team to build and use AI agents.',
			detail: 'I taught the whole team and made a video guide to the process. I also maintain agents after they go live.',
			role: 'Training, documentation and maintenance',
			stages: [
				{ name: 'training', text: 'Taught the team how to build and use AI agents.' },
				{ name: 'documentation', text: 'Created a video guide to the process.' },
				{ name: 'maintenance', text: 'Maintain the agents after they go live.' }
			]
		}
	] as const;

	let selected = $state<number | null>(0);
	let selectedStage = $state<number | null>(null);
	const current = $derived(selected === null ? null : folders[selected]);
</script>

<section class="agents" aria-labelledby="agents-title">
	<div class="heading">
		<h2 id="agents-title">AI agents &amp; studio tools</h2>
		<p>I build AI agents and tools for the Cerebro Creative team, and teach people how to use them.</p>
	</div>

	<div class="archive">
		<div class="archive-bar">
			<span>STUDIO / SYSTEMS</span>
			<span>WORK ARCHIVE</span>
		</div>
		<div class="archive-body">
			<div class="folder-list" aria-label="Select a project folder">
				<p class="location"><span aria-hidden="true">▾</span> studio/</p>
				{#each folders as folder, index}
					<button
						type="button"
						class:active={selected === index}
						aria-expanded={selected === index}
						onclick={() => { selected = selected === index ? null : index; selectedStage = null; }}
					>
						<span class="folder-icon" aria-hidden="true"></span>
						<span>{folder.path}<span class="slash">/</span></span>
						<span class="arrow" aria-hidden="true">›</span>
					</button>
					{#if selected === index}
						<div class="subfolders" aria-label="{folder.name} workflow" transition:slide={{ duration: reducedMotion ? 0 : 180, easing: cubicOut }}>
							{#each folder.stages as stage, stageIndex}
								<button type="button" class:active={selectedStage === stageIndex} aria-pressed={selectedStage === stageIndex} onclick={() => (selectedStage = stageIndex)}>
									<span class="tree-line" aria-hidden="true">└</span>
									<span class="folder-icon" aria-hidden="true"></span>
									<span>{stage.name}<span class="slash">/</span></span>
								</button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
			<div class="file" aria-live="polite">
				{#key `${selected}:${selectedStage}`}
					<div in:fly={{ y: reducedMotion ? 0 : 5, duration: reducedMotion ? 0 : 180, easing: cubicOut }}>
				{#if current}
				<div class="file-top"><span>{current.type}</span><span>{selectedStage === null ? 'README.TXT' : current.stages[selectedStage].name.toUpperCase() + '.TXT'}</span></div>
				<h3>{current.name}</h3>
				{#if selectedStage === null}
					<p>{current.intro}</p>
					<p>{current.detail}</p>
					{#if current.path === 'agent_training'}
						<a class="training-link" href="/work/ai-training">Explore the training programme →</a>
					{/if}
					<p class="contribution"><span>MY ROLE</span>{current.role}</p>
				{:else}
					<p>{current.stages[selectedStage].text}</p>
					<p class="contribution"><span>WORKFLOW</span>Illustrative stages based on the project description</p>
				{/if}
				{:else}
					<div class="file-top"><span>WORK ARCHIVE</span><span>README.TXT</span></div>
					<h3>Select a folder</h3>
					<p>Open a folder to explore the work.</p>
				{/if}
					</div>
				{/key}
			</div>
		</div>
		<div class="activity" aria-hidden="true">
			<div class="activity-label">ILLUSTRATED ACTIVITY</div>
			<div class="activity-path">studio/ <span>›</span> catalogue_agent/</div>
			<div class="activity-line"><span class="pixel-folder"></span> <span>product_catalogue</span><span class="activity-tick">✓</span></div>
			<div class="activity-line"><span class="pixel-folder"></span> <span>content_workflow</span><span class="activity-tick second">✓</span></div>
			<div class="demo-cursor cursor-one">↖<span>agent</span></div>
			<div class="demo-cursor cursor-two">↖<span>agent</span></div>
		</div>
		<div class="archive-footer"><span>SELECT A FOLDER</span><span>{folders.length} PROJECT AREAS</span></div>
	</div>
</section>

<style>
	.agents {
		display: grid;
		gap: 1.25rem;
		padding: 0.25rem 0 0.5rem;
	}
	h2 {
		margin: 0 0 0.35rem;
		font-size: 1rem;
	}
	.heading p {
		margin: 0;
		max-width: 55ch;
		color: color-mix(in srgb, var(--cream) 78%, transparent);
		font-size: 0.85rem;
	}
	.archive {
		background: #0b0e11;
		border: 1px solid color-mix(in srgb, var(--cream) 28%, transparent);
		box-shadow: 0 12px 30px rgb(0 0 0 / 0.3);
	}
	.archive-bar,
	.archive-footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem 0.9rem;
		font-size: 0.64rem;
		letter-spacing: 0.08em;
	}
	.archive-bar {
		background: var(--charcoal);
		border-bottom: 1px solid color-mix(in srgb, var(--cream) 23%, transparent);
	}
	.archive-bar span:last-child,
	.archive-footer {
		color: #c3c6b9;
	}
	.archive-body {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
	}
	.folder-list {
		min-width: 0;
		padding: 1rem 0.5rem 1rem 0.75rem;
		border-right: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
	}
	.location {
		margin: 0 0 0.55rem;
		color: #c1cdb0;
		font-size: 0.75rem;
	}
	.folder-list button {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 2.9rem;
		padding: 0.55rem 0.45rem;
		border: 1px solid transparent;
		background: transparent;
		color: #e4e3d9;
		font: inherit;
		font-size: 0.72rem;
		text-align: left;
		cursor: pointer;
		overflow-wrap: anywhere;
	}
	.folder-list button:hover,
	.folder-list button.active {
		background: color-mix(in srgb, var(--sage) 13%, transparent);
	}
	.folder-list button.active {
		border-color: color-mix(in srgb, var(--sage) 90%, transparent);
	}
	.folder-list button:focus-visible {
		outline: 2px solid var(--cream);
		outline-offset: 2px;
	}
	.subfolders { margin: 0 0 0.4rem 1.15rem; border-left: 1px solid color-mix(in srgb, var(--sage) 40%, transparent); }
	.folder-list .subfolders button { min-height: 2.2rem; padding: 0.4rem 0.3rem; font-size: 0.68rem; }
	.tree-line { color: var(--sage); }
	.subfolders .folder-icon { width: 0.85rem; height: 0.55rem; }

	.folder-icon,
	.pixel-folder {
		position: relative;
		display: inline-block;
		flex: 0 0 auto;
		width: 1.1rem;
		height: 0.7rem;
		border: 1px solid #d2a77f;
	}
	.folder-icon::before,
	.pixel-folder::before {
		content: '';
		position: absolute;
		top: -0.25rem;
		left: -1px;
		width: 0.42rem;
		height: 0.18rem;
		border: 1px solid #d2a77f;
		border-bottom: 0;
	}
	.folder-icon::after {
		content: '';
		position: absolute;
		inset: 0.16rem -1px -1px;
		border: 1px solid #d2a77f;
		background: #0b0e11;
		opacity: 0;
	}
	.folder-list button.active .folder-icon::after { opacity: 1; }
	@media (prefers-reduced-motion: no-preference) {
		.folder-icon::after { transition: opacity 150ms ease; }
		.folder-list button .arrow { transition: transform 180ms cubic-bezier(.22, 1, .36, 1); }
		.folder-list button[aria-expanded="true"] .arrow { transform: rotate(90deg); }
	}

	.slash,
	.arrow { color: #b1c19e; }
	.arrow { margin-left: auto; font-size: 1rem; }
	.file {
		min-width: 0;
		padding: 1rem 1.1rem 1.2rem;
	}
	.file-top {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		color: #b6c5a5;
		font-size: 0.6rem;
		letter-spacing: 0.06em;
	}
	.training-link { display: inline-block; margin: 0.15rem 0 0.3rem; color: #dfc09e; font-size: 0.8rem; text-underline-offset: 0.2em; }
	h3 { margin: 0.85rem 0 0.55rem; font-size: 1rem; line-height: 1.3; }
	.file p { margin: 0 0 0.75rem; color: #d7d7ce; font-size: 0.8rem; line-height: 1.6; }
	.file .contribution { display: grid; gap: 0.15rem; color: #e5c09a; margin: 1rem 0 0; }
	.contribution span { font-size: 0.62rem; letter-spacing: 0.08em; color: #b6c5a5; }
	.activity {
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1rem;
		padding: 0.9rem 1rem 1rem;
		border-top: 1px solid color-mix(in srgb, var(--cream) 18%, transparent);
		background: #11171a;
		font-size: 0.7rem;
	}
	.activity-label { color: #c6cbbc; font-size: 0.6rem; letter-spacing: 0.08em; }
	.activity-path { text-align: right; color: #c6cbbc; overflow-wrap: anywhere; }
	.activity-path span { color: #b6c5a5; }
	.activity-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		color: #d8d9cf;
		overflow-wrap: anywhere;
	}
	.pixel-folder { width: 0.8rem; height: 0.55rem; }
	.pixel-folder::before { width: 0.3rem; }
	.activity-tick { color: #96c8b8; margin-left: auto; }
	.demo-cursor { position: absolute; font-size: 1rem; color: #a3ded5; text-shadow: 0 1px 4px #000; pointer-events: none; opacity: 0; }
	.demo-cursor span { display: block; margin-left: 0.45rem; padding: 0 0.2rem; background: #28655f; color: #fff; font-size: 0.55rem; }
	.cursor-one { left: 30%; top: 55%; }
	.cursor-two { left: 73%; top: 55%; color: #ebbd91; }
	.cursor-two span { background: #805335; }
	.archive-footer { border-top: 1px solid color-mix(in srgb, var(--cream) 18%, transparent); }
	@media (prefers-reduced-motion: no-preference) {
		.cursor-one { animation: first-agent 8s ease-in-out infinite; }
		.cursor-two { animation: second-agent 8s ease-in-out infinite; }
		.activity-tick { animation: completed 8s steps(1) infinite; }
		.activity-tick.second { animation-delay: 2s; }
		@keyframes first-agent {
			0%, 9% { opacity: 0; transform: translate(1.5rem, 0.7rem); }
			18%, 28% { opacity: 1; transform: translate(0, 0); }
			31% { transform: translate(0, 0) scale(0.8); }
			36%, 48% { opacity: 1; transform: translate(0, 0); }
			58%, 100% { opacity: 0; transform: translate(-0.8rem, -0.4rem); }
		}
		@keyframes second-agent {
			0%, 35% { opacity: 0; transform: translate(1.4rem, 0.7rem); }
			45%, 55% { opacity: 1; transform: translate(0, 0); }
			58% { transform: translate(0, 0) scale(0.8); }
			63%, 75% { opacity: 1; transform: translate(0, 0); }
			85%, 100% { opacity: 0; transform: translate(-0.8rem, -0.4rem); }
		}
		@keyframes completed { 0%, 30% { opacity: 0.3; } 31%, 85% { opacity: 1; } 86%, 100% { opacity: 0.3; } }
	}
	@media (prefers-reduced-motion: reduce) {
		.demo-cursor { display: none; }
	}
	@media (max-width: 520px) {
		.archive-body { grid-template-columns: 1fr; }
		.folder-list { border-right: 0; border-bottom: 1px solid color-mix(in srgb, var(--cream) 18%, transparent); }
		.file { padding: 1rem; }
		.activity { grid-template-columns: 1fr; }
		.activity-path { text-align: left; }
		.cursor-two { left: 75%; top: 70%; }
	}
</style>
