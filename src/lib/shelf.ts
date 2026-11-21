import data from './shelf.json';

export type Book = {
	isbn: string;
	title: string;
	author: string;
	category?: string;
	series?: string;
	seriesNo?: number;
};

// Edit src/lib/shelf.json, then run `node scripts/shelf.mjs` to fetch new covers.
export const books: Book[] = data;

export const filterKeys = ['category', 'author', 'series'] as const;
export type FilterKey = (typeof filterKeys)[number];

// Distinct values for one filter, sorted, skipping books without that field.
export const optionsFor = (key: FilterKey) =>
	[...new Set(books.map((b) => b[key]).filter((v): v is string => !!v))].sort((a, b) =>
		a.localeCompare(b)
	);

// ISBNs may be written with hyphens or spaces; files use the bare digits.
const id = (book: Book) => book.isbn.replace(/[\s-]/g, '').toUpperCase();

export const coverSrc = (book: Book) => `/shelf/${id(book)}-600.webp`;
export const coverSrcset = (book: Book) =>
	`/shelf/${id(book)}-600.webp 600w, /shelf/${id(book)}-1200.webp 1200w`;
