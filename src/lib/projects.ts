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
	githubUrl?: string;
	stills?: ProjectStill[];
};

export const projects: Project[] = [
	{
		slug: 'plancheck',
		title: 'PlanCheck',
		year: '2026',
		summary: 'In progress.',
		cover: cartCovers.plancheck
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
		title: 'ASCII image generator',
		year: '2026',
		summary:
			'Four looks: Visor, Blocks, CRT amber, and ANSI. Download PNG, WebP, or JPEG. Copy text and copy image. SVG opens through in-process resvg on desktop and web, long side capped at 2048px. The web build is the same app compiled to wasm.',
		cover: cartCovers['ascii-image-generator'],
		liveUrl: 'https://vedalkendev.github.io/ascii-image-generator/',
		githubUrl: 'https://github.com/vedalkenDev/ascii-image-generator',
		stills: [
			{
				before: '/work/ascii-image-generator/before-eagle.jpg',
				after: '/work/ascii-image-generator/after-eagle.png',
				caption:
					'Pinterest pin of a Pixabay Eagle Nebula still, then Visor in the generator.'
			},
			{
				before: '/work/ascii-image-generator/before-seahorse.jpg',
				after: '/work/ascii-image-generator/after-seahorse.png',
				caption:
					'Pinterest pin of NASA APOD 2014 Nov 30 (Seahorse of the LMC), then Visor in the generator.'
			}
		]
	}
];

export function getProject(slug: string) {
	return projects.find((project) => project.slug === slug);
}
