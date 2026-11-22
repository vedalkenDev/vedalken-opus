import { error } from '@sveltejs/kit';
import { additionalWork } from '#lib/projects.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	additionalWork.filter((item) => item.slug).map((item) => ({ slug: item.slug! }));

export const load: PageLoad = ({ params }) => {
	const project = additionalWork.find((item) => item.slug === params.slug);
	if (!project || !project.image || !project.url) error(404, 'Not found');
	return { project };
};
