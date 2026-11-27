/**
 * Local scoreboard. Storage is untrusted input: every read is validated, and a store that throws
 * falls back to memory for the rest of the page session.
 */

export const SCORES_KEY = 'cosmic-arcade:scores:v1';
export const MAX_SCORES = 8;

declare const initialsBrand: unique symbol;
/** Three characters, A–Z or 0–9. A skipped entry is stored as "---". */
export type Initials = string & { readonly [initialsBrand]: true };

export type ScoreEntry = { initials: Initials; score: number; reached: number; victory: boolean; at: number };

export type Board = { entries: ScoreEntry[]; persistent: boolean };

export const ANONYMOUS = '---' as Initials;

export function toInitials(raw: string): Initials | null {
	const v = raw.trim().toUpperCase();
	return /^[A-Z0-9]{3}$/.test(v) ? (v as Initials) : null;
}

function parseEntry(raw: unknown): ScoreEntry | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const r = raw as Record<string, unknown>;
	const initials = r.initials === ANONYMOUS ? ANONYMOUS : typeof r.initials === 'string' ? toInitials(r.initials) : null;
	if (!initials || r.initials !== initials) return null;
	const { score, reached, victory, at } = r;
	if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 1e8) return null;
	if (typeof reached !== 'number' || !Number.isInteger(reached) || reached < 1 || reached > 6) return null;
	if (typeof victory !== 'boolean' || typeof at !== 'number' || !Number.isFinite(at)) return null;
	return { initials, score, reached, victory, at };
}

const rank = (a: ScoreEntry, b: ScoreEntry) => b.score - a.score || a.at - b.at;

/** Accepts anything. Returns only well-formed entries, best first. */
export function parseScores(raw: unknown): ScoreEntry[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map(parseEntry)
		.filter((e): e is ScoreEntry => e !== null)
		.sort(rank)
		.slice(0, MAX_SCORES);
}

/** True when the score earns a place on a board of this shape. */
export function qualifies(entries: readonly ScoreEntry[], score: number): boolean {
	if (score <= 0) return false;
	return entries.length < MAX_SCORES || score > entries[entries.length - 1].score;
}

/** Inserts and returns the new board and the entry's 0-based place, or -1 when it fell off. */
export function insert(entries: readonly ScoreEntry[], entry: ScoreEntry): { entries: ScoreEntry[]; place: number } {
	const next = [...entries, entry].sort(rank).slice(0, MAX_SCORES);
	return { entries: next, place: next.indexOf(entry) };
}

let memory: ScoreEntry[] = [];
let broken = false;

function storage(): Storage | null {
	if (broken) return null;
	try {
		return globalThis.localStorage ?? null;
	} catch {
		broken = true;
		return null;
	}
}

export function loadBoard(): Board {
	const s = storage();
	if (!s) return { entries: memory, persistent: false };
	try {
		const text = s.getItem(SCORES_KEY);
		memory = text === null ? [] : parseScores(JSON.parse(text));
		return { entries: memory, persistent: true };
	} catch {
		// Corrupt JSON or a store that throws on read. Keep what memory already has.
		broken = true;
		return { entries: memory, persistent: false };
	}
}

export function saveBoard(entries: ScoreEntry[]): Board {
	memory = entries;
	const s = storage();
	if (!s) return { entries, persistent: false };
	try {
		s.setItem(SCORES_KEY, JSON.stringify(entries));
		return { entries, persistent: true };
	} catch {
		broken = true;
		return { entries, persistent: false };
	}
}
