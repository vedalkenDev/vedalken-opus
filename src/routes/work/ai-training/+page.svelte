<script lang="ts">
	import AgentWorkshop from '#lib/components/AgentWorkshop.svelte';
</script>

<p class="back"><a href="/work">← Work</a></p>
<h1>AI agent training &amp; starter kit</h1>
<p class="intro">Two sessions I created to teach a creative team how to build and use AI agents.</p>
<dl>
	<div><dt>My role</dt><dd>Training design and delivery</dd></div>
	<div><dt>Deliverables</dt><dd>Two interactive presentations, a job-folder starter kit and shared skills</dd></div>
	<div><dt>Approach</dt><dd>I directed an AI agent using a brief and design rules</dd></div>
</dl>

<p><a href="#workshop-title">Try the interactive training ↓</a></p>

<h2>From chatbot to co-worker</h2>
<p>The first session introduces the agent loop, tools, memory and goals. It gives the team a practical way to brief work and set boundaries.</p>
<figure>
	<img src="/work/ai-training/chatbot-to-coworker.webp" width="1920" height="1080" alt="Title slide for the Chatbot to Co-worker training session" loading="lazy" />
	<figcaption>Session one · 27 slides · briefing agents</figcaption>
</figure>

<h2>Show, tell and improve</h2>
<p>The second session covers what the team built, what broke, and how to use job folders to keep agent context focused.</p>
<p><a href="#context-demo-title">Try the token-saving demonstration ↑</a></p>
<figure>
	<img src="/work/ai-training/show-and-tell.webp" width="1920" height="1080" alt="Title slide for the Show and Tell training session" loading="lazy" />
	<figcaption>Session two · 24 slides · demos and context</figcaption>
</figure>


<section class="build-story" aria-labelledby="build-heading">
	<h2 id="build-heading">How I built the programme</h2>
	<p>The team was using AI mainly to ask questions and copy the answers. I was asked to teach them how to use agents to carry out whole jobs. I directed an AI agent to produce the training materials.</p>
	<ol class="build-steps">
		<li><strong>Set the rules</strong><span>I turned David JP Phillips’ presentation principles into a written rulebook: one message per slide, short text, large type and strong contrast.</span></li>
		<li><strong>Brief the agent</strong><span>I gave it the audience, goal, story, tone and rules. It produced the layouts, animation and formatting; I directed the work.</span></li>
		<li><strong>Build once, reuse</strong><span>The agent built a shared generator so a design change could update every slide. A settings file changes the programme’s name, tagline, URL and colours.</span></li>
		<li><strong>Check and revise</strong><span>An automated checker captured and tested the slides against the rules. I reviewed the screenshots, gave notes, and the agent revised before the checks ran again.</span></li>
	</ol>
	<p class="build-result"><strong>75/75 and 49/49 checks passed</strong><br />Two interactive decks, with speaker scripts, presenter notes, an audience screen, a token-savings report and a take-home starter kit.</p>
</section>


<h2>A starter kit for real work</h2>
<p>Each job gets a folder with a short map and separate stages for inbox, research, drafts, review and final files. Brand context and shared skills are available when needed. The approach is inspired by Jake Van Clief’s Interpretable Context Methodology.</p>
<AgentWorkshop />

<p><a href="/#work">← Back to the AI systems archive</a></p>

<style>
	.back { margin: 0 0 1.5rem; }
	h1 { margin-bottom: .5rem; }
	.intro { font-size: 1.1rem; line-height: 1.5; max-width: 50ch; }
	h2 { margin: 2.4rem 0 .5rem; font-size: 1.15rem; }
	p { max-width: 62ch; line-height: 1.7; }
	.build-story { margin-top: 3rem; }
	.build-story h2 { margin-bottom: .7rem; }
	.build-steps { list-style: none; margin: 1.4rem 0; padding: 0; border-top: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.build-steps li { display: grid; grid-template-columns: minmax(8rem, 11rem) 1fr; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid color-mix(in srgb, var(--cream) 22%, transparent); }
	.build-steps strong { color: var(--sage); }
	.build-steps span { line-height: 1.6; }
	.build-result { color: #d0d1c8; }
	.build-result strong { color: #e5c09a; }
	dl { display: grid; gap: .7rem; margin: 1.5rem 0 2rem; }
	dl div { display: grid; grid-template-columns: minmax(8rem, 10rem) 1fr; gap: 1rem; }
	dt, figcaption { color: var(--sage); } dd { margin: 0; }
	figure { margin: 1.3rem 0; }
	img { display: block; width: 100%; height: auto; border: 1px solid color-mix(in srgb, var(--cream) 24%, transparent); }
	figcaption { font-size: .75rem; margin-top: .45rem; }
	@media (max-width: 420px) { dl div, .build-steps li { grid-template-columns: 1fr; gap: .3rem; } }
</style>
