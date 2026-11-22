import { additionalWork, projects } from '#lib/projects.ts';

const origin = 'https://vedalken.dev';
const homeDescription = 'Luqmaan Sayed is a creative web developer in Durban, designing and building websites, interfaces and tools.';

export function metadataFor(pathname: string) {
	const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
	const pages: Record<string, { title: string; description: string }> = {
		'/': { title: 'Luqmaan Sayed · Creative Web Developer', description: homeDescription },
		'/work': { title: 'Work · Luqmaan Sayed', description: 'Selected websites, products and tools designed and built by Luqmaan Sayed.' },
		'/about': { title: 'About · Luqmaan Sayed', description: 'Luqmaan Sayed is a creative web developer in Durban, working across design, development and AI systems.' },
		'/shelf': { title: 'My library · Luqmaan Sayed', description: 'A personal library of books collected by Luqmaan Sayed.' },
		'/work/ai-training': { title: 'AI agent training & starter kit · Luqmaan Sayed', description: 'Two sessions teaching a creative team how to build and use AI agents.' }
	};
	for (const project of projects) pages[`/work/${project.slug}`] = { title: `${project.title} · Luqmaan Sayed`, description: project.summary };
	for (const project of additionalWork) if (project.slug) pages[`/work/more/${project.slug}`] = { title: `${project.title} · Luqmaan Sayed`, description: project.summary };
	return { ...(pages[path] ?? pages['/']), url: `${origin}${path}`, image: `${origin}/social-preview.png` };
}
