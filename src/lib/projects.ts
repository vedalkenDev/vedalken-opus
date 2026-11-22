import { cartCovers, type CartCover } from '#lib/cart-covers.ts';

export type ProjectStill = {
	before: string;
	after: string;
	caption: string;
};

export type Project = {
	slug: string;
	title: string;
	year: string;
	summary: string;
	role?: string;
	result?: string;
	preview?: string;
	cover: CartCover;
	liveUrl?: string;
	liveLabel?: string;
	githubUrl?: string;
	features?: string[];
	stills?: ProjectStill[];
};

export const projects: Project[] = [
	{
		slug: 'toolmac',
		title: 'Toolmac',
		year: '2025',
		summary: 'An online store for retail shoppers and trade buyers.',
		role: 'Research, design & development',
		result: 'Homepage load: 12 sec → 0.5 sec',
		preview: '/work/toolmac/storefront.webp',
		cover: cartCovers.toolmac,
		liveUrl: 'https://toolmac.co.za/',
		liveLabel: 'Visit the Toolmac store'
	},
	{
		slug: 'plancheck',
		title: 'PlanCheck',
		year: '2026',
		summary: 'A pre-submission drawing check for South African architects.',
		role: 'Founder, product design & development',
		result: 'Testing with six beta users',
		preview: '/work/plancheck/poster.png',
		liveUrl: 'https://plancheck.vedalken.dev/waitlist',
		liveLabel: 'Join the PlanCheck waitlist',
		cover: cartCovers.plancheck
	},
	{
		slug: 'ascii-image-generator',
		title: 'Cosmic Archive ASCII',
		year: '2026',
		summary: 'A Rust app that turns photos into glyph art on the web and desktop.',
		role: 'Design & engineering',
		result: 'Hover rendering: 19.4 ms → 2.0 ms per frame',
		preview: '/work/ascii-image-generator/cells-80-columns.webp',
		cover: cartCovers['ascii-image-generator'],
		liveUrl: 'https://vedalkendev.github.io/ascii-image-generator/',
		githubUrl: 'https://github.com/vedalkenDev/ascii-image-generator',
		stills: [
			{
				before: '/work/ascii-image-generator/before-eagle.webp',
				after: '/carts/ascii-image-generator.webp',
				caption:
					'Pinterest pin of a Pixabay Eagle Nebula still, then Visor in the generator.'
			},
			{
				before: '/work/ascii-image-generator/before-seahorse.webp',
				after: '/work/ascii-image-generator/after-seahorse.webp',
				caption:
					'Pinterest pin of NASA APOD 2014 Nov 30 (Seahorse of the LMC), then Visor in the generator.'
			}
		]
	}
];

export function getProject(slug: string) {
	return projects.find((project) => project.slug === slug);
}

// Additional work from Luqmaan's CV.
export const additionalWork = [
	{
		slug: 'bargain-xpress',
		title: 'Bargain Xpress',
		url: 'https://bargainxpress.co.za/',
		image: '/work/additional/bargain-xpress.webp',
		summary: 'Designed and built a retail site in WordPress and Divi with Cerebro Creative’s senior director.'
	},
	{
		slug: 'bargain-wholesalers',
		title: 'Bargain Wholesalers',
		url: 'https://bargainwholesalers.co.za/',
		image: '/work/additional/bargain-wholesalers.webp',
		summary: 'Designed and built a wholesale site in WordPress and Divi with Cerebro Creative’s senior director.'
	},
	{
		slug: 'mip-brands',
		title: 'MIP Brands',
		image: '/work/additional/mip-brands.webp',
		summary: 'Designed and built the site in WordPress and Divi with Cerebro Creative’s senior director.',
		url: 'https://mipbrands.co.za/'
	},
	{
		title: 'AI agents and studio tools',
		graphic: 'agents',
		summary: 'Built internal AI agents and a content repurposing system for Cerebro Creative, including catalogue maintenance for supermarket websites.'
	}
];
