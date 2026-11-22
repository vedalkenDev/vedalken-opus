<script lang="ts">
	import { onDestroy } from 'svelte';
	const loop = [
		{ title: 'Observe', text: 'Read the brief and the files needed for the job.', signal: 'BRIEF + CLIENT FILES', result: 'Context gathered' },
		{ title: 'Think', text: 'Decide on a plan and the next useful action.', signal: 'GOAL → PLAN', result: 'Next step chosen' },
		{ title: 'Act', text: 'Use tools to carry out the work, such as drafting or editing.', signal: 'TOOLS → DRAFT', result: 'Work in progress' },
		{ title: 'Check', text: 'Compare the result with the goal. If it falls short, continue the loop.', signal: 'DRAFT ↔ BRIEF', result: 'Review before handover' }
	];
	let activeLoop = $state(0);
	let playing = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;
	function stopPlayback() {
		if (timer) clearInterval(timer);
		timer = undefined;
		playing = false;
	}
	function selectLoop(i: number) {
		stopPlayback();
		activeLoop = i;
	}
	function playLoop() {
		stopPlayback();
		activeLoop = 0;
		playing = true;
		timer = setInterval(() => {
			if (activeLoop >= loop.length - 1) { stopPlayback(); return; }
			activeLoop += 1;
		}, 1800);
	}
	onDestroy(stopPlayback);
	const brief = [
		{ label: 'Goal', example: 'Create a one-page competitor scan.' },
		{ label: 'Inputs', example: 'Use the client brief and the three named competitor sites.' },
		{ label: 'Limits', example: 'Stay within one page and flag claims that need checking.' },
		{ label: 'Output', example: 'Save research.md in 02_research/.' },
		{ label: 'Done', example: 'A teammate can understand the brief, competitors and open questions in two minutes.' }
	];
	let briefPart = $state(0);
	const folders = [
		{ path: 'AGENTS.md', purpose: 'The map routes each task to the relevant stage instructions.' },
		{ path: '_brand/', purpose: 'Brand colours, fonts and tone, consulted when the task needs them.' },
		{ path: '01_inbox/', purpose: 'Raw client inputs. Copy files before working on them.' },
		{ path: '02_research/', purpose: 'Brief summaries, competitor scans and audience notes.' },
		{ path: '03_drafts/', purpose: 'Versioned drafts, outlines and scripts.' },
		{ path: '04_review/', purpose: 'Checks before a draft is handed over.' },
		{ path: '05_final/', purpose: 'Human-approved deliverables.' }
	];
	let folder = $state(0);
	let contextMode = $state<'chat' | 'folder'>('chat');
	const contextItems = [
		{ label: 'Current request', detail: 'The competitor-scan task', needed: true },
		{ label: 'Job map', detail: 'AGENTS.md', needed: true },
		{ label: 'Research instructions', detail: '02_research/CONTEXT.md', needed: true },
		{ label: 'Earlier conversation', detail: 'Previous, unrelated tasks', needed: false },
		{ label: 'Other job stages', detail: 'Drafts, review and final', needed: false },
		{ label: 'Unneeded tool menus', detail: 'Tools not used for this task', needed: false }
	];

	const questions = [
		{
			question: 'Where should the agent look for a competitor scan?',
			choices: ['02_research/CONTEXT.md', '05_final/', 'Every folder'],
			answer: 0,
			explanation: 'The job map routes competitor scans to the research stage.'
		},
		{
			question: 'What makes a brief easier to check?',
			choices: ['A longer chat', 'A clear definition of done', 'Access to every tool'],
			answer: 1,
			explanation: 'A definition of done gives the agent a finish line to check against.'
		},
		{
			question: 'An agent drafts a file for a client. What comes before handover?',
			choices: ['Skip straight to final', 'Review the draft', 'Overwrite the inbox'],
			answer: 1,
			explanation: 'The starter kit has a review stage before approved files reach final.'
		}
	];
	let answers = $state<(number | null)[]>(questions.map(() => null));
	let score = $derived(answers.filter((answer, i) => answer === questions[i].answer).length);

</script>

<section class="workshop" aria-labelledby="workshop-title">
	<h2 id="workshop-title">Try the training</h2>
	<p>Explore the concepts from the sessions and try a short exercise.</p>
	<section class="lesson" aria-labelledby="loop-title">
		<div class="lesson-head"><span>SESSION 01</span><span>AGENT LOOP</span></div>
		<h3 id="loop-title">What does an agent actually do?</h3>
		<p>Follow a brief as it becomes a reviewed draft. Play the sequence or select any step to explore it.</p>
		<div class="agent-visual" aria-label="The agent loop: observe, think, act and check">
			<div class="visual-header"><span>AGENT / PROCESS TRACE</span><span>ILLUSTRATED EXAMPLE</span></div>
			<div class="trace" aria-hidden="true">
				<div class="trace-line"><div class="trace-progress" style:--progress={activeLoop / 3}></div></div>
				{#each loop as step, i}
					<div class="trace-node" class:current={activeLoop === i} class:passed={activeLoop > i}><span>{String(i + 1).padStart(2, '0')}</span><small>{step.title}</small></div>
				{/each}
			</div>
			{#key activeLoop}
				<div class="visual-frame">
					<svg class="process-graphic" viewBox="0 0 220 92" aria-hidden="true">
						{#if activeLoop === 0}
							<path class="draw" d="M42 14h49l12 12v50H42z M91 14v13h12 M53 39h38 M53 48h38 M53 57h27"/><path class="signal" d="M117 47h48m-9-8 9 8-9 8"/><rect x="174" y="32" width="28" height="30" rx="2"/>
						{:else if activeLoop === 1}
							<rect x="13" y="31" width="44" height="30" rx="2"/><path class="draw" d="M57 46h35m0 0 22-23h37m-59 23 22 23h37"/><rect x="152" y="10" width="55" height="26" rx="2"/><rect x="152" y="56" width="55" height="26" rx="2"/>
						{:else if activeLoop === 2}
							<path class="draw" d="M49 12h96v68H49z M61 28h43 M61 39h69 M61 50h52 M61 61h34"/><path class="signal" d="M137 66l29-29 9 9-29 29-13 4z M159 44l9 9"/>
						{:else}
							<path class="draw" d="M37 12h88v68H37z M49 28h45 M49 39h55 M49 50h33"/><circle cx="153" cy="51" r="25"/><path class="signal" d="m141 51 8 8 17-18"/>
						{/if}
					</svg>
					<div class="visual-caption"><span>{loop[activeLoop].signal}</span><strong>{loop[activeLoop].result}</strong></div>
				</div>
			{/key}
			<div class="visual-footer"><span>STEP {String(activeLoop + 1).padStart(2, '0')} / 04</span><button type="button" onclick={playing ? stopPlayback : playLoop}>{playing ? 'Pause sequence' : 'Play sequence'} <span aria-hidden="true">{playing ? 'Ⅱ' : '→'}</span></button></div>
		</div>
		<div class="loop" aria-label="Explore the agent loop">
			{#each loop as step, i}
				<button type="button" class:active={activeLoop === i} aria-pressed={activeLoop === i} onclick={() => selectLoop(i)}>
					<span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{step.title}
				</button>
			{/each}
		</div>
		<div class="readout" aria-live="polite"><strong>{loop[activeLoop].title}</strong><p>{loop[activeLoop].text}</p></div>
	</section>
	<section class="lesson" aria-labelledby="brief-title">
		<div class="lesson-head"><span>SESSION 01</span><span>BRIEFING</span></div>
		<h3 id="brief-title">Brief it like a contract</h3>
		<p>A useful brief names the goal, inputs, limits, output and what “done” means. Select each part to see a worked example.</p>
		<div class="brief-diagram" aria-hidden="true">
			<div class="brief-sheet"><span>BRIEF.TXT</span>{#each brief as part, i}<div class:lit={briefPart === i}><span>{String(i + 1).padStart(2, '0')}</span><b>{part.label}</b><i></i></div>{/each}</div>
			<div class="brief-link"><span>SELECTED FIELD</span><strong>{brief[briefPart].label}</strong><span>↳ TASK CONTEXT</span></div>
		</div>
		<div class="brief-parts" aria-label="Explore a sample brief">
			{#each brief as part, i}
				<button type="button" class:active={briefPart === i} aria-pressed={briefPart === i} onclick={() => (briefPart = i)}>{part.label}</button>
			{/each}
		</div>
		<div class="readout" aria-live="polite"><strong>{brief[briefPart].label}</strong><p>{brief[briefPart].example}</p></div>
	</section>

	<section class="lesson context-demo" aria-labelledby="context-demo-title">
		<div class="lesson-head"><span>SESSION 02</span><span>THE TOKEN PROBLEM</span></div>
		<h3 id="context-demo-title">Give the agent a map, not the whole history</h3>
		<p>Try the same competitor-scan task two ways. The session teaches the team to keep the context relevant to the job.</p>
		<div class="context-switch" aria-label="Compare approaches">
			<button type="button" class:active={contextMode === 'chat'} aria-pressed={contextMode === 'chat'} onclick={() => (contextMode = 'chat')}>01 / Long chat</button>
			<button type="button" class:active={contextMode === 'folder'} aria-pressed={contextMode === 'folder'} onclick={() => (contextMode = 'folder')}>02 / Focused folder</button>
		</div>
		<div class="context-window">
			<div class="context-header"><span>TASK / COMPETITOR SCAN</span><span>ILLUSTRATIVE</span></div>
			<div class="context-flow" aria-hidden="true"><span>REQUEST</span><span>→</span><span>AGENTS.md</span><span>→</span><span>02_research/</span></div>
			<div class="context-list">
				{#each contextItems as item}
					<div class="context-row" class:muted={contextMode === 'folder' && !item.needed}>
						<span class="context-indicator" aria-hidden="true">{contextMode === 'folder' && !item.needed ? '–' : '●'}</span>
						<div><strong>{item.label}</strong><small>{item.detail}</small></div>
						<span class="context-status">{contextMode === 'folder' && !item.needed ? 'set aside' : 'in context'}</span>
					</div>
				{/each}
			</div>
			<div class="context-result" aria-live="polite">
				<strong>{contextMode === 'chat' ? 'The context can keep growing' : 'Read what this task needs'}</strong>
				<p>{contextMode === 'chat' ? 'A long conversation and unused tool definitions can add context to later requests. What gets sent depends on the tool and session.' : 'Start a fresh task, consult the job map, then load the research instructions and relevant inputs. Less unnecessary context can reduce token use.'}</p>
			</div>
		</div>
		<p class="context-note">A conceptual comparison, not a measured token count. Actual savings depend on the tool, conversation and files used.</p>
	</section>

	<section class="lesson" aria-labelledby="folders-title">
		<div class="lesson-head"><span>SESSION 02</span><span>CONTEXT</span></div>
		<h3 id="folders-title">Give each job a map</h3>
		<p>The starter kit uses an approach inspired by Jake Van Clief’s Interpretable Context Methodology. Select a folder to see what it is for.</p>
		<div class="route-strip" aria-hidden="true"><span>JOB</span><span class="route-arrow">→</span><span>AGENTS.md</span><span class="route-arrow">→</span><strong>{folders[folder].path}</strong></div>
		<div class="explorer">
			<div class="folder-list" aria-label="Starter kit folders">
				{#each folders as item, i}
					<button type="button" class:active={folder === i} aria-pressed={folder === i} onclick={() => (folder = i)}>
						<span aria-hidden="true">{i === 0 ? '▤' : '▸'}</span> {item.path}
					</button>
				{/each}
			</div>
			<div class="folder-detail" aria-live="polite"><span>OPEN /</span><strong>{folders[folder].path}</strong><p>{folders[folder].purpose}</p></div>
		</div>
	</section>

	<section class="lesson" aria-labelledby="quiz-title">
		<div class="lesson-head"><span>PUT IT INTO PRACTICE</span><span>3 QUESTIONS</span></div>
		<h3 id="quiz-title">Check your understanding</h3>
		<p>Choose an answer for each question. You can change your answer and try again.</p>
		{#each questions as question, i}
			<fieldset class="question">
				<legend>{question.question}</legend>
				{#each question.choices as choice, j}
					<label>
						<input type="radio" name="question-{i}" value={j} checked={answers[i] === j} onchange={() => (answers[i] = j)} />
						<span>{choice}</span>
					</label>
				{/each}
				{#if answers[i] !== null}
					<p class="feedback" aria-live="polite"><strong>{answers[i] === question.answer ? 'Correct.' : 'Not quite.'}</strong> {question.explanation}</p>
				{/if}
			</fieldset>
		{/each}
		{#if answers.every((answer) => answer !== null)}
			<p class="score" aria-live="polite">{score} of {questions.length} correct</p>
			<button class="reset" type="button" onclick={() => (answers = questions.map(() => null))}>Try again</button>
		{/if}
	</section>

</section>

<style>
	.workshop { margin: 3rem 0; }
	h2 { font-size: 1.4rem; margin: 0 0 .5rem; }
	p { color: #d0d1c8; line-height: 1.65; }
	.lesson { margin: 1.5rem 0; padding: clamp(1rem, 4vw, 1.6rem); border: 1px solid color-mix(in srgb, var(--cream) 28%, transparent); background: #0d1114; }
	.lesson-head { display: flex; justify-content: space-between; gap: 1rem; color: #b6c5a5; font-size: .68rem; letter-spacing: .08em; }
	h3 { font-size: 1rem; line-height: 1.4; margin: 1.3rem 0 .35rem; }
	.lesson p { font-size: .85rem; }
	.agent-visual { margin-top: 1.4rem; border: 1px solid #65766d; background: #080e10; overflow: hidden; }
	.visual-header, .visual-footer { display: flex; align-items: center; justify-content: space-between; gap: .7rem; padding: .7rem .8rem; color: #b6c5a5; font-size: .61rem; letter-spacing: .06em; }
	.visual-header { border-bottom: 1px solid #34433e; }
	.visual-footer { border-top: 1px solid #34433e; }
	.visual-footer button { background: none; border: 1px solid #809989; padding: .55rem .7rem; font-size: .68rem; }
	.trace { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); margin: 1.35rem 1rem .25rem; }
	.trace-line { position: absolute; left: 12.5%; right: 12.5%; top: .6rem; height: 1px; background: #52645a; }
	.trace-progress { height: 100%; background: #b3d4bb; transform: scaleX(var(--progress)); transform-origin: left; }
	.trace-node { z-index: 1; display: grid; justify-items: center; gap: .45rem; color: #a4b0a5; font-size: .6rem; }
	.trace-node > span { display: grid; place-items: center; width: 1.3rem; height: 1.3rem; background: #080e10; border: 1px solid #718478; font-size: .52rem; }
	.trace-node.current > span { color: #071210; background: #a9d0b6; border-color: #a9d0b6; }
	.trace-node.passed > span { color: #b8d9c2; border-color: #9ec4aa; }
	.trace-node small { font-size: inherit; }
	.visual-frame { min-height: 11rem; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); align-items: center; gap: 1rem; padding: .6rem 1rem 1.2rem; }
	.process-graphic { display: block; width: 100%; max-height: 9rem; fill: none; stroke: #9dbfae; stroke-width: 1.3; stroke-linecap: square; stroke-linejoin: miter; }
	.process-graphic .signal { stroke: #e5b58e; stroke-width: 2; }
	.visual-caption { display: grid; gap: .6rem; }
	.visual-caption span, .brief-link span { color: #a9bfad; font-size: .62rem; letter-spacing: .06em; }
	.visual-caption strong { font-size: clamp(.85rem, 2.5vw, 1.05rem); line-height: 1.4; }
	.brief-diagram { display: grid; grid-template-columns: 1.2fr .8fr; gap: 1.2rem; align-items: center; margin-top: 1.3rem; padding: 1rem; background: #080e10; border: 1px solid #34433e; }
	.brief-sheet { padding: .7rem; border: 1px solid #718478; }
	.brief-sheet > span { display: block; padding-bottom: .5rem; color: #a9bfad; font-size: .6rem; }
	.brief-sheet > div { display: flex; align-items: center; gap: .45rem; padding: .27rem; color: #aeb8ac; font-size: .64rem; transition: color 180ms, background 180ms; }
	.brief-sheet > div.lit { color: #f4f3e8; background: #263b34; }
	.brief-sheet i { flex: 1; height: 1px; background: #566c60; }
	.brief-link { display: grid; gap: .6rem; min-width: 0; }
	.brief-link strong { color: #e5b58e; }
	.route-strip { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; margin-top: 1.2rem; padding: .8rem; background: #080e10; border: 1px solid #34433e; font-size: .65rem; overflow-wrap: anywhere; }
	.route-strip strong { color: #e5b58e; }
	.route-arrow { color: #a9bfad; }
	.context-switch { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: 1.3rem; }
	.context-switch button { padding: .8rem; background: transparent; border: 1px solid #67706c; font-size: .75rem; text-align: left; }
	.context-switch button.active { background: #273b33; border-color: #b6c5a5; }
	.context-window { margin-top: .7rem; border: 1px solid #65766d; background: #080e10; }
	.context-header, .context-flow { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; padding: .8rem; color: #b6c5a5; font-size: .68rem; }
	.context-header { border-bottom: 1px solid #34433e; }
	.context-flow { justify-content: flex-start; color: #e5b58e; border-bottom: 1px solid #34433e; overflow-wrap: anywhere; }
	.context-list { padding: .5rem .8rem; }
	.context-row { display: grid; grid-template-columns: 1rem 1fr auto; align-items: center; gap: .6rem; padding: .65rem 0; border-bottom: 1px solid #273630; transition: opacity 220ms; }
	.context-row:last-child { border-bottom: 0; }
	.context-row.muted { opacity: .48; }
	.context-row strong, .context-row small { display: block; font-size: .72rem; }
	.context-row small, .context-status { color: #b6c5a5; font-size: .68rem; }
	.context-indicator { color: #8fd0ae; }
	.context-result { padding: 1rem; border-top: 1px solid #34433e; }
	.context-result p { margin: .4rem 0 0; }
	.context-note { color: #b6c5a5; font-size: .75rem !important; }
	@media (max-width: 440px) { .context-row { grid-template-columns: 1rem 1fr; } .context-status { grid-column: 2; } }

	@media (prefers-reduced-motion: no-preference) {
		.trace-progress { transition: transform 500ms cubic-bezier(.16,1,.3,1); }
		.visual-frame { animation: frame-in 360ms cubic-bezier(.16,1,.3,1) both; }
		.process-graphic .draw { stroke-dasharray: 400; stroke-dashoffset: 400; animation: trace-draw 700ms ease-out forwards; }
		.process-graphic .signal { animation: signal-in 500ms 180ms ease-out both; }
		@keyframes frame-in { from { opacity: .3; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
		@keyframes trace-draw { to { stroke-dashoffset: 0; } }
		@keyframes signal-in { from { opacity: 0; } to { opacity: 1; } }
	}
	.loop { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: .4rem; margin-top: 1.3rem; }
	button { font: inherit; color: var(--cream); cursor: pointer; }
	.loop button { min-height: 4rem; display: flex; flex-direction: column; justify-content: center; gap: .3rem; align-items: flex-start; padding: .6rem; border: 1px solid #67706c; background: transparent; font-size: .75rem; text-align: left; }
	.loop button span { color: #b6c5a5; font-size: .65rem; }
	button:hover, .loop button.active { background: #27332f; border-color: #b6c5a5; }
	input:focus-visible, button:focus-visible { outline: 2px solid var(--cream); outline-offset: 3px; }
	.brief-parts { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: 1.2rem; }
	.brief-parts button { padding: .55rem .7rem; background: transparent; border: 1px solid #67706c; font-size: .75rem; }
	.brief-parts button.active { background: #27332f; border-color: #b6c5a5; }
	.explorer { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); margin-top: 1.2rem; border: 1px solid #59615c; }
	.folder-list { padding: .6rem; border-right: 1px solid #59615c; }
	.folder-list button { display: block; width: 100%; border: 0; background: transparent; padding: .5rem; font-size: .72rem; text-align: left; overflow-wrap: anywhere; }
	.folder-list button span, .folder-detail > span { color: #b6c5a5; }
	.folder-list button.active { background: #27332f; }
	.folder-detail { display: flex; flex-direction: column; gap: .5rem; padding: 1rem; min-width: 0; }
	.folder-detail > span { font-size: .65rem; letter-spacing: .08em; }
	.folder-detail strong { overflow-wrap: anywhere; }
	.folder-detail p { margin: 0; }
	@media (max-width: 440px) { .explorer { grid-template-columns: 1fr; } .folder-list { border-right: 0; border-bottom: 1px solid #59615c; } }
	.question { border: 0; border-top: 1px solid #59615c; margin: 1.4rem 0 0; padding: 1rem 0 0; }
	.question legend { font-weight: 700; padding: 0 .5rem 0 0; font-size: .85rem; }
	.question label { display: flex; gap: .6rem; align-items: baseline; padding: .4rem 0; cursor: pointer; font-size: .8rem; }
	.question input { accent-color: var(--teal); }
	.feedback { padding: .7rem; background: #171e20; }
	.score { color: var(--cream); font-weight: 700; }
	.reset { background: transparent; border: 1px solid #b6c5a5; padding: .6rem .8rem; }
	.readout { padding: .9rem; margin-top: .7rem; background: #171e20; border: 1px solid color-mix(in srgb, var(--teal) 45%, transparent); }
	.readout p { margin: .2rem 0 0; }
	@media (max-width: 440px) { .loop { grid-template-columns: repeat(2,minmax(0,1fr)); } }
</style>
