#!/usr/bin/env node
// Builds the /shelf covers as WebP at two widths (600w, 1200w).
//
//   node scripts/shelf.mjs            # only books without covers yet
//   node scripts/shelf.mjs --force    # rebuild every cover
//
// Source per book, first match wins:
//   1. assets/shelf-sources/<isbn>.{jpg,jpeg,png,webp}  (your own photo/scan of your edition)
//   2. Amazon's full-size cover for the ISBN-10 (usually ~1700px wide)
//   3. Open Library cover (333px wide, last resort)
// Downloaded covers are saved to assets/shelf-sources/<isbn>.jpg so builds are repeatable.
//
// Needs: cwebp, sips (macOS).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const books = JSON.parse(readFileSync(join(root, 'src/lib/shelf.json'), 'utf8'));
const sources = join(root, 'assets/shelf-sources');
const out = join(root, 'static/shelf');
const force = process.argv.includes('--force');
const WIDTHS = [600, 1200];
const MIN_SOURCE_WIDTH = 300;

mkdirSync(sources, { recursive: true });
mkdirSync(out, { recursive: true });

const clean = (isbn) => String(isbn).replace(/[\s-]/g, '').toUpperCase();
const built = (isbn) => WIDTHS.every((w) => existsSync(join(out, `${isbn}-${w}.webp`)));
const pending = books.filter((b) => force || !built(clean(b.isbn)));
if (pending.length === 0) {
	console.log('shelf: nothing to build');
	process.exit(0);
}

let failed = 0;
for (const book of pending) {
	const { title } = book;
	const isbn = clean(book.isbn);
	if (!/^[0-9X]{10,13}$/.test(isbn)) {
		console.error(`  ${title}: bad isbn "${isbn}"`);
		failed++;
		continue;
	}
	try {
		const { path, from } = await source(isbn);
		const width = pixelWidth(path);
		for (const w of WIDTHS) {
			execFileSync('cwebp', [
				'-quiet', '-q', '86', '-m', '6', '-sharp_yuv', '-metadata', 'none',
				'-resize', String(w), '0', '-resize_mode', 'down_only',
				path, '-o', join(out, `${isbn}-${w}.webp`)
			]);
		}
		console.log(`  ${title}: ${from}, ${width}px wide`);
	} catch (err) {
		console.error(`  ${title}: ${err.message}`);
		failed++;
	}
}
process.exit(failed ? 1 : 0);

async function source(isbn) {
	for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
		const p = join(sources, `${isbn}.${ext}`);
		if (existsSync(p)) return { path: p, from: 'local file' };
	}
	const p = join(sources, `${isbn}.jpg`);
	const isbn10 = toIsbn10(isbn);
	const candidates = [
		isbn10 && ['Amazon', `https://m.media-amazon.com/images/P/${isbn10}.01._SCRMZZZZZZ_.jpg`],
		['Open Library', `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`]
	].filter(Boolean);
	for (const [from, url] of candidates) {
		const res = await fetch(url, { redirect: 'follow' });
		if (!res.ok) continue;
		writeFileSync(p, Buffer.from(await res.arrayBuffer()));
		// Amazon answers a missing cover with a 1x1 placeholder, so check the size.
		if (pixelWidth(p) >= MIN_SOURCE_WIDTH) return { path: p, from };
	}
	rmSync(p, { force: true });
	throw new Error(`no cover found; drop a photo at assets/shelf-sources/${isbn}.jpg`);
}

function pixelWidth(path) {
	const info = execFileSync('sips', ['-g', 'pixelWidth', path], { encoding: 'utf8' });
	return Number(info.match(/pixelWidth: (\d+)/)?.[1] ?? 0);
}

function toIsbn10(isbn) {
	if (isbn.length === 10) return isbn;
	if (!isbn.startsWith('978')) return null;
	const body = isbn.slice(3, 12);
	const sum = [...body].reduce((s, d, i) => s + Number(d) * (10 - i), 0);
	const check = (11 - (sum % 11)) % 11;
	return body + (check === 10 ? 'X' : String(check));
}
