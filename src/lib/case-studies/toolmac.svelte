<script lang="ts">
	import CaseMetric from '#lib/components/CaseMetric.svelte';
	import CaseRoute from '#lib/components/CaseRoute.svelte';
	import CaseFacts from '#lib/components/CaseFacts.svelte';
</script>

<article>
<h2>A trade supplier opens its doors to everyone</h2>
<p>I researched, designed and built Toolmac&#x27;s online store. After I configured caching, the reported homepage load time fell from 12 seconds to half a second.</p>
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
<li>I was the only designer and developer on the project.</li>
<li>The stack was WordPress, WooCommerce and Elementor.</li>
<li>The catalogue is big. The homepage today lists 119 power tools, 57 welding products and 57 in its Tools category, across 11 categories and 16 brands.</li>
<li>Speed. A theme, a page builder and a slider plugin all add weight, and the site runs a lot of plugins.</li>
</ul>
<CaseFacts title="The catalogue at a glance" facts={[{ value: '119', label: 'power tools' }, { value: '57', label: 'welding products' }, { value: '57', label: 'tools category' }]} note="Counts reported in the project brief; the live catalogue may change." />
<h2>Process</h2>
<h3>Research</h3>
<p>I started with competitor research.</p>
<h3>Design in Figma first</h3>
<p>I designed the store in Figma and reviewed it with the client before building it in WordPress.</p>
<p>I started with a symmetrical heading section. When I revisited Toolmac’s brand principles, I realised symmetry was my assumption. I changed the layout to be asymmetrical so the heading felt more like Toolmac.</p>
<h3>Key decisions</h3>
<p>Shop by category and by brand. The menu gives both, and every brand has its own page. That came straight from customers: some wanted to shop by brand, others by category, so the store does both.</p>
<p>Keep the trade door open. A retail store can&#x27;t make bulk buyers feel lost. The homepage has a &quot;B2B customer?&quot; callout with a contact address, and the footer links to a credit application.</p>
<p>Content that changes by brand. I built a conditional slider that shows brand-specific content, with separate slides for desktop and for tablet and phone. That lets one template carry many brands without me hand-building a page for each.</p>
<p>Give the orange some depth. The old brand was one flat orange. I kept orange as the anchor and built a palette around it, with a deeper second orange, warm greys and near-black.</p>
<p>I carried Toolmac’s sense of humour into the store copy, including the payment FAQ.</p>
<p>The theme and page builder sped up development but added weight. I configured caching to improve load time.</p>
<CaseRoute title="Two ways to shop" sources={['Shop by category', 'Shop by brand']} destination="Product catalogue" note="Customers could browse the way they preferred; trade buyers also had a direct contact route." />
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
<figure class="product-screens">
	<img src="/work/toolmac/catalogue.webp" width="1440" height="980" loading="lazy" alt="Power tools catalogue with price and brand filters beside the products." />
	<img src="/work/toolmac/product.webp" width="1280" height="950" loading="lazy" alt="Desktop drill bit product page showing the product, size selector and purchase buttons." />
</figure>
<h2>Outcome</h2>
<CaseMetric title="Homepage load time" before={12} after={0.5} unit="seconds" context="Reported homepage load time before and after cache configuration." />
<p>The homepage load went from 12 seconds to 0.5 seconds after I set up the cache.</p>
<p>The store launched in July 2025 and is live at toolmac.co.za.</p>
<h2>What I learned</h2>
<p>I owned the project from research through launch.</p>
<p>I&#x27;d plan for the catalogue at full scale from day one. A hundred products is easy. Seven hundred to a thousand, plus variations, is a different site, and I wish I&#x27;d mapped what that bulk addition would look like before I built for it.</p>
<p>Next time I&#x27;d set up measurement before launch, with Core Web Vitals on the key pages and conversion tracking in WooCommerce, so the result section has more than one number.</p>
</article>

<style>
	.product-screens { display: grid; gap: 0.75rem; margin: 1.5rem 0; }
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
