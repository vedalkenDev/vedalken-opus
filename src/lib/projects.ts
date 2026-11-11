import { cartCovers, type CartCover } from '#lib/cart-covers.ts';

export type Project = {
	slug: string;
	title: string;
	year: string;
	summary: string;
	cover: CartCover;
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
	}
];

export function getProject(slug: string) {
	return projects.find((project) => project.slug === slug);
}
