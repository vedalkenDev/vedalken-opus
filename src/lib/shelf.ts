import data from './shelf.json';

export type Book = {
	isbn: string;
	title: string;
	author: string;
};

// Edit src/lib/shelf.json, then run `node scripts/shelf.mjs` to fetch new covers.
export const books: Book[] = data;

// ISBNs may be written with hyphens or spaces; files use the bare digits.
const id = (book: Book) => book.isbn.replace(/[\s-]/g, '').toUpperCase();

export const coverSrc = (book: Book) => `/shelf/${id(book)}-600.webp`;
export const coverSrcset = (book: Book) =>
	`/shelf/${id(book)}-600.webp 600w, /shelf/${id(book)}-1200.webp 1200w`;
