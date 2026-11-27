import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, STEP, ZONE_TOP, ZONE_BOTTOM, SHIP_EDGE, W, type Game, type GameEvent } from '../src/lib/arcade/sim.ts';
import { SHIP, DRONE, WISP, WARDEN, BOSS } from '../src/lib/arcade/art.ts';
import { parseScores, qualifies, insert, toInitials, ANONYMOUS, MAX_SCORES, type ScoreEntry } from '../src/lib/arcade/scores.ts';

/** Steers under the nearest target and holds fire. */
function aim(g: Game) {
	const s = g.ship;
	let tx = W / 2;
	if (g.stage.kind === 'boss') tx = g.stage.boss.x;
	else {
		let best = Infinity;
		for (const e of g.enemies) {
			const d = Math.abs(e.x - s.x) + (e.y < 0 ? 999 : 0);
			if (d < best) {
				best = d;
				tx = e.x;
			}
		}
	}
	return { x: Math.max(-1, Math.min(1, (tx - s.x) / 6)), y: 0, fire: true };
}

function run(g: Game, seconds: number, shielded: boolean, idle = false) {
	const events: GameEvent[] = [];
	for (let t = 0; t < seconds && g.stage.kind !== 'ended'; t += STEP) {
		if (shielded && g.ship.kind === 'alive') g.ship.invuln = 1;
		step(g, idle ? { x: 0, y: 0, fire: false } : aim(g), STEP);
		events.push(...g.events);
		g.events.length = 0;
	}
	return events;
}

test('a shielded pilot clears five waves, both boss phases, and wins', () => {
	const g = createGame(7);
	const events = run(g, 900, true);
	const cleared = events.filter((e) => e.kind === 'cleared').map((e) => (e.kind === 'cleared' ? e.wave : 0));
	assert.deepEqual(cleared, [1, 2, 3, 4, 5]);
	assert.ok(events.some((e) => e.kind === 'banner' && e.next === 'boss'));
	assert.ok(events.some((e) => e.kind === 'bossPhase'));
	assert.ok(events.some((e) => e.kind === 'bossDown'));
	assert.equal(g.stage.kind, 'ended');
	assert.equal(g.stage.kind === 'ended' && g.stage.outcome, 'victory');
	assert.equal(g.reached, 6);
	assert.ok(g.score > 5000 + 3 * 1000, `score ${g.score}`);
});

test('an idle pilot loses three lives and the game ends in defeat', () => {
	const g = createGame(3);
	const events = run(g, 600, false, true);
	const downs = events.filter((e) => e.kind === 'down');
	assert.equal(downs.length, 3);
	assert.equal(g.lives, 0);
	assert.equal(g.stage.kind === 'ended' && g.stage.outcome, 'defeat');
});

test('the ship stays in the lower playfield and diagonals are not faster', () => {
	const g = createGame(1);
	for (let i = 0; i < 400; i++) step(g, { x: -1, y: -1, fire: false }, STEP);
	assert.equal(g.ship.kind, 'alive');
	assert.equal(g.ship.y, ZONE_TOP);
	assert.equal(g.ship.x, SHIP_EDGE);
	const h = createGame(1);
	const d = createGame(1);
	step(h, { x: 1, y: 0, fire: false }, 0.1);
	step(d, { x: 1, y: 1, fire: false }, 0.1);
	const dh = h.ship.x - W / 2;
	const dd = Math.hypot(d.ship.x - W / 2, d.ship.y - (ZONE_BOTTOM - 6));
	assert.ok(dd <= dh + 1e-9, `diagonal ${dd} vs straight ${dh}`);
});

test('respawn grants invulnerability', () => {
	const h = createGame(3);
	let sawShield = false;
	for (let t = 0; t < 600 && h.lives === 3; t += STEP) step(h, { x: 0, y: 0, fire: false }, STEP);
	for (let t = 0; t < 3; t += STEP) {
		step(h, { x: 0, y: 0, fire: false }, STEP);
		if (h.ship.kind === 'alive' && h.ship.invuln > 0) sawShield = true;
	}
	assert.ok(sawShield);
});

const entry = (score: number, at: number, initials = 'ABC'): ScoreEntry => ({
	initials: toInitials(initials) ?? ANONYMOUS,
	score,
	reached: 3,
	victory: false,
	at
});

test('scores reject malformed storage and keep the best entries', () => {
	assert.deepEqual(parseScores('nope'), []);
	assert.deepEqual(parseScores(null), []);
	const raw = [
		entry(10, 1),
		{ initials: 'abc', score: 5, reached: 1, victory: false, at: 1 },
		{ initials: 'TOOLONG', score: 5, reached: 1, victory: false, at: 1 },
		{ initials: 'XYZ', score: -1, reached: 1, victory: false, at: 1 },
		{ initials: 'XYZ', score: 1.5, reached: 1, victory: false, at: 1 },
		{ initials: 'XYZ', score: 9, reached: 9, victory: false, at: 1 },
		{ initials: '---', score: 40, reached: 6, victory: true, at: 2 },
		7
	];
	const parsed = parseScores(raw);
	assert.deepEqual(
		parsed.map((e) => [e.initials, e.score]),
		[
			['---', 40],
			['ABC', 10]
		]
	);
});

test('initials accept three letters or digits only', () => {
	assert.equal(toInitials(' a1z '), 'A1Z');
	assert.equal(toInitials('ab'), null);
	assert.equal(toInitials('a-b'), null);
	assert.equal(toInitials('abcd'), null);
});

test('a full board only admits a better score', () => {
	let board: ScoreEntry[] = [];
	for (let i = 0; i < MAX_SCORES; i++) board = insert(board, entry(100 * (i + 1), i)).entries;
	assert.equal(board.length, MAX_SCORES);
	assert.equal(qualifies(board, 100), false);
	assert.equal(qualifies(board, 101), true);
	assert.equal(qualifies([], 0), false);
	const { entries, place } = insert(board, entry(450, 99));
	assert.equal(entries.length, MAX_SCORES);
	assert.equal(place, MAX_SCORES - 4);
});

test('every art frame is a rectangle with paint that only marks drawn cells', () => {
	const sheets = { SHIP, DRONE, WISP, WARDEN, BOSS };
	for (const [name, sheet] of Object.entries(sheets)) {
		const cols = [...sheet[0].glyphs[0]].length;
		sheet.forEach((frame, f) => {
			assert.equal(frame.glyphs.length, frame.paint.length, `${name}[${f}] rows`);
			frame.glyphs.forEach((row, y) => {
				const glyphs = [...row];
				const paint = [...frame.paint[y]];
				assert.equal(glyphs.length, cols, `${name}[${f}] glyph row ${y}`);
				assert.equal(paint.length, cols, `${name}[${f}] paint row ${y}`);
				paint.forEach((p, x) => assert.ok(p === ' ' || glyphs[x] !== ' ', `${name}[${f}] paint on empty cell ${x},${y}`));
			});
		});
	}
});
