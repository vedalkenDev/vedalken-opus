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
	cover: CartCover;
	liveUrl?: string;
	liveLabel?: string;
	githubUrl?: string;
	features?: string[];
	stills?: ProjectStill[];
};

export const projects: Project[] = [
	{
		slug: 'plancheck',
		title: 'PlanCheck',
		year: '2026',
		summary: 'A pre-submission drawing check for South African architects.',
		liveUrl: 'https://plancheck.vedalken.dev/waitlist',
		liveLabel: 'Join the PlanCheck waitlist',
		cover: cartCovers.plancheck
	},
	{
		slug: 'toolmac',
		title: 'Toolmac',
		year: '2025',
		summary: 'An online tool store for retail shoppers and trade buyers.',
		cover: cartCovers.toolmac,
		liveUrl: 'https://toolmac.co.za/',
		liveLabel: 'Visit the Toolmac store'
	},
	{
		slug: 'zone-of-awareness',
		title: 'Zone of Awareness',
		year: '2026',
		summary: 'In progress.',
		cover: cartCovers['zone-of-awareness']
	},
	{
		slug: 'burning-wish',
		title: 'Burning Wish',
		year: '2026',
		summary: 'In progress.',
		cover: cartCovers['burning-wish']
	},
	{
		slug: 'ascii-image-generator',
		title: 'Cosmic Archive ASCII',
		year: '2026',
		summary: 'A browser and desktop app that turns photos into ASCII and glyph art in seven looks, built in Rust and compiled to WebAssembly.',
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
