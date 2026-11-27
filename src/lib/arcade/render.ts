/**
 * ASCII canvas renderer for the simulation. Reads a Game, never writes it.
 *
 * Sprites are the illustrated sheets in art.ts. Each cell is shaded from a top-left light the way
 * the helmet is: outline glyphs keep their shape, fill cells pick a shade block from how lit they
 * are, and the silhouette carries the house chromatic split. A sprite is baked once per skin and
 * scale into an offscreen canvas; only the iridescent and ember cells are painted every frame.
 */
import {
	W,
	H,
	ZONE_TOP,
	SEGMENTS,
	BOSS_HP,
	slotPos,
	tentacleSegment,
	lashReach,
	type Game,
	type Boss,
	type Enemy,
	type Tone,
	type Vec
} from './sim.ts';
import { SHIP, DRONE, WISP, WARDEN, BOSS, BOSS_EYES, type Frame, type Sheet } from './art.ts';

const FONT = 'ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace';
const GROUND = '#050508';

export const TONES: Record<Tone, string> = {
	cream: '#f4f3e8',
	teal: '#3fb6af',
	coral: '#d96350',
	amber: '#c18d5d',
	sage: '#939e7a',
	blue: '#4277a2'
};
const VISOR = ['#592aa4', '#4277a2', '#3fb6af', '#939e7a', '#c18d5d', '#d96350'];

/** One art cell in logical units. The helmet's cells have the same 2:3 proportion. */
const CW = 2;
const CH = 3;
/** Glyph size as a share of the cell height, as on the helmet. */
const GLYPH = 0.92;
/** Bake margin, so the chromatic split is not clipped. */
const PAD = 1;

type Rgb = readonly [number, number, number];
const rgb = (hex: string): Rgb => [
	parseInt(hex.slice(1, 3), 16),
	parseInt(hex.slice(3, 5), 16),
	parseInt(hex.slice(5, 7), 16)
];
const mix = (a: Rgb, b: Rgb, u: number): Rgb => [
	a[0] + (b[0] - a[0]) * u,
	a[1] + (b[1] - a[1]) * u,
	a[2] + (b[2] - a[2]) * u
];
const css = (c: Rgb) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Shadow, body and highlight of one material. */
type Ramp = readonly [Rgb, Rgb, Rgb];
const ramp = (mid: string, shadow = 0.66, shine = 0.66): Ramp => {
	const m = rgb(mid);
	return [mix(m, rgb(GROUND), shadow), m, mix(m, rgb(TONES.cream), shine)];
};
const lit = (r: Ramp, light: number): Rgb => {
	const u = clamp01(light);
	return u < 0.5 ? mix(r[0], r[1], u * 2) : mix(r[1], r[2], u * 2 - 1);
};

const SKINS = {
	ship: [rgb('#2e3a48'), rgb('#c3cdd1'), rgb('#fbfaf2')],
	drone: ramp(TONES.teal),
	wisp: ramp(TONES.amber),
	warden: ramp(TONES.sage),
	hurt: ramp(TONES.coral),
	boss: [rgb('#1a1238'), rgb('#4a5fa0'), rgb('#b9cde6')],
	rage: [rgb('#24123c'), rgb('#99467a'), rgb('#f6c4ac')],
	flash: [rgb('#8a897f'), rgb('#f4f3e8'), rgb('#ffffff')]
} satisfies Record<string, Ramp>;
type Skin = keyof typeof SKINS;

/** Pupil ink: the ground with a little violet in it, so eyes read soft rather than as holes. */
const INK = '#120c22';

/** Paint letters that pin a material. `k` is a panel line and `m` is ink, so neither takes much light. */
const PINS: Record<string, Ramp> = {
	k: [rgb('#0e1116'), rgb('#1f262e'), rgb('#3a434c')],
	m: [rgb(INK), rgb(INK), rgb('#2c2140')],
	w: ramp(TONES.cream, 0.5, 0.5),
	t: ramp(TONES.teal),
	c: ramp(TONES.coral),
	a: ramp(TONES.amber),
	s: ramp(TONES.sage),
	p: ramp(VISOR[0], 0.5, 0.4)
};

const SHEETS = { ship: SHIP, drone: DRONE, wisp: WISP, warden: WARDEN, boss: BOSS } satisfies Record<string, Sheet>;
type SheetName = keyof typeof SHEETS;

/**
 * `under` lays a fill beneath a cell that does not cover it: an eye sits on the body or on the
 * visor around it, ink sits on the body, and an inner half block shows body through its open half.
 * A dithered fill gets a dark `shade` of its own material, so nothing behind a sprite shows through.
 */
type Cell = {
	x: number;
	y: number;
	glyph: string;
	light: number;
	pin: string;
	edgeL: boolean;
	edgeR: boolean;
	under: '' | 'body' | 'visor' | 'shade';
};
/** A frame measured once: its size in cells, the cells to bake, and the cells painted live. */
type Shape = { cols: number; rows: number; baked: Cell[]; live: Cell[] };

/** Fill glyph by light, as the helmet picks shade blocks by depth. */
const FILL = '▓';
const fill = (light: number) => (light > 0.66 ? '█' : light > 0.36 ? '▓' : '▒');
/** Each half block, and the neighbour its open half faces. */
const HALF: Record<string, readonly [number, number]> = { '▀': [0, 1], '▄': [0, -1], '▌': [1, 0], '▐': [-1, 0] };
const LIVE = new Set(['v', 'e', 'o']);

function measure(frame: Frame): Shape {
	const glyphs = frame.glyphs.map((r) => [...r]);
	const paint = frame.paint.map((r) => [...r]);
	const rows = glyphs.length;
	const cols = glyphs[0].length;
	const solid = (x: number, y: number) => y >= 0 && y < rows && x >= 0 && x < cols && glyphs[y][x] !== ' ';
	// How far inside the silhouette a cell sits, by erosion. Deep cells bulge toward the light.
	const inset: number[][] = glyphs.map((r, y) => r.map((_, x) => (solid(x, y) ? 1 : 0)));
	for (let depth = 1, grew = true; grew; depth++) {
		grew = false;
		for (let y = 0; y < rows; y++)
			for (let x = 0; x < cols; x++) {
				if (inset[y][x] !== depth) continue;
				let inner = true;
				for (let dy = -1; dy <= 1 && inner; dy++)
					for (let dx = -1; dx <= 1; dx++) if ((inset[y + dy]?.[x + dx] ?? 0) < depth) inner = false;
				if (inner) {
					inset[y][x] = depth + 1;
					grew = true;
				}
			}
	}
	const deepest = Math.max(1, ...inset.flat());
	const baked: Cell[] = [];
	const live: Cell[] = [];
	for (let y = 0; y < rows; y++)
		for (let x = 0; x < cols; x++) {
			if (!solid(x, y)) continue;
			const pin = paint[y]?.[x] ?? ' ';
			const nx = ((x + 0.5) / cols) * 2 - 1;
			const ny = ((y + 0.5) / rows) * 2 - 1;
			const bulge = (inset[y][x] - 1) / Math.max(1, deepest - 1);
			const light =
				0.5 - 0.3 * nx - 0.28 * ny + 0.3 * (bulge - 0.35) + (pin === '+' ? 0.28 : pin === '-' ? -0.3 : 0);
			const g = glyphs[y][x];
			let under: Cell['under'] = '';
			const open = HALF[g];
			if (pin === 'o') under = paint[y]?.[x - 1] === 'v' || paint[y]?.[x + 1] === 'v' ? 'visor' : 'body';
			else if (pin === 'm' || (open && solid(x + open[0], y + open[1]))) under = 'body';
			else if (g === FILL && fill(light) !== '█') under = 'shade';
			const cell: Cell = {
				x: (x + 0.5) * CW,
				y: (y + 0.5) * CH,
				glyph: g === FILL ? fill(light) : g,
				light,
				pin,
				edgeL: !solid(x - 1, y),
				edgeR: !solid(x + 1, y),
				under
			};
			(LIVE.has(pin) ? live : baked).push(cell);
		}
	return { cols, rows, baked, live };
}

const SHAPES = Object.fromEntries(
	Object.entries(SHEETS).map(([name, sheet]) => [name, sheet.map(measure)])
) as Record<SheetName, Shape[]>;

type Stars = { x: number; y: number; z: number; glyph: string }[];

export type View = {
	ctx: CanvasRenderingContext2D;
	scale: number;
	stars: Stars;
	reduced: boolean;
	/** Baked sprites for the current scale. */
	baked: Map<string, HTMLCanvasElement>;
	bakedAt: number;
};

export function createView(canvas: HTMLCanvasElement, reduced: boolean): View | null {
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	const stars: Stars = [];
	let s = 0x2f6b;
	const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
	for (let i = 0; i < 70; i++) {
		const z = r();
		stars.push({ x: r() * W, y: r() * H, z, glyph: z > 0.85 ? '+' : z > 0.5 ? '·' : '.' });
	}
	return { ctx, scale: 1, stars, reduced, baked: new Map(), bakedAt: 0 };
}

/** Matches the canvas backing store to its CSS box. Returns the scale from logical units. */
export function fit(view: View, canvas: HTMLCanvasElement): void {
	const box = canvas.getBoundingClientRect();
	const dpr = Math.min(2, window.devicePixelRatio || 1);
	const w = Math.max(1, Math.round(box.width * dpr));
	const h = Math.max(1, Math.round(box.height * dpr));
	if (canvas.width !== w || canvas.height !== h) {
		canvas.width = w;
		canvas.height = h;
	}
	view.scale = w / W;
}

/** An offscreen canvas `w` by `h` logical units, painted once per scale and key. */
function cached(view: View, key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
	if (view.bakedAt !== view.scale) {
		view.baked.clear();
		view.bakedAt = view.scale;
	}
	let canvas = view.baked.get(key);
	if (canvas) return canvas;
	canvas = document.createElement('canvas');
	canvas.width = Math.ceil(w * view.scale);
	canvas.height = Math.ceil(h * view.scale);
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		paint(ctx);
	}
	view.baked.set(key, canvas);
	return canvas;
}

/** Block elements, U+2580 to U+259F. They are stretched to tile their cell so volumes read solid. */
const isBlock = (g: string) => g >= '▀' && g <= '▟';

/** Draws one art cell. Blocks tile the cell, linework is set bold so the contour carries. */
function cell(ctx: CanvasRenderingContext2D, g: string, x: number, y: number) {
	if (!isBlock(g)) {
		ctx.font = `bold ${CH * GLYPH}px ${FONT}`;
		ctx.fillText(g, x, y);
		return;
	}
	ctx.font = `${CH * GLYPH}px ${FONT}`;
	// Measure the inked box, not the advance: fallback fonts draw blocks narrower than they step.
	const m = ctx.measureText('█');
	const wide = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
	const tall = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
	const sx = (CW * 0.96) / wide;
	const sy = (CH * 0.96) / tall;
	ctx.save();
	ctx.translate(
		x - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * sx,
		y - ((m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2) * sy
	);
	ctx.scale(sx, sy);
	ctx.fillText(g, 0, 0);
	ctx.restore();
}

function bake(view: View, name: SheetName, frame: number, skin: Skin) {
	const s = SHAPES[name][frame];
	return cached(view, `${name}:${frame}:${skin}`, s.cols * CW + PAD * 2, s.rows * CH + PAD * 2, (ctx) => {
		ctx.translate(PAD, PAD);
		const body = SKINS[skin];
		const flat = skin === 'flash';
		for (const c of [...s.baked, ...s.live]) {
			if (c.under === 'body') ctx.fillStyle = css(lit(body, c.light));
			else if (c.under === 'shade') ctx.fillStyle = css(lit((!flat && PINS[c.pin]) || body, c.light - 0.45));
			else continue;
			cell(ctx, '█', c.x, c.y);
		}
		// The house chromatic split rides the silhouette: teal off the left edge, coral off the right.
		ctx.globalAlpha = 0.45;
		for (const c of [...s.baked, ...s.live]) {
			if (c.edgeL) {
				ctx.fillStyle = TONES.teal;
				cell(ctx, c.glyph, c.x - 0.5, c.y);
			}
			if (c.edgeR) {
				ctx.fillStyle = TONES.coral;
				cell(ctx, c.glyph, c.x + 0.5, c.y);
			}
		}
		ctx.globalAlpha = 1;
		for (const c of s.baked) {
			const pin = flat ? undefined : PINS[c.pin];
			// Linework is inked a step brighter than the surface it bounds.
			const light = pin || isBlock(c.glyph) ? c.light : Math.max(0.55, c.light + 0.15);
			ctx.fillStyle = css(lit(pin ?? body, light));
			cell(ctx, c.glyph, c.x, c.y);
		}
	});
}

/** The visor gradient, sampled smoothly. `u` wraps. */
function visor(u: number): string {
	const f = (((u % 1) + 1) % 1) * VISOR.length;
	const i = Math.floor(f);
	return css(mix(rgb(VISOR[i]), rgb(VISOR[(i + 1) % VISOR.length]), f - i));
}

const EMBER = [rgb(TONES.coral), rgb(TONES.amber), rgb(TONES.cream)] as const;
function ember(t: number, x: number): string {
	const u = (Math.sin(t * 31 + x * 1.7) + Math.sin(t * 17.3 + x)) * 0.25 + 0.5;
	return css(u < 0.5 ? mix(EMBER[0], EMBER[1], u * 2) : mix(EMBER[1], EMBER[2], u * 2 - 1));
}

/** Top-left corner of a sheet centred on (x, y), snapped to device pixels so bakes stay crisp. */
function origin(view: View, s: Shape, x: number, y: number): Vec {
	const { scale } = view;
	return {
		x: Math.round((x - (s.cols * CW) / 2) * scale) / scale,
		y: Math.round((y - (s.rows * CH) / 2) * scale) / scale
	};
}

/** Where a sprite's eyes look, in logical units off centre, and whether they are shut. */
type Gaze = { x: number; y: number; shut: boolean };
const AHEAD: Gaze = { x: 0, y: 0.25, shut: false };

/** A sprite eye: a round ink pupil with a cream catchlight, or a soft line while it blinks. */
function eye(ctx: CanvasRenderingContext2D, c: Cell, x: number, y: number, t: number, flat: boolean, gaze: Gaze) {
	if (c.under === 'visor') {
		ctx.fillStyle = flat ? TONES.cream : visor(t * 0.45 + c.x * 0.012 + c.y * 0.02);
		cell(ctx, '█', x, y);
	}
	if (flat) return;
	ctx.fillStyle = INK;
	if (gaze.shut) {
		ctx.font = `bold ${CH * 0.8}px ${FONT}`;
		ctx.fillText('-', x, y + 0.3);
		return;
	}
	ctx.font = `${CH * 0.8}px ${FONT}`;
	ctx.fillText('●', x + gaze.x, y + gaze.y);
	ctx.fillStyle = TONES.cream;
	ctx.font = `${CH * 0.34}px ${FONT}`;
	ctx.fillText('●', x + gaze.x - 0.38, y + gaze.y - 0.48);
}

/** Draws a sheet frame centred on (x, y): the baked body, then its live cells. */
function sprite(
	view: View,
	name: SheetName,
	frame: number,
	skin: Skin,
	x: number,
	y: number,
	t: number,
	gaze: Gaze = AHEAD
) {
	const { ctx, scale } = view;
	const s = SHAPES[name][frame];
	const img = bake(view, name, frame, skin);
	const o = origin(view, s, x, y);
	ctx.drawImage(img, o.x - PAD, o.y - PAD, img.width / scale, img.height / scale);
	if (s.live.length === 0) return;
	const flat = skin === 'flash';
	for (const c of s.live) {
		const cx = o.x + c.x;
		const cy = o.y + c.y;
		if (c.pin === 'o') {
			eye(ctx, c, cx, cy, t, flat, gaze);
			continue;
		}
		ctx.fillStyle = flat ? TONES.cream : c.pin === 'v' ? visor(t * 0.45 + c.x * 0.012 + c.y * 0.02) : ember(t, c.x);
		cell(ctx, c.glyph, cx, cy);
	}
}

/** Eyes follow the ship a little, and each critter blinks on its own beat unless motion is reduced. */
function gazeAt(view: View, from: Vec, to: Vec, t: number, seed: number): Gaze {
	return {
		x: Math.max(-1, Math.min(1, (to.x - from.x) / 70)) * 0.32,
		y: Math.max(-1, Math.min(1, (to.y - from.y) / 160)) * 0.36,
		shut: !view.reduced && (t + seed * 1.37) % 5.3 < 0.14
	};
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size = 9) {
	ctx.font = `${size}px ${FONT}`;
	ctx.fillStyle = color;
	ctx.fillText(s, x, y);
}

/** The house chromatic split: coral right, teal left, cream on top. */
function split(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color = TONES.cream) {
	ctx.font = `${size}px ${FONT}`;
	ctx.fillStyle = TONES.coral;
	ctx.fillText(s, x + 0.6, y);
	ctx.fillStyle = TONES.teal;
	ctx.fillText(s, x - 0.6, y);
	ctx.fillStyle = color;
	ctx.fillText(s, x, y);
}

function drawStars(view: View, t: number, speed: number) {
	const { ctx, stars } = view;
	ctx.font = `7px ${FONT}`;
	for (const st of stars) {
		ctx.globalAlpha = 0.18 + st.z * 0.4;
		ctx.fillStyle = st.z > 0.85 ? TONES.teal : TONES.cream;
		ctx.fillText(st.glyph, st.x, (st.y + t * speed * (0.3 + st.z)) % H);
	}
	ctx.globalAlpha = 1;
}

function drawZone(ctx: CanvasRenderingContext2D) {
	ctx.font = `7px ${FONT}`;
	ctx.fillStyle = TONES.cream;
	ctx.globalAlpha = 0.12;
	for (let x = 4; x < W; x += 10) ctx.fillText('-', x, ZONE_TOP - 18);
	ctx.globalAlpha = 1;
}

function enemySkin(e: Enemy): Skin {
	if (e.flash > 0) return 'flash';
	if (e.kind === 'warden' && e.hp === 1) return 'hurt';
	return e.kind;
}

function drawEnemies(view: View, g: Game) {
	const frame = view.reduced ? 0 : Math.floor(g.time * 2.5) & 1;
	for (const e of g.enemies) {
		if (e.motion.kind === 'entering' && e.motion.t < 0) continue;
		const gaze = gazeAt(view, e, g.ship, g.time, e.id);
		sprite(view, e.kind, e.motion.kind === 'diving' ? 1 : frame, enemySkin(e), e.x, e.y, g.time, gaze);
	}
}

/** Empty slots read as faint dots so the formation stays legible as it thins. */
function drawSlots(view: View, g: Game) {
	if (g.stage.kind !== 'wave') return;
	const { ctx } = view;
	const p: Vec = { x: 0, y: 0 };
	ctx.globalAlpha = 0.08;
	for (const e of g.enemies) {
		if (!e.slot || e.motion.kind === 'formation') continue;
		slotPos(g, e.slot, p);
		text(ctx, '·', p.x, p.y, TONES.cream, 9);
	}
	ctx.globalAlpha = 1;
}

function drawShip(view: View, g: Game) {
	const s = g.ship;
	if (s.kind !== 'alive' || g.stage.kind === 'ended') return;
	if (s.invuln > 0 && Math.floor(s.invuln * 12) % 2 === 0) return;
	sprite(view, 'ship', 0, 'ship', s.x, s.y, g.time);
}

function drawBullets(view: View, g: Game) {
	const { ctx } = view;
	for (const b of g.bullets) {
		if (b.from === 'player') {
			text(ctx, '|', b.x, b.y, TONES.teal, 9);
			text(ctx, '|', b.x, b.y - 1, TONES.cream, 5);
		} else {
			text(ctx, '•', b.x, b.y, TONES.coral, 9);
			text(ctx, '·', b.x - 0.6, b.y - 0.6, TONES.cream, 6);
		}
	}
}

function drawParticles(view: View, g: Game) {
	const { ctx } = view;
	ctx.font = `8px ${FONT}`;
	for (const p of g.particles) {
		ctx.globalAlpha = Math.max(0, p.life / p.max);
		ctx.fillStyle = TONES[p.tone];
		ctx.fillText(p.glyph, p.x, p.y);
	}
	ctx.globalAlpha = 1;
}

type Tint = 'calm' | 'rage' | 'warn' | 'strike';
const BEAD_TINTS: Record<Tint, Ramp> = {
	calm: SKINS.boss,
	rage: SKINS.rage,
	warn: SKINS.flash,
	strike: ramp(TONES.coral, 0.5, 0.7)
};

/** One tentacle bead: a lit sphere in three stacked glyphs, tapering from root to tip. */
function bead(view: View, i: number, tint: Tint) {
	const size = 7 - i * 0.4;
	const box = size + 2;
	return cached(view, `bead:${i}:${tint}`, box, box, (ctx) => {
		const r = BEAD_TINTS[tint];
		const c = box / 2;
		ctx.font = `${size}px ${FONT}`;
		ctx.fillStyle = css(r[0]);
		ctx.fillText('●', c + 0.3, c + 0.4);
		ctx.font = `${size * 0.72}px ${FONT}`;
		ctx.fillStyle = css(mix(r[0], r[1], 0.85));
		ctx.fillText('●', c - size * 0.06, c - size * 0.06);
		ctx.font = `${size * 0.4}px ${FONT}`;
		ctx.fillStyle = css(r[2]);
		ctx.fillText('●', c - size * 0.16, c - size * 0.17);
	});
}

function drawTentacles(view: View, boss: Boss, fade: number) {
	const { ctx, scale } = view;
	const seg: Vec = { x: 0, y: 0 };
	const p2 = boss.phase === 2;
	for (let k = 0; k < boss.tentacles.length; k++) {
		const lash = boss.tentacles[k].lash;
		let tint: Tint = p2 ? 'rage' : 'calm';
		if (lash.kind === 'telegraph' && Math.floor(boss.clock * 14) % 2 === 0) tint = 'warn';
		if (lashReach(lash) > 0) tint = 'strike';
		// Tip first, so each bead overlaps the one further out.
		for (let i = SEGMENTS - 1; i >= 0; i--) {
			tentacleSegment(boss, k, i, seg);
			const img = bead(view, i, tint);
			const w = img.width / scale;
			ctx.drawImage(img, seg.x - w / 2, seg.y - w / 2, w, w);
		}
		tentacleSegment(boss, k, SEGMENTS - 1, seg);
		text(ctx, '@', seg.x, seg.y + 2.4, tint === 'calm' ? TONES.teal : TONES.coral, 4.5);
		if (lash.kind === 'telegraph') {
			// A dotted line where the lash will land.
			ctx.globalAlpha = fade * (0.25 + 0.25 * Math.sin(boss.clock * 30));
			for (let y = ZONE_TOP - 20; y < H; y += 10) text(ctx, ':', lash.targetX, y, TONES.coral, 9);
			ctx.globalAlpha = fade;
		}
	}
}

function drawBoss(view: View, g: Game, boss: Boss) {
	if (g.stage.kind === 'ended') return;
	const { ctx } = view;
	const p2 = boss.phase === 2;
	const dying = boss.mood.kind === 'dying' ? boss.mood.t : 0;
	const fade = dying > 0 ? Math.max(0, 1 - dying / 2.6) : 1;
	ctx.globalAlpha = fade;
	drawTentacles(view, boss, fade);
	const skin: Skin = boss.flash > 0 ? 'flash' : p2 ? 'rage' : 'boss';
	// Dreamy and half-lidded until the second phase wakes it; it blinks slowly either way.
	const blink = !view.reduced && Math.sin(boss.clock * 0.9) > 0.985;
	const awake = p2 || boss.mood.kind === 'shifting';
	const face = blink ? 2 : awake ? 0 : 1;
	sprite(view, 'boss', face, skin, boss.x, boss.y, boss.clock * (p2 ? 2 : 1));
	if (face !== 2 && skin !== 'flash') drawBossPupils(view, g, boss, face === 1);
	ctx.globalAlpha = 1;
}

/** Both pupils look toward the ship, kept inside the whites and under the lids. */
function drawBossPupils(view: View, g: Game, boss: Boss, lidded: boolean) {
	const { ctx } = view;
	const o = origin(view, SHAPES.boss[0], boss.x, boss.y);
	const lx = Math.max(-1, Math.min(1, (g.ship.x - boss.x) / 60)) * 2;
	const ly = Math.max(0, Math.min(1, (g.ship.y - boss.y) / 200)) * 1.2;
	for (const e of BOSS_EYES) {
		const ex = o.x + (e.col + 0.5) * CW;
		const ey = o.y + (e.row + 0.5) * CH;
		ctx.save();
		ctx.beginPath();
		// The whites span the eye's three rows; a lid covers everything above the middle row's centre.
		const top = lidded ? ey : ey - CH * 1.5;
		ctx.rect(ex - CW * 2.5, top, CW * 5, ey + CH * 1.5 - top);
		ctx.clip();
		const px = ex + lx;
		const py = ey + ly + (lidded ? 1.2 : 0);
		text(ctx, '●', px, py, INK, 8);
		text(ctx, '●', px - 1.3, py - 1.4, TONES.cream, 2.6);
		ctx.restore();
	}
}

function drawBossBar(view: View, boss: Boss) {
	const { ctx } = view;
	const x0 = 22;
	const x1 = W - 22;
	const y = 22;
	const n = 30;
	const filled = Math.ceil((Math.max(0, boss.hp) / BOSS_HP) * n);
	ctx.textAlign = 'left';
	text(ctx, 'THE UNWRITTEN', x0, y - 7, TONES.cream, 7);
	ctx.textAlign = 'right';
	text(ctx, boss.phase === 2 ? 'phase ii' : 'phase i', x1, y - 7, boss.phase === 2 ? TONES.coral : TONES.sage, 7);
	ctx.textAlign = 'left';
	const cell = (x1 - x0) / n;
	ctx.font = `8px ${FONT}`;
	for (let i = 0; i < n; i++) {
		ctx.fillStyle = i < filled ? VISOR[Math.floor((i / n) * VISOR.length)] : TONES.cream;
		ctx.globalAlpha = i < filled ? 1 : 0.15;
		ctx.fillText(i < filled ? '█' : '░', x0 + i * cell, y + 2);
	}
	ctx.globalAlpha = 1;
	ctx.textAlign = 'center';
}

function drawHud(view: View, g: Game) {
	const { ctx } = view;
	ctx.textAlign = 'left';
	text(ctx, String(g.score).padStart(6, '0'), 6, H - 4, TONES.cream, 8);
	ctx.textAlign = 'right';
	const lives = '^'.repeat(Math.max(0, g.lives)) + '·'.repeat(Math.max(0, 3 - g.lives));
	text(ctx, lives, W - 6, H - 4, TONES.teal, 8);
	ctx.textAlign = 'center';
	const label = g.reached === 6 ? 'boss' : `wave ${g.reached}/5`;
	ctx.globalAlpha = 0.6;
	text(ctx, label, W / 2, H - 4, TONES.sage, 7);
	ctx.globalAlpha = 1;
}

function drawBanner(view: View, g: Game) {
	const st = g.stage;
	if (st.kind !== 'banner') return;
	const { ctx } = view;
	const a = Math.min(1, st.t * 3, (1.9 - st.t) * 3);
	ctx.globalAlpha = Math.max(0, a);
	if (st.next === 'boss') {
		split(ctx, 'WARNING', W / 2, H * 0.4, 16, TONES.coral);
		text(ctx, 'something unwritten stirs', W / 2, H * 0.4 + 16, TONES.cream, 8);
	} else {
		split(ctx, `WAVE ${st.next}`, W / 2, H * 0.4, 16);
		text(ctx, WAVE_NAMES[st.next - 1], W / 2, H * 0.4 + 16, TONES.sage, 8);
	}
	ctx.globalAlpha = 1;
}

const WAVE_NAMES = ['outer drift', 'signal bloom', 'ash nebula', 'the curators', 'event horizon'];

function clear(view: View) {
	const { ctx } = view;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.fillStyle = GROUND;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function draw(view: View, g: Game): void {
	const { ctx, scale } = view;
	clear(view);
	// Shake moves whole device pixels so baked sprites stay crisp.
	const shake = view.reduced ? 0 : g.shake * 3;
	const ox = shake ? Math.round(Math.sin(g.time * 91) * shake * scale) : 0;
	const oy = shake ? Math.round(Math.cos(g.time * 77) * shake * scale) : 0;
	ctx.setTransform(scale, 0, 0, scale, ox, oy);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	drawStars(view, view.reduced ? 0 : g.time, g.stage.kind === 'banner' ? 34 : 14);
	drawZone(ctx);
	const boss = g.stage.kind === 'boss' ? g.stage.boss : null;
	if (boss) drawBoss(view, g, boss);
	drawSlots(view, g);
	drawEnemies(view, g);
	drawBullets(view, g);
	drawShip(view, g);
	drawParticles(view, g);
	drawBanner(view, g);
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	if (boss) drawBossBar(view, boss);
	drawHud(view, g);
	ctx.textAlign = 'start';
}

/** The title screen's cast, in the band below the title panel. */
const CAST: readonly Enemy['kind'][] = ['wisp', 'warden', 'drone', 'warden', 'wisp'];

/** Idle attract loop for the title screen: the same sprites as play, idling under the menu. */
/**
 * `above` is how far down the screen, as a share of its height, text laid over the attract reaches.
 * The cast stands clear of it, and steps off stage a row at a time when there is no room above the ship.
 */
export function drawAttract(view: View, time: number, above = 0): void {
	const { ctx, scale } = view;
	clear(view);
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	const t = view.reduced ? 0 : time;
	drawStars(view, t, 10);
	const frame = view.reduced ? 0 : Math.floor(t * 2.5) & 1;
	const sway = Math.sin(t * 0.5) * 8;
	const ship: Vec = { x: W / 2 + Math.sin(t * 0.7) * 30, y: H - 30 };
	// Half a 7-row sprite plus its bob, half a drone, and the clear space kept around each row.
	const text = above * H;
	const floor = ship.y - 21;
	const castY = Math.max(H * 0.69, text + 19);
	const both = castY + 33 <= floor;
	const droneY = both ? castY + 24 : Math.max(H * 0.69 + 24, text + 15);
	if (both) {
		CAST.forEach((kind, i) => {
			const at: Vec = { x: W / 2 + (i - 2) * 34 + sway, y: castY + Math.sin(t * 1.3 + i) * 2 };
			sprite(view, kind, frame, kind, at.x, at.y, t, gazeAt(view, at, ship, t, i));
		});
	}
	if (droneY + 9 <= floor) {
		for (let i = 0; i < 4; i++) {
			const at: Vec = { x: W / 2 + (i - 1.5) * 30 - sway, y: droneY };
			sprite(view, 'drone', frame ^ (i & 1), 'drone', at.x, at.y, t, gazeAt(view, at, ship, t, i + 5));
		}
	}
	sprite(view, 'ship', 0, 'ship', ship.x, ship.y, t);
	ctx.textAlign = 'start';
}
