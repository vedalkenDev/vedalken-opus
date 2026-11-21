<article>
<h2>The drawing should fail in your office, not at the counter</h2>
<p>I designed and built a web app that scans South African building plans and checks them against SANS 10400 and zoning rules, so an architect sees what fails before the plan goes to council.</p>
<dl>
<dt>Role</dt><dd>Founder, product designer and developer</dd>
<dt>Timeline</dt><dd>2026, ongoing</dd>
<dt>Tools</dt><dd>Next.js, shadcn/ui, Tailwind CSS, Vercel, Supabase, Cursor cloud agents</dd>
<dt>Team</dt><dd>Just me, building with AI coding agents in Cursor, with architects I trust supplying real drawings to test against</dd>
</dl>
<h2>The problem</h2>
<p>In South Africa, building plans go to the local municipality for approval, and SANS 10400 is the national rulebook they&#x27;re checked against. If one item is missing, the plan comes back and the architect starts again.</p>
<p>PlanCheck is for the architects who prepare those plans. Many aren&#x27;t CAD power users, so the product can&#x27;t assume they know what a layer is. Its two jobs are to save them time and to check the plan against SANS 10400 before anyone else does.</p>
<h2>Constraints</h2>
<ul>
<li>SANS 10400 is copyrighted. I can&#x27;t paste the standard into the app or the database.</li>
<li>Plans arrive as PDFs, and some are scans, so the text and dimensions aren&#x27;t always machine-readable.</li>
<li>It can&#x27;t pretend to be approval. A registered competent person and the owner still sign the submission.</li>
<li>The sample drawings belong to real clients, so none of their details can appear anywhere public.</li>
<li>One person designs and builds it.</li>
</ul>
<h2>Process</h2>
<h3>Research</h3>
<p>I mapped SANS 10400 from Part A to Part XA into an index of parts and headings, and read the clauses that matter most on a drawing, such as window details, glass sizes and the 15% glazing limit in Part XA. I ran real plans from practising architects through the checks. I&#x27;m talking to architects in an ongoing group, and PlanCheck has 6 beta testers.</p>
<h3>The pivot to PDF</h3>
<p>PlanCheck started with CAD files. I moved the core flow to scanning PDFs, and it still reads DWG and DXF files. Architects use different CAD programs, but every one of them has to export the plan to PDF for submission. A PDF works for every architect, whatever software drew it.</p>
<p>I replaced the default PDF viewer with my own, built on the PDF support that modern browsers already have.</p>
<h3>Key decisions</h3>
<p>One upload, one answer. The architect adds a plan, and PlanCheck returns a report. Architects want a verdict, not another tool to learn.</p>
<p>Every fail says what to change. Each failed check names the regulation it breaks and the change to make on the drawing, with a number when there is one. Telling someone they failed isn&#x27;t useful on its own. Fixing the plan is the job.</p>
<p>Plain words only. The interface says &quot;drawing&quot; and &quot;checklist&quot;, never &quot;MTEXT&quot; or &quot;layer&quot;.</p>
<p>Say what it isn&#x27;t. The sign-in and waitlist pages both say: &quot;It is not a stamp. It is not municipal approval. The competent person and the owner still sign.&quot; Nobody should walk away thinking software approved their plan.</p>
<p>Read the occupancy first. One sample wasn&#x27;t a house at all. Medical offices fall under different rules, so the checks have to know what kind of building they&#x27;re looking at before they run.</p>
<p>The trade-off: I chose polish before opening it up. That&#x27;s slower, and right for a tool people trust with their submissions.</p>
<h2>What I built</h2>
<p>A Next.js app on Vercel, with shadcn/ui components, built with Cursor&#x27;s cloud agents.</p>
<ul>
<li>PDF scanning is the core flow. OCR reads scanned notes, and the app measures from dimensions on the sheet.</li>
<li>DWG and DXF files are read too, for layers, text, dimensions and blocks.</li>
<li>To respect the copyright, the app stores an index of SANS headings and opens the official PDF at the right page, through private storage and signed links in Supabase.</li>
<li>Sign-in is by work email, with a waitlist for anyone not on the list yet.</li>
<li>The sign-in page has an interactive &quot;Reading the sheet&quot; figure. You drag a read head, or use the arrow keys, across a drawing, and a dial shows the distance in millimetres.</li>
</ul>
<h2>Outcome</h2>
<p>PlanCheck is live at plancheck.vedalken.dev behind sign-in, with a waitlist at /waitlist and 6 beta testers. The 24-second demo shows the flow from upload to report. It&#x27;s early, and I&#x27;m not quoting accuracy figures.</p>
<video
	aria-label="PlanCheck product demo, from drawing upload to report"
	src="/work/plancheck/demo.mp4"
	poster="/work/plancheck/poster.png"
	width="1920"
	height="1080"
	preload="none"
	controls
	playsinline
	muted
>
	<a href="/work/plancheck/demo.mp4">Download the PlanCheck demo</a>
</video>
<h2>What I learned and what&#x27;s next</h2>
<p>User feedback is what improves the product. When you can build almost anything, what users tell you and the shape of the market matter most. I was adding feature after feature to PlanCheck without checking whether architects needed them. Their feedback is what makes PlanCheck stronger now, and learning to hear it, understand it and act on it has been the most valuable part of the project.</p>
</article>

<style>
	video {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
