<script lang="ts">
	import CaseMetric from '#lib/components/CaseMetric.svelte';
</script>

<article>
<p><strong>Drop in a photo, pick a look, and get ASCII art you can copy or save.</strong></p>
<p><img loading="lazy" decoding="async" src="/work/ascii-image-generator/cells-80-columns.webp" alt="Cells mode at 80 columns"></p>
<p><strong>Role</strong> · Design and engineering</p>
<h2>What it is</h2>
<p>Cosmic Archive ASCII converts still images into ASCII and glyph art. It&#39;s the ASCII generator for <a href="https://vedalken.dev">Cosmic Archive</a>, and it follows that brand&#39;s visual rules: cream on near-black, visor colour used as light, ASCII as the medium.</p>
<p>It isn&#39;t a photo editor. The sidebar works like a catalogue of the photo you loaded: you choose a look, and then you can fine-tune it.</p>
<p>The same Rust codebase runs as:</p>
<ul>
<li>a <strong>web app</strong> compiled to WebAssembly, with nothing to install;</li>
<li>a <strong>Windows <code>.exe</code></strong>;</li>
<li>a <strong>macOS <code>.dmg</code></strong> (Intel and Apple Silicon).</li>
</ul>
<h2>Who it&#39;s for</h2>
<ul>
<li>Designers and artists who want ASCII or glyph versions of images for posters, social posts, album art or UI textures.</li>
<li>Anyone who needs output that still works in other tools. SVG export opens in Figma, and text exports paste into terminals, READMEs and chat.</li>
</ul>
<h2>How it works</h2>
<p>The sidebar asks four questions in order, and puts everything optional behind <strong>Tune</strong>:</p>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Step</th>
<th>What you choose</th>
</tr>
</thead>
<tbody><tr>
<td><strong>Look</strong></td>
<td>One of seven patterns (Visor, Blocks, Crt, Ansi, Dither, Hatch, Scan), each shown as a live thumbnail of your photo. Then a mark: <strong>Cells</strong> (square mosaic), <strong>Shaded</strong> (cells that show glyph density) or <strong>Chars</strong> (real glyphs).</td>
</tr>
<tr>
<td><strong>Colour</strong></td>
<td>Eight palettes: Source, Spectrum, Amber, Sage, Cream, Teal, Coral and Duo, a two-colour map from <strong>Ink</strong> to <strong>Paper</strong>. Any palette works with any look.</td>
</tr>
<tr>
<td><strong>Detail</strong></td>
<td>Columns, from 16 to 400.</td>
</tr>
<tr>
<td><strong>Save</strong></td>
<td>PNG, SVG, TXT, JPEG, WEBP or ANSI, plus copy as text or as an image.</td>
</tr>
<tr>
<td><strong>Tune</strong></td>
<td>The look&#39;s own setting, palette settings, and image tone (auto levels, brightness, contrast, gamma). One reset button clears all of it.</td>
</tr>
</tbody></table>
</div>
<p><img loading="lazy" decoding="async" src="/work/ascii-image-generator/chars-80-columns.webp" alt="Chars mode at 80 columns"></p>
<h3>Under the hood</h3>
<ol>
<li><strong>Load.</strong> PNG, JPEG, WebP, GIF, BMP, TIFF and SVG are decoded inside the app. SVG goes through <a href="https://github.com/linebender/resvg">resvg</a>, so nothing depends on ImageMagick. In the browser you can drag an image in straight from another tab.</li>
<li><strong>Working copy.</strong> Large photos are halved with an alpha-aware box filter until the longest side is 2048px or less. Every later step works on that smaller copy.</li>
<li><strong>Sample.</strong> The image is divided into a grid of cells. Each cell&#39;s average colour and brightness is read straight from the raw pixel buffer using integer maths.</li>
<li><strong>Convert.</strong> The chosen look turns brightness into a glyph or mark, and the palette turns colour into the final ink.</li>
<li><strong>Draw.</strong> Cells mode uploads the grid to the GPU as a single texture with one pixel per cell. Chars mode builds the whole grid as one mesh of glyphs. Both are cached, so a frame where nothing changed costs almost nothing.</li>
<li><strong>Export.</strong> SVG writes the grid as vector XML: merged <code>&lt;rect&gt;</code> runs for cells and <code>&lt;tspan&gt;</code> rows for characters. Image exports tile the same grid you see on screen.</li>
</ol>
<h2>Tech stack</h2>
<ul>
<li><strong>Rust</strong> for the app and the image pipeline</li>
<li><strong>egui / eframe 0.32</strong>: an immediate-mode UI that runs natively and in the browser</li>
<li><strong>image</strong> and <strong>resvg</strong> for decoding and SVG rasterisation</li>
<li><strong>Trunk</strong> and <strong>wasm-bindgen</strong> for the web build</li>
<li><strong>GitHub Actions to GitHub Pages</strong>: every merge to <code>main</code> builds and deploys the web app</li>
<li><strong>rfd</strong> and <strong>arboard</strong> for native file dialogs and the clipboard on desktop</li>
</ul>
<hr>
<h2>Work log: interface simplification and performance</h2>
<p>I simplified the interface and improved performance across three pull requests, each merged to <code>main</code> and deployed.</p>
<h3>1. Simplified the sidebar (<a href="https://github.com/vedalkenDev/ascii-image-generator/pull/17">PR #17</a>)</h3>
<p><strong>Problem.</strong> The sidebar had grown into a long settings form. Choices and refinements sat side by side, so it was hard to tell what mattered first.</p>
<p><strong>What changed:</strong></p>
<ul>
<li>Rebuilt the sidebar around five sections: <strong>Look → Colour → Detail → Tune → Save</strong>.</li>
<li>Merged the mark options into one Cells / Shaded / Chars row.</li>
<li>Turned colour into a single row of live palette swatches.</li>
<li>Moved everything that refines rather than chooses (the look&#39;s setting, palette settings, image tones) behind one <strong>Tune</strong> panel with one reset.</li>
<li>Save now shows all six formats at once, with no separate vector/raster switch.</li>
<li>No feature was removed. Everything was reorganised.</li>
</ul>
<h3>2. Two rounds of optimisation (<a href="https://github.com/vedalkenDev/ascii-image-generator/pull/18">PR #18</a>)</h3>
<p><strong>Problem.</strong> The app lagged with large photos and high column counts. A 12-megapixel photo at 400 columns in Cells mode took about 19ms of main-thread work per frame just from moving the mouse. Dragging the columns slider stuttered.</p>
<p><strong>Method.</strong> I measured before changing anything:</p>
<ul>
<li>a native benchmark that times each pipeline stage (sample, convert, first frame, steady frame) at 80, 200 and 400 columns;</li>
<li>a scripted headless-Chrome run on a real GPU that drags the columns slider and hovers the sidebar, then records main-thread busy time.</li>
</ul>
<p>Every change was checked against these numbers and against before/after screenshots.</p>
<p><strong>Round 1: the drawing.</strong></p>
<ul>
<li>Cells mode used to draw thousands of separate rectangles every frame. Now it uploads one small texture per grid (one pixel per cell, nearest-neighbour scaling), and the look thumbnails do the same.</li>
<li>Reduced-motion is now checked once per second instead of on every frame.</li>
</ul>
<p><strong>Round 2: the computing.</strong></p>
<ul>
<li><strong>Chars mode as one cached mesh.</strong> Each distinct character is laid out once and stamped across the grid. The mesh is cached until the grid changes. The cache also tracks the size and state of egui&#39;s font atlas, so glyphs can&#39;t point at stale texture coordinates after the atlas is rebuilt.</li>
<li><strong>Working copy for big photos.</strong> Large photos are reduced to 2048px before processing instead of being sampled at full resolution every time.</li>
<li><strong>Faster sampling.</strong> Integer sums read directly from the raw byte buffer replaced per-pixel floating-point maths.</li>
<li><strong>Shared thumbnail sampling.</strong> The look thumbnails reuse one sampled grid instead of resampling the photo seven times.</li>
<li><strong>Smaller, faster build.</strong> The release build now optimises across the whole program (<code>lto = &quot;fat&quot;</code>, one codegen unit). The WebAssembly download dropped from 8.5MB to 7.7MB.</li>
</ul>
<p><strong>Results</strong> (12MP photo, 400 columns, headless Chrome on an Apple M1 GPU):</p>
<CaseMetric title="Cells · work per frame while hovering" before={19.4} after={2.0} unit="ms" context="12MP photo, 400 columns, headless Chrome on an Apple M1 GPU." />
<CaseMetric title="Cells · columns slider drag" before={1433} after={462} unit="ms" context="12MP photo, 400 columns, headless Chrome on an Apple M1 GPU." />
<CaseMetric title="WebAssembly download" before={8.47} after={7.67} unit="MB" context="Release build size before and after optimisation." />
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Measure</th>
<th>Before</th>
<th>After</th>
<th>Change</th>
</tr>
</thead>
<tbody><tr>
<td>Cells: work per frame while hovering</td>
<td>19.4ms</td>
<td>2.0ms</td>
<td>~10× faster</td>
</tr>
<tr>
<td>Cells: dragging the columns slider</td>
<td>1,433ms</td>
<td>462ms</td>
<td>~3× faster</td>
</tr>
<tr>
<td>Chars: dragging the columns slider</td>
<td>576ms</td>
<td>365ms</td>
<td>~1.6× faster</td>
</tr>
<tr>
<td>Chars: first frame (native)</td>
<td>8.4ms</td>
<td>1.4ms</td>
<td>~6× faster</td>
</tr>
<tr>
<td>Sampling at 400 columns (native)</td>
<td>4.8ms</td>
<td>3.7ms</td>
<td>~25% faster</td>
</tr>
<tr>
<td>WebAssembly size</td>
<td>8.47MB</td>
<td>7.67MB</td>
<td>−9%</td>
</tr>
</tbody></table>
</div>
<p>At 2ms a frame, the app now fits easily inside a 60fps budget (16.7ms).</p>
<p><strong>A bug caught along the way.</strong> The first version of the Chars mesh rendered blank in the browser even though every native test passed. egui stores glyph texture coordinates in texels and only converts them for its own text drawing, not for raw meshes. I confirmed this in egui&#39;s source, normalised the coordinates, and added a test that fails if they&#39;re ever out of range.</p>
<h3>3. Fixed cramped Chars rendering (<a href="https://github.com/vedalkenDev/ascii-image-generator/pull/19">PR #19</a>)</h3>
<p><strong>Problem.</strong> Switching to Chars squeezed the art. Glyphs were placed at the font&#39;s natural width, so when a box&#39;s shape didn&#39;t match the glyph&#39;s, the art bunched up on one side. The wide Scan thumbnail filled only its left third.</p>
<p><strong>What changed.</strong> Each glyph is now scaled to fill its cell exactly, and the thumbnails use the same rendering path as the main preview. Chars now covers the same area as Cells at any size, and stays around 2.9ms per frame at 400 columns.</p>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Before</th>
<th>After</th>
</tr>
</thead>
<tbody><tr>
<td><img loading="lazy" decoding="async" src="/work/ascii-image-generator/chars-thumbnails-before.webp" alt="Thumbnails before the fix"></td>
<td><img loading="lazy" decoding="async" src="/work/ascii-image-generator/chars-thumbnails-after.webp" alt="Thumbnails after the fix"></td>
</tr>
</tbody></table>
</div>
<p>(Left half of each image: Cells. Right half: Chars.)</p>
<h3>Quality and delivery</h3>
<ul>
<li><strong>53 automated tests</strong> cover the conversion pipeline, the working copy (tone has to stay within 1% after downscaling), and the glyph mesh (shape, colour, texture coordinates and fill).</li>
<li>Every change went through a pull request, a release build, screenshot comparison and performance measurement before merging.</li>
<li>Each merge deploys automatically through GitHub Actions to <a href="https://vedalkendev.github.io/ascii-image-generator/">GitHub Pages</a>.</li>
</ul>
<h2>What I&#39;d do next</h2>
<ul>
<li>Profile and tune the narrow, high-DPI layout that Retina laptops fall into.</li>
<li>Move image processing off the main thread with a Web Worker so very large photos never block the UI.</li>
<li>Sign and notarise the macOS build so it opens without a Gatekeeper warning.</li>
</ul>
</article>

<style>
 img { display: block; width: 100%; height: auto; }
 .table-wrap { max-width: 100%; overflow-x: auto; }
 table { border-collapse: collapse; width: 100%; }
 th, td { text-align: left; vertical-align: top; padding: .5rem; border-bottom: 1px solid color-mix(in srgb, var(--cream) 20%, transparent); }
 td:has(img) { width: 50%; }
 code { overflow-wrap: anywhere; }
</style>
