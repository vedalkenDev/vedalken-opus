/**
 * Cosmic arcade simulation. Plain data plus a fixed-step update: no DOM, no clocks, no randomness
 * outside the seeded generator. The overlay owns one Game, steps it, and drains `events`.
 */

export const W = 240;
export const H = 320;
export const STEP = 1 / 60;
export const LIVES = 3;
export const BOSS_HP = 90;
export const SEGMENTS = 10;
/** Seconds the last explosion plays before the overlay shows results. */
export const END_DELAY = 1.8;
/** The ship flies only in the lower playfield. */
export const ZONE_TOP = Math.round(H * 0.6);
export const ZONE_BOTTOM = H - 24;
/** Half the ship's width: its centre stays this far from the side walls. */
export const SHIP_EDGE = 15;

const SHIP_SPEED = 118;
const SHIP_R = 4.5;
const SHOT_SPEED = 290;
const SHOT_COOLDOWN = 0.19;
const MAX_SHOTS = 3;
/** Hit radius per kind, sized to the drawn sprite. */
const ENEMY_R: Record<EnemyKind, number> = { drone: 7.5, wisp: 8, warden: 9 };
/** Formation pitch, sized so the illustrated sprites never touch. */
const PITCH_X = 28;
const PITCH_Y = 24;
const INVULN = 2.4;
const RESPAWN = 1.4;
const BANNER = 1.9;
const MAX_PARTICLES = 420;
const BOSS_Y = 74;
const BOSS_RX = 31;
const BOSS_RY = 16;
const LASH_TELEGRAPH = 0.75;
const LASH_STRIKE = 0.6;
const LASH_RETRACT = 0.5;

export type Vec = { x: number; y: number };
export type Input = { x: number; y: number; fire: boolean; dash?: Vec };
export type Power = 'rapid' | 'spread' | 'dash';
export const POWERS: readonly Power[] = ['rapid', 'spread', 'dash'];
export type Outcome = 'victory' | 'defeat';
export type EnemyKind = 'drone' | 'wisp' | 'warden';
export type WaveNumber = 1 | 2 | 3 | 4 | 5;
/** Furthest point reached: a wave, or 6 for the boss. */
export type Reached = WaveNumber | 6;
export type Tone = 'cream' | 'teal' | 'coral' | 'amber' | 'sage' | 'blue';

type WaveSpec = {
	name: string;
	rows: readonly EnemyKind[];
	cols: number;
	diveEvery: number;
	divers: number;
	shots: number;
	speed: number;
};

export const WAVES: readonly WaveSpec[] = [
	{ name: 'Outer drift', rows: ['drone', 'drone'], cols: 6, diveEvery: 2.6, divers: 1, shots: 1, speed: 1 },
	{ name: 'Signal bloom', rows: ['wisp', 'drone', 'drone'], cols: 6, diveEvery: 2.2, divers: 2, shots: 1, speed: 1.08 },
	{ name: 'Ash nebula', rows: ['wisp', 'wisp', 'drone', 'drone'], cols: 6, diveEvery: 1.9, divers: 2, shots: 2, speed: 1.16 },
	{ name: 'The curators', rows: ['warden', 'wisp', 'wisp', 'drone'], cols: 6, diveEvery: 1.6, divers: 3, shots: 2, speed: 1.24 },
	{ name: 'Event horizon', rows: ['warden', 'warden', 'wisp', 'drone'], cols: 6, diveEvery: 1.3, divers: 3, shots: 3, speed: 1.34 }
];

export const ENEMY_TONE: Record<EnemyKind, Tone> = { drone: 'teal', wisp: 'amber', warden: 'sage' };
const POINTS: Record<EnemyKind, number> = { drone: 50, wisp: 80, warden: 150 };
const HP: Record<EnemyKind, number> = { drone: 1, wisp: 1, warden: 2 };
const SPARKS = ['*', '+', '·', 'x', '°', '.'];

/** Cubic Bézier. `d` of an entry path is rewritten every step to track the swaying slot. */
type Path = { a: Vec; b: Vec; c: Vec; d: Vec; dur: number };

/** `t` is seconds into the path. A negative entry `t` waits off stage. */
export type EnemyMotion =
	| { kind: 'entering'; path: Path; t: number }
	| { kind: 'formation' }
	| { kind: 'diving'; path: Path; t: number; shots: number; nextShot: number; speed: number }
	| { kind: 'returning' };

export type Enemy = {
	id: number;
	kind: EnemyKind;
	hp: number;
	/** Formation slot in grid units. Null for boss spawn, which vanishes after one dive. */
	slot: Vec | null;
	x: number;
	y: number;
	motion: EnemyMotion;
	flash: number;
	power?: Power;
};

export type Bullet = { x: number; y: number; vx: number; vy: number; from: 'player' | 'enemy'; spent: boolean };

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; glyph: string; tone: Tone };

export type Ship =
	| { kind: 'alive'; x: number; y: number; invuln: number; cooldown: number }
	| { kind: 'down'; x: number; y: number; t: number };

export type Lash =
	| { kind: 'idle' }
	| { kind: 'telegraph'; t: number; targetX: number }
	| { kind: 'strike'; t: number; targetX: number }
	| { kind: 'retract'; t: number; targetX: number };

export type Tentacle = { root: number; phase: number; lash: Lash };

export type BossMood =
	| { kind: 'arriving'; t: number }
	| { kind: 'fighting' }
	| { kind: 'shifting'; t: number }
	| { kind: 'dying'; t: number };

export type Boss = {
	x: number;
	y: number;
	hp: number;
	phase: 1 | 2;
	mood: BossMood;
	/** Animation clock. Always runs. */
	clock: number;
	/** Drift angle and amplitude. Integrated so phase changes never jump. */
	drift: number;
	amp: number;
	volley: number;
	stream: number;
	spawn: number;
	lash: number;
	flash: number;
	tentacles: Tentacle[];
};

export type Stage =
	| { kind: 'banner'; next: WaveNumber | 'boss'; t: number }
	| { kind: 'wave'; wave: WaveNumber; diveIn: number }
	| { kind: 'boss'; boss: Boss }
	| { kind: 'ended'; outcome: Outcome; t: number; boss: Boss | null };

export type GameEvent =
	| { kind: 'shot' }
	| { kind: 'hit' }
	| { kind: 'kill'; points: number }
	| { kind: 'down'; lives: number }
	| { kind: 'banner'; next: WaveNumber | 'boss' }
	| { kind: 'cleared'; wave: WaveNumber; bonus: number }
	| { kind: 'bossPhase' }
	| { kind: 'bossDown' }
	| { kind: 'power'; power: Power; level: number }
	| { kind: 'ended'; outcome: Outcome };

export type Game = {
	seed: number;
	time: number;
	score: number;
	lives: number;
	reached: Reached;
	ship: Ship;
	enemies: Enemy[];
	bullets: Bullet[];
	particles: Particle[];
	powers: Record<Power, { level: number; remaining: number }>;
	drops: (Vec & { power: Power })[];
	dash: { direction: Vec; remaining: number; cooldown: number };
	stage: Stage;
	shake: number;
	nextId: number;
	/** Drained by the overlay after each frame. */
	events: GameEvent[];
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const dist2 = (a: Vec, b: Vec) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const easeOut = (u: number) => 1 - (1 - u) ** 3;
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

/** mulberry32 over the game's own seed. */
const rand = (g: Game) => {
	g.seed = (g.seed + 0x6d2b79f5) | 0;
	let t = g.seed;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const bez = (p: Path, u: number, out: Vec) => {
	const v = 1 - u;
	const k0 = v * v * v;
	const k1 = 3 * v * v * u;
	const k2 = 3 * v * u * u;
	const k3 = u * u * u;
	out.x = k0 * p.a.x + k1 * p.b.x + k2 * p.c.x + k3 * p.d.x;
	out.y = k0 * p.a.y + k1 * p.b.y + k2 * p.c.y + k3 * p.d.y;
};

/** Squared distance from p to segment ab. */
const segDist2 = (p: Vec, a: Vec, b: Vec) => {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = dx * dx + dy * dy;
	const u = len === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len, 0, 1);
	return (p.x - a.x - dx * u) ** 2 + (p.y - a.y - dy * u) ** 2;
};

export function createGame(seed = 1): Game {
	return {
		seed,
		time: 0,
		score: 0,
		lives: LIVES,
		reached: 1,
		ship: { kind: 'alive', x: W / 2, y: ZONE_BOTTOM - 6, invuln: 0, cooldown: 0 },
		enemies: [],
		bullets: [],
		particles: [],
		powers: { rapid: { level: 0, remaining: 0 }, spread: { level: 0, remaining: 0 }, dash: { level: 0, remaining: 0 } },
		drops: [],
		dash: { direction: { x: 0, y: 0 }, remaining: 0, cooldown: 0 },
		stage: { kind: 'banner', next: 1, t: 0 },
		shake: 0,
		nextId: 1,
		events: [{ kind: 'banner', next: 1 }]
	};
}

/** World position of a formation slot. The grid sways and breathes. */
export function slotPos(g: Game, slot: Vec, out: Vec): void {
	const breathe = 1 + Math.sin(g.time * 1.4) * 0.03;
	out.x = W / 2 + Math.sin(g.time * 0.5) * 8 + slot.x * PITCH_X * breathe;
	out.y = 42 + slot.y * PITCH_Y * breathe;
}

/** 0 at rest, 1 when a lash is fully extended. */
export function lashReach(lash: Lash): number {
	if (lash.kind === 'strike') return Math.min(1, lash.t / 0.18);
	if (lash.kind === 'retract') return Math.max(0, 1 - lash.t / LASH_RETRACT);
	return 0;
}

/** Segment i of tentacle k. Shared by collision and drawing so they never disagree. */
export function tentacleSegment(boss: Boss, k: number, i: number, out: Vec): void {
	const tc = boss.tentacles[k];
	const f = i / (SEGMENTS - 1);
	const speed = boss.phase === 2 ? 2.6 : 1.7;
	const rootX = boss.x + tc.root;
	const rootY = boss.y + 14;
	let x = boss.x + tc.root * (1 + f * 0.7) + Math.sin(boss.clock * speed + tc.phase + i * 0.5) * f * 9;
	let y = rootY + i * 4.4;
	const reach = lashReach(tc.lash);
	if (reach > 0 && tc.lash.kind !== 'idle') {
		const lx = rootX + (tc.lash.targetX - rootX) * f;
		const ly = rootY + (H - 8 - rootY) * f;
		x += (lx - x) * reach;
		y += (ly - y) * reach;
	}
	out.x = x;
	out.y = y;
}

export function step(g: Game, input: Input, dt: number): void {
	g.time += dt;
	if (g.stage.kind !== 'ended') {
		for (const power of POWERS) {
			const effect = g.powers[power];
			effect.remaining = Math.max(0, effect.remaining - dt);
			if (effect.remaining === 0) effect.level = 0;
		}
		g.dash.cooldown = Math.max(0, g.dash.cooldown - dt);
		for (const drop of g.drops) {
			drop.y += 38 * dt;
			if (g.ship.kind === 'alive' && dist2(drop, g.ship) < 14 ** 2) {
				const effect = g.powers[drop.power];
				effect.level = Math.min(3, effect.level + 1);
				effect.remaining = 40;
				g.events.push({ kind: 'power', power: drop.power, level: effect.level });
				drop.y = H + 20;
			}
		}
		g.drops = g.drops.filter((drop) => drop.y < H + 12);
	}
	g.shake = Math.max(0, g.shake - dt * 2.5);
	const st = g.stage;
	switch (st.kind) {
		case 'banner':
			st.t += dt;
			if (st.t >= BANNER) begin(g, st.next);
			break;
		case 'wave':
			waveStep(g, st, dt);
			break;
		case 'boss':
			bossStep(g, st.boss, dt);
			break;
		case 'ended':
			st.t += dt;
			if (st.boss) st.boss.clock += dt;
			break;
	}
	if (g.stage.kind !== 'ended') shipStep(g, input, dt);
	enemiesStep(g, dt);
	for (const b of g.bullets) {
		b.x += b.vx * dt;
		b.y += b.vy * dt;
	}
	collide(g);
	g.bullets = g.bullets.filter((b) => !b.spent && b.y > -12 && b.y < H + 12 && b.x > -12 && b.x < W + 12);
	g.enemies = g.enemies.filter((e) => e.hp > 0);
	for (const p of g.particles) {
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vx *= 0.97;
		p.vy *= 0.97;
		p.life -= dt;
	}
	g.particles = g.particles.filter((p) => p.life > 0);
}

function announce(g: Game, next: WaveNumber | 'boss') {
	g.stage = { kind: 'banner', next, t: 0 };
	g.events.push({ kind: 'banner', next });
}

function begin(g: Game, next: WaveNumber | 'boss') {
	if (next === 'boss') {
		g.reached = 6;
		g.stage = { kind: 'boss', boss: createBoss() };
		return;
	}
	g.reached = next;
	g.stage = { kind: 'wave', wave: next, diveIn: 3 };
	const spec = WAVES[next - 1];
	spec.rows.forEach((kind, r) => {
		const side = r % 2 === 0 ? -1 : 1;
		for (let c = 0; c < spec.cols; c++) {
			const slot = { x: c - (spec.cols - 1) / 2, y: r };
			const order = side < 0 ? spec.cols - 1 - c : c;
			const a = { x: W / 2 + side * (W / 2 + 24), y: 150 + r * 8 };
			g.enemies.push({
				id: g.nextId++,
				kind,
				hp: HP[kind],
				slot,
				x: a.x,
				y: a.y,
				flash: 0,
				power: rand(g) < 0.3 ? POWERS[Math.floor(rand(g) * POWERS.length)] : undefined,
				motion: {
					kind: 'entering',
					t: -(r * 0.7 + order * 0.11),
					path: {
						a,
						b: { x: W / 2 - side * 10, y: 220 },
						c: { x: W / 2 + slot.x * PITCH_X - side * 40, y: 150 },
						d: { x: 0, y: 0 },
						dur: 1.9 / spec.speed
					}
				}
			});
		}
	});
}

function waveStep(g: Game, st: Extract<Stage, { kind: 'wave' }>, dt: number) {
	if (g.enemies.length === 0) {
		const bonus = 250 * st.wave;
		g.score += bonus;
		g.events.push({ kind: 'cleared', wave: st.wave, bonus });
		announce(g, st.wave === 5 ? 'boss' : ((st.wave + 1) as WaveNumber));
		return;
	}
	if (g.ship.kind !== 'alive') return;
	st.diveIn -= dt;
	if (st.diveIn > 0) return;
	const spec = WAVES[st.wave - 1];
	// Stragglers dive harder so a wave never stalls.
	const urgency = g.enemies.length <= 4 ? 0.5 : 1;
	st.diveIn = spec.diveEvery * urgency * (0.75 + rand(g) * 0.5);
	const diving = g.enemies.filter((e) => e.motion.kind === 'diving').length;
	const ready = g.enemies.filter((e) => e.motion.kind === 'formation');
	let n = Math.min(spec.divers - diving, ready.length);
	while (n-- > 0) {
		const [e] = ready.splice(Math.floor(rand(g) * ready.length), 1);
		dive(g, e, spec.shots, spec.speed);
	}
}

function dive(g: Game, e: Enemy, shots: number, speed: number) {
	if (e.power === 'dash') speed *= 1.4;
	if (e.power === 'rapid') shots += 2;
	const side = e.x < W / 2 ? -1 : 1;
	const sx = g.ship.x;
	e.motion = {
		kind: 'diving',
		t: 0,
		shots,
		speed,
		nextShot: 0.3 + rand(g) * 0.15,
		path: {
			a: { x: e.x, y: e.y },
			b: { x: e.x + side * 38, y: e.y - 34 },
			c: { x: sx - side * 60, y: H * 0.66 },
			d: { x: clamp(sx + side * (20 + rand(g) * 30), 10, W - 10), y: H + 24 },
			dur: (2.5 + rand(g) * 0.4) / speed
		}
	};
}

function enemyShot(g: Game, x: number, y: number, speed: number) {
	const dx = g.ship.x + (rand(g) - 0.5) * 24 - x;
	const dy = Math.max(40, g.ship.y - y);
	const len = Math.hypot(dx, dy);
	const v = 100 * speed;
	g.bullets.push({ x, y: y + 8, vx: (dx / len) * v, vy: (dy / len) * v, from: 'enemy', spent: false });
}

const scratch: Vec = { x: 0, y: 0 };

function enemiesStep(g: Game, dt: number) {
	for (const e of g.enemies) {
		e.flash = Math.max(0, e.flash - dt);
		const m = e.motion;
		switch (m.kind) {
			case 'entering': {
				m.t += dt;
				if (m.t < 0) break;
				if (e.slot) slotPos(g, e.slot, m.path.d);
				const u = Math.min(1, m.t / m.path.dur);
				bez(m.path, easeInOut(u), e);
				if (u >= 1) e.motion = { kind: 'formation' };
				break;
			}
			case 'formation':
				if (e.slot) slotPos(g, e.slot, e);
				break;
			case 'diving': {
				m.t += dt;
				const u = m.t / m.path.dur;
				bez(m.path, Math.min(1, u), e);
				if (m.shots > 0 && u >= m.nextShot && g.stage.kind !== 'ended') {
					m.shots--;
					m.nextShot += e.power === 'rapid' ? 0.10 : 0.18;
					enemyShot(g, e.x, e.y, m.speed);
					if (e.power === 'spread') enemyShot(g, e.x + 7, e.y, m.speed);
				}
				if (u < 1) break;
				if (!e.slot) {
					e.hp = 0;
					break;
				}
				slotPos(g, e.slot, scratch);
				e.x = scratch.x;
				e.y = -16;
				e.motion = { kind: 'returning' };
				break;
			}
			case 'returning': {
				if (!e.slot) {
					e.hp = 0;
					break;
				}
				slotPos(g, e.slot, scratch);
				const dx = scratch.x - e.x;
				const dy = scratch.y - e.y;
				const d = Math.hypot(dx, dy);
				const v = 95 * dt;
				if (d <= v + 0.5) {
					e.motion = { kind: 'formation' };
					e.x = scratch.x;
					e.y = scratch.y;
				} else {
					e.x += (dx / d) * v;
					e.y += (dy / d) * v;
				}
				break;
			}
		}
	}
}

function shipStep(g: Game, input: Input, dt: number) {
	const s = g.ship;
	if (s.kind === 'down') {
		s.t += dt;
		if (s.t >= RESPAWN) {
			g.ship = { kind: 'alive', x: W / 2, y: ZONE_BOTTOM - 6, invuln: INVULN, cooldown: 0.3 };
			for (const b of g.bullets) if (b.from === 'enemy') b.spent = true;
		}
		return;
	}
	let ix = clamp(input.x, -1, 1);
	let iy = clamp(input.y, -1, 1);
	const m = Math.hypot(ix, iy);
	if (m > 1) {
		ix /= m;
		iy /= m;
	}
	if (input.dash && g.powers.dash.level && g.dash.cooldown === 0) {
		const length = Math.hypot(input.dash.x, input.dash.y);
		if (length > 0) {
			g.dash.direction = { x: input.dash.x / length, y: input.dash.y / length };
			g.dash.remaining = 0.16;
			g.dash.cooldown = 1.2 - g.powers.dash.level * 0.2;
		}
	}
	const dashing = g.dash.remaining > 0;
	const speed = dashing ? SHIP_SPEED * (2 + g.powers.dash.level * 0.35) : SHIP_SPEED;
	s.x = clamp(s.x + (dashing ? g.dash.direction.x : ix) * speed * dt, SHIP_EDGE, W - SHIP_EDGE);
	s.y = clamp(s.y + (dashing ? g.dash.direction.y : iy) * speed * dt, ZONE_TOP, ZONE_BOTTOM);
	g.dash.remaining = Math.max(0, g.dash.remaining - dt);
	s.invuln = Math.max(0, s.invuln - dt);
	s.cooldown = Math.max(0, s.cooldown - dt);
	if (!input.fire || s.cooldown > 0) return;
	let mine = 0;
	for (const b of g.bullets) if (b.from === 'player') mine++;
	const spread = g.powers.spread.level;
	if (mine >= MAX_SHOTS * (1 + spread * 2) * (1 + g.powers.rapid.level)) return;
	for (let i = -spread; i <= spread; i++) {
		g.bullets.push({ x: s.x, y: s.y - 14, vx: i * 38, vy: -SHOT_SPEED, from: 'player', spent: false });
	}
	s.cooldown = SHOT_COOLDOWN / (1 + g.powers.rapid.level * 0.35);
	g.events.push({ kind: 'shot' });
}

function burst(g: Game, x: number, y: number, tone: Tone, n: number, speed = 70) {
	for (let i = 0; i < n; i++) {
		const a = rand(g) * Math.PI * 2;
		const v = 18 + rand(g) * speed;
		const life = 0.45 + rand(g) * 0.55;
		g.particles.push({
			x,
			y,
			vx: Math.cos(a) * v,
			vy: Math.sin(a) * v,
			life,
			max: life,
			glyph: SPARKS[Math.floor(rand(g) * SPARKS.length)],
			tone
		});
	}
	if (g.particles.length > MAX_PARTICLES) g.particles.splice(0, g.particles.length - MAX_PARTICLES);
}

function end(g: Game, outcome: Outcome) {
	const boss = g.stage.kind === 'boss' ? g.stage.boss : null;
	g.stage = { kind: 'ended', outcome, t: 0, boss };
	g.events.push({ kind: 'ended', outcome });
}

function shipDown(g: Game) {
	const s = g.ship;
	burst(g, s.x, s.y, 'cream', 22, 80);
	burst(g, s.x, s.y, 'coral', 14, 50);
	g.lives--;
	g.dash.remaining = 0;
	g.shake = 1;
	g.ship = { kind: 'down', x: s.x, y: s.y, t: 0 };
	g.events.push({ kind: 'down', lives: g.lives });
	if (g.lives <= 0) end(g, 'defeat');
}

function damage(g: Game, e: Enemy) {
	e.hp--;
	e.flash = 0.12;
	if (e.hp > 0) {
		g.events.push({ kind: 'hit' });
		return;
	}
	const points = POINTS[e.kind] * (e.motion.kind === 'diving' ? 2 : 1);
	if (e.power && rand(g) < 0.5) g.drops.push({ x: e.x, y: e.y, power: e.power });
	g.score += points;
	burst(g, e.x, e.y, ENEMY_TONE[e.kind], 14);
	g.events.push({ kind: 'kill', points });
}

const live = (e: Enemy) => e.hp > 0 && !(e.motion.kind === 'entering' && e.motion.t < 0);

function collide(g: Game) {
	const boss = g.stage.kind === 'boss' ? g.stage.boss : null;
	for (const b of g.bullets) {
		if (b.from !== 'player' || b.spent) continue;
		for (const e of g.enemies) {
			if (!live(e) || dist2(b, e) >= (ENEMY_R[e.kind] + 2) ** 2) continue;
			b.spent = true;
			damage(g, e);
			break;
		}
		if (!b.spent && boss) hitBoss(g, boss, b);
	}
	if (g.stage.kind === 'ended') return;

	let s = g.ship;
	if (s.kind !== 'alive' || s.invuln > 0) return;
	for (const b of g.bullets) {
		if (b.from !== 'enemy' || b.spent || dist2(b, s) >= (SHIP_R + 1.5) ** 2) continue;
		b.spent = true;
		shipDown(g);
		return;
	}
	for (const e of g.enemies) {
		if (!live(e) || e.motion.kind !== 'diving' || dist2(e, s) >= (ENEMY_R[e.kind] + SHIP_R - 1) ** 2) continue;
		e.hp = 1;
		damage(g, e);
		shipDown(g);
		return;
	}
	if (!boss) return;
	const a: Vec = { x: 0, y: 0 };
	const c: Vec = { x: 0, y: 0 };
	for (let k = 0; k < boss.tentacles.length; k++) {
		if (lashReach(boss.tentacles[k].lash) < 0.5) continue;
		tentacleSegment(boss, k, 0, a);
		for (let i = 1; i < SEGMENTS; i++) {
			tentacleSegment(boss, k, i, c);
			if (segDist2(s, a, c) < (SHIP_R + 3) ** 2) {
				shipDown(g);
				return;
			}
			a.x = c.x;
			a.y = c.y;
		}
	}
}

function createBoss(): Boss {
	const roots = [-15, -9, -3, 3, 9, 15];
	return {
		x: W / 2,
		y: -60,
		hp: BOSS_HP,
		phase: 1,
		mood: { kind: 'arriving', t: 0 },
		clock: 0,
		drift: 0,
		amp: 60,
		volley: 2,
		stream: 0,
		spawn: 6,
		lash: 2.5,
		flash: 0,
		tentacles: roots.map((root, i) => ({ root, phase: i * 1.1, lash: { kind: 'idle' } }))
	};
}

function hitBoss(g: Game, boss: Boss, b: Bullet) {
	const dx = (b.x - boss.x) / BOSS_RX;
	const dy = (b.y - boss.y) / BOSS_RY;
	if (dx * dx + dy * dy > 1) return;
	b.spent = true;
	if (boss.mood.kind !== 'fighting') return;
	boss.hp--;
	boss.flash = 0.08;
	g.score += 10;
	burst(g, b.x, b.y, 'cream', 3, 40);
	g.events.push({ kind: 'hit' });
	if (boss.hp <= 0) {
		boss.mood = { kind: 'dying', t: 0 };
		g.shake = 1;
		g.events.push({ kind: 'bossDown' });
		for (const e of g.enemies) {
			if (e.hp <= 0) continue;
			burst(g, e.x, e.y, ENEMY_TONE[e.kind], 8);
			e.hp = 0;
		}
		for (const o of g.bullets) if (o.from === 'enemy') o.spent = true;
		for (const t of boss.tentacles) t.lash = { kind: 'idle' };
	} else if (boss.phase === 1 && boss.hp <= BOSS_HP / 2) {
		boss.mood = { kind: 'shifting', t: 0 };
		g.shake = 1;
		g.events.push({ kind: 'bossPhase' });
		for (const o of g.bullets) if (o.from === 'enemy') o.spent = true;
	}
}

function lashStep(tc: Tentacle, dt: number) {
	const l = tc.lash;
	switch (l.kind) {
		case 'idle':
			return;
		case 'telegraph':
			l.t += dt;
			if (l.t >= LASH_TELEGRAPH) tc.lash = { kind: 'strike', t: 0, targetX: l.targetX };
			return;
		case 'strike':
			l.t += dt;
			if (l.t >= LASH_STRIKE) tc.lash = { kind: 'retract', t: 0, targetX: l.targetX };
			return;
		case 'retract':
			l.t += dt;
			if (l.t >= LASH_RETRACT) tc.lash = { kind: 'idle' };
			return;
	}
}

function fan(g: Game, boss: Boss, n: number, spread: number, speed: number) {
	const ex = boss.x;
	const ey = boss.y + 4;
	const aim = Math.atan2(g.ship.y - ey, g.ship.x - ex);
	for (let i = 0; i < n; i++) {
		const a = aim + (i - (n - 1) / 2) * spread;
		g.bullets.push({ x: ex, y: ey, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, from: 'enemy', spent: false });
	}
}

function bossStep(g: Game, boss: Boss, dt: number) {
	boss.clock += dt;
	boss.flash = Math.max(0, boss.flash - dt);
	for (const tc of boss.tentacles) lashStep(tc, dt);
	const m = boss.mood;
	if (m.kind === 'arriving') {
		m.t += dt;
		const u = Math.min(1, m.t / 2.6);
		boss.y = -60 + (BOSS_Y + 60) * easeOut(u);
		if (u >= 1) boss.mood = { kind: 'fighting' };
		return;
	}
	const p2 = boss.phase === 2;
	boss.drift += dt * (p2 ? 0.9 : 0.55);
	boss.amp += ((p2 ? 76 : 60) - boss.amp) * Math.min(1, dt * 2);
	boss.x = W / 2 + Math.sin(boss.drift) * boss.amp;
	boss.y = BOSS_Y + Math.sin(boss.drift * 2) * (p2 ? 8 : 5);
	if (m.kind === 'shifting') {
		m.t += dt;
		if (m.t >= 1.6) {
			boss.phase = 2;
			boss.mood = { kind: 'fighting' };
			boss.volley = 1.2;
			boss.lash = 1.4;
		}
		return;
	}
	if (m.kind === 'dying') {
		m.t += dt;
		g.shake = Math.max(g.shake, 0.5);
		if (rand(g) < dt * 16) {
			const tones: Tone[] = ['cream', 'coral', 'teal', 'amber'];
			const x = boss.x + (rand(g) - 0.5) * 60;
			const y = boss.y + (rand(g) - 0.3) * 46;
			burst(g, x, y, tones[Math.floor(rand(g) * tones.length)], 10, 90);
		}
		if (m.t >= 2.6) {
			g.score += 5000 + g.lives * 1000;
			end(g, 'victory');
		}
		return;
	}
	if (g.ship.kind !== 'alive') return;

	boss.volley -= dt;
	if (boss.volley <= 0) {
		boss.volley = p2 ? 2.4 : 1.6;
		if (p2) fan(g, boss, 3, 0.16, 112);
		else fan(g, boss, 5, 0.22, 92);
	}
	if (!p2) {
		boss.spawn -= dt;
		if (boss.spawn <= 0) {
			boss.spawn = 6.5;
			for (const side of [-1, 1]) {
				const e: Enemy = {
					id: g.nextId++,
					kind: 'drone',
					hp: 1,
					slot: null,
					x: boss.x + side * 26,
					y: boss.y + 14,
					flash: 0,
					motion: { kind: 'formation' }
				};
				dive(g, e, 1, 1.25);
				g.enemies.push(e);
			}
		}
		return;
	}
	boss.stream -= dt;
	// The stream breathes: on for about two seconds, off for about one and a half.
	if (boss.stream <= 0 && Math.sin(boss.clock * 1.3) > -0.2) {
		boss.stream = 0.12;
		const a = Math.PI / 2 + Math.sin(boss.clock * 1.9) * 1.1;
		g.bullets.push({ x: boss.x, y: boss.y + 17, vx: Math.cos(a) * 82, vy: Math.sin(a) * 82, from: 'enemy', spent: false });
	}
	boss.lash -= dt;
	if (boss.lash <= 0) {
		boss.lash = 3.2;
		const idle = boss.tentacles.filter((t) => t.lash.kind === 'idle');
		const tc = idle[Math.floor(rand(g) * idle.length)];
		if (tc) tc.lash = { kind: 'telegraph', t: 0, targetX: clamp(g.ship.x, 12, W - 12) };
	}
}
