<article>
<h2>A trade supplier opens its doors to everyone</h2>
<p>I researched, designed and built Toolmac&#x27;s online store for retail shoppers on my own, and the homepage went from a 12 second load to half a second.</p>
<figure class="screens">
	<img src="/work/toolmac/storefront.webp" width="1440" height="980" alt="Toolmac desktop storefront with a product search and a grid of brand offers." />
	<img src="/work/toolmac/mobile.webp" width="780" height="2600" alt="Mobile homepage with a bulk pricing enquiry above the best sellers." />
</figure>
<dl>
<dt>Role</dt><dd>Lead designer and developer, Cerebro Creative</dd>
<dt>Timeline</dt><dd>March to July 2025</dd>
<dt>Tools</dt><dd>Figma, WordPress, WooCommerce, Elementor, Woodmart theme, Slider Revolution, WP Fastest Cache</dd>
<dt>Team</dt><dd>Me, working directly with the client</dd>
</dl>
<h2>The problem</h2>
<p>Toolmac Industrial Supplies has been selling tools since 1971, mostly to workshops and businesses. They wanted a store for retail customers too, where anyone could buy a heat gun or a set of hand taps online.</p>
<p>So the store had two jobs. Make a huge, technical catalogue easy for a retail shopper to browse. Keep a clear road open for the trade buyers it already had.</p>
<h2>Constraints</h2>
<ul>
<li>I was the only designer and the only developer. Every call was mine, and so was every bug.</li>
<li>The stack was WordPress, WooCommerce and Elementor.</li>
<li>The catalogue is big. The homepage today lists 119 power tools, 57 welding products and 57 in its Tools category, across 11 categories and 16 brands.</li>
<li>Speed. A theme, a page builder and a slider plugin all add weight, and the site runs a lot of plugins.</li>
</ul>
<h2>Process</h2>
<h3>Research</h3>
<p>I started with competitor research before I drew a single box.</p>
<h3>Design in Figma first</h3>
<p>I designed the whole store in Figma before building any of it, and took the designs through rounds with the client. Nothing went into WordPress until the client and I agreed on it in Figma.</p>
<h3>Key decisions</h3>
<p>Shop by category and by brand. The menu gives both, and every brand has its own page. That came straight from customers: some wanted to shop by brand, others by category, so the store does both.</p>
<p>Keep the trade door open. A retail store can&#x27;t make bulk buyers feel lost. The homepage has a &quot;B2B customer?&quot; callout with a contact address, and the footer links to a credit application.</p>
<p>Content that changes by brand. I built a conditional slider that shows brand-specific content, with separate slides for desktop and for tablet and phone. That lets one template carry many brands without me hand-building a page for each.</p>
<p>Give the orange some depth. The old brand was one flat orange. I kept orange as the anchor and built a palette around it, with a deeper second orange, warm greys and near-black.</p>
<p>Turn up the jokes. Toolmac already had a sense of humour, so I wrote more of it. Even the payment FAQ gets a line: &quot;We like to keep things simple and secure, no crypto, no gold coins, just the classics.&quot; The answer tells you to use your order number as reference &quot;so we know who to thank&quot;, and to send proof of payment &quot;if you&#x27;re in a hurry&quot;. It closes with &quot;for now, this gets the job done (like a reliable old spanner).&quot; Every line I wrote there does a job and still sounds like a person.</p>
<p>The trade-off I lived with: a theme and page builder got the store built fast, but they come with weight. I chose speed of build and then fixed the load time with caching that fits the site, not by stripping features out.</p>
<h2>What I built</h2>
<p>A WooCommerce store on the Woodmart theme, built in Elementor. On the live site today you can see:</p>
<ul>
<li>search, account sign-in and registration, and a basket with a running total in rand</li>
<li>quick view on product cards, sale badges showing the percentage off, and an &quot;Online Only&quot; label</li>
<li>products with several variants and a price range, such as drill bits</li>
<li>best sellers, specials and recently viewed products</li>
<li>a newsletter sign-up, a store locator, and policy documents for returns, shipping and terms</li>
</ul>
<p>Images load lazily, so a long product grid doesn&#x27;t load everything at once.</p>
<p>For speed, I installed WP Fastest Cache and configured it around the site&#x27;s plugins, which are many and complex.</p>
<figure class="screens">
	<img src="/work/toolmac/catalogue.webp" width="1440" height="980" loading="lazy" alt="Power tools catalogue with price and brand filters beside the products." />
	<img src="/work/toolmac/drill.webp" width="780" height="2100" loading="lazy" alt="Mobile drill bit product page with a size selector and add to basket button." />
</figure>
<h2>Outcome</h2>
<p>The homepage load went from 12 seconds to 0.5 seconds after I set up the cache.</p>
<p>The store launched in July 2025 and is live at toolmac.co.za.</p>
<h2>What I learned</h2>
<p>This was the project where I owned everything, from the first competitor tab to the last cache setting.</p>
<p>I&#x27;d plan for the catalogue at full scale from day one. A hundred products is easy. Seven hundred to a thousand, plus variations, is a different site, and I wish I&#x27;d mapped what that bulk addition would look like before I built for it.</p>
<p>Next time I&#x27;d set up measurement before launch, with Core Web Vitals on the key pages and conversion tracking in WooCommerce, so the result section has more than one number.</p>
</article>

<style>
	.screens {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
		align-items: start;
		gap: 0.6rem;
		margin: 1.5rem 0;
	}
	img { display: block; width: 100%; height: auto; }
	@media (max-width: 35rem) {
		.screens { grid-template-columns: 1fr; }
		img:nth-child(2) { max-width: 390px; justify-self: center; }
	}
</style>
