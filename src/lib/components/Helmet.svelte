<script lang="ts">
	import { onMount } from 'svelte';
	import { CELLS, COLS, DEPTH_LEVELS, ROWS } from '#lib/helmet-cells.ts';
	import { getDurbanWeather, nextWeatherRefreshMs, type WeatherCue } from '#lib/weather.ts';

	const TTL_MS = 3 * 60 * 60 * 1000;
	const CELL_W = 7.4;
	const CELL_H = 11;
	const MAX_YAW = 0.32;
	const MAX_PITCH = 0.22;
	/** Critically damped gaze (orientation only; no position lerp). */
	const LOOK_OMEGA = 11;
	const LOOK_ZETA = 1;
	const PERSPECTIVE = 0.28;
	const DEPTH_SCALE = 0.78;
	const PIVOT = 0.2;
	/** Max visor-rim occlusion. Soft; pointer-facing lobe only. */
	const RIM_PUNCH = 0.22;
	const RIM_CELLS = 5;
	/** Flatten visor bowl so 3D rim punch is weaker. Gaze angles unchanged. */
	const VISOR_Z = 0.5;
	/** Visor fill. Light to solid. */
	const VISOR_BLOCK: Record<string, string> = { '+': '▒', '*': '▓', '#': '█' };
	/** Cream shell fill. No █ — that read as white squares on cream. Letters stay on the silhouette and visor opening. */
	const SHELL_BLOCK: Record<string, string> = {
		':': '▒',
		'-': '▒',
		'=': '▒',
		'+': '▓',
		'*': '▓',
		'#': '▓'
	};
	/** Charcoal side/neck fill. █ is fine on dark gray. */
	const GRAY_BLOCK: Record<string, string> = {
		'+': '▒',
		'*': '▓',
		'#': '█',
		'%': '█'
	};
	const CREAM_RGB = [0xf4, 0xf3, 0xe8] as const;
	const GRAY_RGB = [0x24, 0x2a, 0x30] as const;
	const PALETTE = ['#592AA4', '#4277A2', '#3FB6AF', '#939E7A', '#C18D5D', '#D96350', '#592AA4'];
	/**
	 * Visor advection vs wall clock. Field speeds are 0.12–0.22 rad/s of this time.
	 * 1 = ~36s mean vector period (too slow to read on load). 3.2 = ~11s, visible in ~1s.
	 */
	const FLOW_RATE = 3.2;
	/** 3×3 vector field. Each cell: rest angle (rad), angular speed, magnitude. */
	const VISOR_FLOW = [
		[0.2, 0.2, 0.62],
		[1.4, -0.17, 0.58],
		[2.6, 0.14, 0.55],
		[-0.8, 0.22, 0.6],
		[0.5, -0.12, 0.48],
		[2.1, 0.18, 0.58],
		[3.5, -0.16, 0.52],
		[-1.7, 0.21, 0.57],
		[1.1, -0.19, 0.54]
	] as const;
	const DEPTH_SPAN = Math.max(1, DEPTH_LEVELS - 1);
	/** Crease strength tuned at a span of 99. Hold that shade when the span changes. */
	const CREASE = (40 * DEPTH_SPAN) / 99;

	const sunDots = [
		{ x: 0.24, y: 0.4, d: 1.1, delay: 0 },
		{ x: 0.3, y: 0.28, d: 0.9, delay: 1.2 },
		{ x: 0.72, y: 0.32, d: 1.1, delay: 0.4 },
		{ x: 0.78, y: 0.46, d: 0.8, delay: 2 },
		{ x: 0.22, y: 0.52, d: 1, delay: 0.8 },
		{ x: 0.48, y: 0.18, d: 0.7, delay: 1.6 },
		{ x: 0.36, y: 0.62, d: 0.9, delay: 2.4 },
		{ x: 0.64, y: 0.64, d: 1.1, delay: 0.2 }
	];

	const rainStreaks = [
		{ x: 0.34, y: 0.24, h: 0.18, delay: 0 },
		{ x: 0.4, y: 0.2, h: 0.22, delay: 0.4 },
		{ x: 0.46, y: 0.28, h: 0.16, delay: 0.9 },
		{ x: 0.52, y: 0.22, h: 0.2, delay: 0.2 },
		{ x: 0.58, y: 0.26, h: 0.18, delay: 1.1 },
		{ x: 0.37, y: 0.32, h: 0.14, delay: 0.6 },
		{ x: 0.55, y: 0.34, h: 0.16, delay: 1.4 },
		{ x: 0.44, y: 0.18, h: 0.24, delay: 0.3 }
	];

	let cue = $state<WeatherCue | null>(null);
	let stage: HTMLDivElement | undefined;
	let home: HTMLDivElement | undefined;
	let docked = $state(false);
	let moving = $state(false);
	let canvas: HTMLCanvasElement | undefined;

	const hexRgb = (hex: string) => {
		const n = parseInt(hex.slice(1), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
	};

	const paletteRgb = PALETTE.map(hexRgb);

	const zAt = new Int16Array(COLS * ROWS).fill(-1);
	const kindAt = new Int8Array(COLS * ROWS).fill(-1);
	for (const cell of CELLS) {
		const i = cell.r * COLS + cell.c;
		zAt[i] = cell.z;
		kindAt[i] = cell.k;
	}

	/** One-cell visor lip. Glass only, so the shell outline stays untouched. */
	const fringe = CELLS.map((cell) => {
		if (cell.k < 2) return false;
		for (const [dc, dr] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1]
		] as const) {
			const c = cell.c + dc;
			const r = cell.r + dr;
			if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
			if (kindAt[r * COLS + c] < 2) return true;
		}
		return false;
	});

	/** Chebyshev cells from visor glass to shell. 1 = lip. */
	const visorInset = CELLS.map((cell) => {
		if (cell.k < 2) return 99;
		let best = 12;
		for (let dr = -6; dr <= 6; dr++) {
			for (let dc = -6; dc <= 6; dc++) {
				const d = Math.max(Math.abs(dc), Math.abs(dr));
				if (d === 0 || d >= best) continue;
				const c = cell.c + dc;
				const r = cell.r + dr;
				if (c < 0 || r < 0 || c >= COLS || r >= ROWS) {
					best = d;
					continue;
				}
				if (kindAt[r * COLS + c] < 2) best = d;
			}
		}
		return best;
	});

	/** Shell silhouette and visor opening. Letters only here. Fill is blocks. */
	const rim = CELLS.map((cell) => {
		if (cell.k >= 2) return false;
		for (const [dc, dr] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1]
		] as const) {
			const c = cell.c + dc;
			const r = cell.r + dr;
			if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
			const nk = kindAt[r * COLS + c];
			if (nk < 0 || nk >= 2) return true;
		}
		return false;
	});

	/** How far a shell cell sits behind its neighbors. Crease darkening only. */
	const relief = CELLS.map((cell) => {
		let behind = 0;
		for (const [dc, dr] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1]
		] as const) {
			const c = cell.c + dc;
			const r = cell.r + dr;
			if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
			const nz = zAt[r * COLS + c];
			if (nz < 0) continue;
			behind = Math.max(behind, cell.z - nz);
		}
		return behind;
	});

	const rgbCss = (rgb: readonly number[], shade: number, floor = 0.58) => {
		const s = Math.max(floor, Math.min(1, shade));
		return `rgb(${(rgb[0] * s) | 0},${(rgb[1] * s) | 0},${(rgb[2] * s) | 0})`;
	};

	const visorBox = (() => {
		let minC = COLS;
		let maxC = 0;
		let minR = ROWS;
		let maxR = 0;
		for (const cell of CELLS) {
			if (cell.k !== 2 && cell.k !== 3) continue;
			if (cell.c < minC) minC = cell.c;
			if (cell.c > maxC) maxC = cell.c;
			if (cell.r < minR) minR = cell.r;
			if (cell.r > maxR) maxR = cell.r;
		}
		return { minC, maxC, minR, maxR };
	})();

	/** Visor centroid in object space. lookAt rotates around this; the helmet does not translate. */
	const visorPivot = (() => {
		const cx = COLS / 2;
		const cyG = ROWS / 2;
		let sx = 0;
		let sy = 0;
		let sz = 0;
		let n = 0;
		for (const cell of CELLS) {
			if (cell.k < 2) continue;
			sx += (cell.c + 0.5 - cx) / cx;
			sy += -(cell.r + 0.5 - cyG) / cyG;
			sz += (PIVOT - cell.z / DEPTH_SPAN) * DEPTH_SCALE;
			n++;
		}
		return { x: sx / n, y: sy / n, z: sz / n };
	})();

	const visorC = (visorBox.minC + visorBox.maxC) / 2;
	const visorR = (visorBox.minR + visorBox.maxR) / 2;

	/*
	 * Per-cell constants, flattened into typed arrays once. The frame loop only
	 * does the work that depends on gaze, time, or canvas size.
	 */
	const N = CELLS.length;
	const kinds = new Int8Array(N);
	/** 1 = visor glass. Painted after the shell. */
	const glass = new Uint8Array(N);
	const z01s = new Float64Array(N);
	/** Object-space position relative to the visor pivot, visor bowl already flattened. */
	const baseX = new Float64Array(N);
	const baseY = new Float64Array(N);
	const baseZ = new Float64Array(N);
	/** Visor UV before advection. */
	const uBase = new Float64Array(N);
	const vBase = new Float64Array(N);
	const lipT = new Float64Array(N);
	/** Rim punch direction and weight. */
	const punchUx = new Float64Array(N);
	const punchUy = new Float64Array(N);
	const punchLen = new Float64Array(N);
	const punchMix = new Float64Array(N);
	/** Reveal timing in seconds after the preloader lifts. */
	const appearStart = new Float64Array(N);
	const appearDur = new Float64Array(N);
	/** Resolved glyph per cell. */
	const glyphs: string[] = new Array(N);
	/** Shell and charcoal colors never change. Visor is computed per frame. */
	const staticFill: string[] = new Array(N);
	let revealEnd = 0;

	{
		const cx = COLS / 2;
		const cyG = ROWS / 2;
		const halfW = Math.max(1, (visorBox.maxC - visorBox.minC) / 2);
		const halfH = Math.max(1, (visorBox.maxR - visorBox.minR) / 2);
		for (let i = 0; i < N; i++) {
			const cell = CELLS[i];
			const z01 = cell.z / DEPTH_SPAN;
			const isGlass = cell.k >= 2;
			kinds[i] = cell.k;
			glass[i] = isGlass ? 1 : 0;
			z01s[i] = z01;
			baseX[i] = (cell.c + 0.5 - cx) / cx - visorPivot.x;
			baseY[i] = -(cell.r + 0.5 - cyG) / cyG - visorPivot.y;
			let z0 = (PIVOT - z01) * DEPTH_SCALE - visorPivot.z;
			if (isGlass) z0 *= VISOR_Z;
			baseZ[i] = z0;

			const dist = Math.min(1, Math.hypot(cell.c - visorC, cell.r - visorR) / 34);
			appearStart[i] = isGlass ? dist * 0.2 : 0.46 + dist * 0.42;
			appearDur[i] = isGlass ? 0.34 : 0.28;
			revealEnd = Math.max(revealEnd, appearStart[i] + appearDur[i]);

			if (isGlass) {
				uBase[i] = (cell.c - visorBox.minC) / Math.max(1, visorBox.maxC - visorBox.minC);
				vBase[i] = (cell.r - visorBox.minR) / Math.max(1, visorBox.maxR - visorBox.minR);
				lipT[i] = fringe[i] ? 0.04 : 0;
				const ux = (cell.c - visorC) / halfW;
				const uy = (cell.r - visorR) / halfH;
				punchUx[i] = ux;
				punchUy[i] = uy;
				punchLen[i] = Math.max(0.25, Math.hypot(ux, uy));
				const rimW = Math.max(0, 1 - (visorInset[i] - 1) / RIM_CELLS);
				punchMix[i] = 0.35 + 0.65 * rimW;
				glyphs[i] = VISOR_BLOCK[cell.ch] ?? '▓';
				staticFill[i] = '';
			} else if (cell.k === 1) {
				glyphs[i] = rim[i] ? cell.ch : (GRAY_BLOCK[cell.ch] ?? '▓');
				staticFill[i] = rgbCss(GRAY_RGB, 1 - z01 * 0.1, 0.88);
			} else {
				glyphs[i] = rim[i] ? cell.ch : (SHELL_BLOCK[cell.ch] ?? '▓');
				const shade = 1 - z01 * 0.22 - Math.min(0.14, relief[i] / CREASE);
				staticFill[i] = rgbCss(CREAM_RGB, shade, 0.76);
			}
		}
	}

	/** Flow vectors at one time step: [x0, y0, x1, y1, …] for the 3×3 field. */
	const fillFlow = (t: number, out: Float64Array) => {
		for (let k = 0; k < 9; k++) {
			const [ang0, spd, mag] = VISOR_FLOW[k];
			const a = ang0 + t * spd;
			out[k * 2] = Math.cos(a) * mag;
			out[k * 2 + 1] = Math.sin(a) * mag;
		}
	};

	let flowX = 0;
	let flowY = 0;
	/** Bilinear sample of a precomputed flow table. Writes flowX / flowY. */
	const flowAt = (u: number, v: number, tab: Float64Array) => {
		const gx = Math.max(0, Math.min(1.999, u * 2));
		const gy = Math.max(0, Math.min(1.999, v * 2));
		const x0 = gx | 0;
		const y0 = gy | 0;
		const x1 = Math.min(2, x0 + 1);
		const y1 = Math.min(2, y0 + 1);
		const fx = gx - x0;
		const fy = gy - y0;
		const i00 = (y0 * 3 + x0) * 2;
		const i10 = (y0 * 3 + x1) * 2;
		const i01 = (y1 * 3 + x0) * 2;
		const i11 = (y1 * 3 + x1) * 2;
		const ax = tab[i00] + (tab[i10] - tab[i00]) * fx;
		const ay = tab[i00 + 1] + (tab[i10 + 1] - tab[i00 + 1]) * fx;
		const bx = tab[i01] + (tab[i11] - tab[i01]) * fx;
		const by = tab[i01 + 1] + (tab[i11 + 1] - tab[i01 + 1]) * fx;
		flowX = ax + (bx - ax) * fy;
		flowY = ay + (by - ay) * fy;
	};

	const flow0 = new Float64Array(18);
	const flow1 = new Float64Array(18);

	let visR = 0;
	let visG = 0;
	let visB = 0;
	/** Domain-warped thin-film. Glyphs stay put; UV advects through VISOR_FLOW. Writes visR/G/B. */
	const visorRgb = (i: number) => {
		let u = uBase[i];
		let v = vBase[i];
		flowAt(u, v, flow0);
		u += flowX * 0.28;
		v += flowY * 0.28;
		flowAt(u, v, flow1);
		u += flowX * 0.2;
		v += flowY * 0.2;
		const thick = u * 0.31 + v * 0.27 + Math.sin((u * 2.1 - v * 1.8) * Math.PI) * 0.18 + lipT[i];
		const s = ((thick % 1) + 1) % 1;
		const x = s * (paletteRgb.length - 1);
		const j = Math.min(paletteRgb.length - 2, Math.floor(x));
		const f = x - j;
		const a = paletteRgb[j];
		const b = paletteRgb[j + 1];
		visR = (a[0] + (b[0] - a[0]) * f) | 0;
		visG = (a[1] + (b[1] - a[1]) * f) | 0;
		visB = (a[2] + (b[2] - a[2]) * f) | 0;
	};

	/** Visor colors are integer RGB, so the CSS strings repeat. Cache them. */
	const fillCache = new Map<number, string>();
	const fillFor = (r: number, g: number, b: number) => {
		const key = (r << 16) | (g << 8) | b;
		let css = fillCache.get(key);
		if (css === undefined) {
			if (fillCache.size > 8192) fillCache.clear();
			css = `rgb(${r},${g},${b})`;
			fillCache.set(key, css);
		}
		return css;
	};

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mobile = window.matchMedia('(max-width: 720px)');
		let moveTimer = 0;
		let desiredDock = false;
		let tx = 0;
		let ty = 0;
		let yaw = 0;
		let pitch = 0;
		let yawV = 0;
		let pitchV = 0;
		let prevNow = 0;
		let raf = 0;
		let weatherTimer = 0;
		let start = performance.now();
		let revealAt = 0;
		let revealWatch: MutationObserver | undefined;
		let onScreen = true;
		let stageW = stage?.clientWidth ?? 0;
		let fontPx = 8;
		const ctx = canvas?.getContext('2d') ?? null;

		// Per-frame scratch. Reused, never reallocated.
		const px = new Float64Array(N);
		const py = new Float64Array(N);
		const depth = new Float64Array(N);
		const visible = new Uint8Array(N);
		const rank = new Int32Array(N);
		const order = new Int32Array(N);
		let sorted = false;

		/** Glass last, then far to near, then cell index. Same order as a stable sort of CELLS. */
		const cmp = (a: number, b: number) => {
			if (glass[a] !== glass[b]) return glass[a] - glass[b];
			const d = depth[b] - depth[a];
			return d !== 0 ? d : a - b;
		};

		/** Order barely moves between frames, so insertion sort on last frame's order is ~O(n). */
		const sortOrder = () => {
			if (!sorted) {
				const all = Array.from({ length: N }, (_, i) => i).sort(cmp);
				order.set(all);
				sorted = true;
			} else {
				for (let i = 1; i < N; i++) {
					const x = order[i];
					let j = i - 1;
					while (j >= 0 && cmp(order[j], x) > 0) {
						order[j + 1] = order[j];
						j--;
					}
					order[j + 1] = x;
				}
			}
			for (let i = 0; i < N; i++) rank[order[i]] = i;
		};

		// Spatial hash for weather occlusion. Built only on frames that need it.
		let gridSize = 1;
		let gridW = 0;
		let gridH = 0;
		let gridStart = new Int32Array(1);
		const gridItems = new Int32Array(N);
		const gridCell = new Int32Array(N);
		let gridCount = new Int32Array(1);

		const bucket = (v: number, n: number) => {
			const b = Math.floor(v / gridSize);
			return b < 0 ? 0 : b >= n ? n - 1 : b;
		};

		const buildGrid = (reach: number, w: number, h: number) => {
			gridSize = Math.max(1, reach);
			gridW = Math.max(1, Math.ceil(w / gridSize));
			gridH = Math.max(1, Math.ceil(h / gridSize));
			const cells = gridW * gridH;
			if (gridStart.length < cells + 1) {
				gridStart = new Int32Array(cells + 1);
				gridCount = new Int32Array(cells);
			}
			gridStart.fill(0, 0, cells + 1);
			for (let i = 0; i < N; i++) {
				if (!visible[i]) {
					gridCell[i] = -1;
					continue;
				}
				const cell = bucket(py[i], gridH) * gridW + bucket(px[i], gridW);
				gridCell[i] = cell;
				gridStart[cell + 1]++;
			}
			for (let c = 0; c < cells; c++) gridStart[c + 1] += gridStart[c];
			gridCount.fill(0, 0, cells);
			for (let k = 0; k < N; k++) {
				const i = order[k];
				const cell = gridCell[i];
				if (cell < 0) continue;
				gridItems[gridStart[cell] + gridCount[cell]++] = i;
			}
		};

		/** Nearest drawn glyph within reach; ties go to the one painted first. -1 if none. */
		const coverAt = (x: number, y: number, reach2: number) => {
			let best = -1;
			let bestD = reach2;
			const bx = bucket(x, gridW);
			const by = bucket(y, gridH);
			for (let gy = Math.max(0, by - 1); gy <= Math.min(gridH - 1, by + 1); gy++) {
				for (let gx = Math.max(0, bx - 1); gx <= Math.min(gridW - 1, bx + 1); gx++) {
					const cell = gy * gridW + gx;
					for (let k = gridStart[cell]; k < gridStart[cell + 1]; k++) {
						const i = gridItems[k];
						const dx = px[i] - x;
						const dy = py[i] - y;
						const d = dx * dx + dy * dy;
						if (d < bestD || (best >= 0 && d === bestD && rank[i] < rank[best])) {
							bestD = d;
							best = i;
						}
					}
				}
			}
			return best;
		};

		/** In front of shell glyphs. Never on the visor. Open air around the helmet still shows. */
		const weatherShows = (x: number, y: number, wZ: number, reach2: number) => {
			const i = coverAt(x, y, reach2);
			if (i < 0) return true;
			if (glass[i]) return false;
			return z01s[i] > wZ;
		};

		/** Draw again soon. The loop keeps itself going only while motion is allowed and on screen. */
		const kick = () => {
			if (raf === 0) raf = requestAnimationFrame(draw);
		};


		const armReveal = () => {
			if (revealAt !== 0) return;
			revealAt = performance.now();
			kick();
		};

		if (reduce.matches) {
			revealAt = performance.now() - 4000;
		} else {
			const pre = document.querySelector('.preloader');
			if (!pre || pre.classList.contains('out')) armReveal();
			else {
				revealWatch = new MutationObserver(() => {
					if (pre.classList.contains('out')) {
						revealWatch?.disconnect();
						armReveal();
					}
				});
				revealWatch.observe(pre, { attributes: true, attributeFilter: ['class'] });
			}
		}

		const rest = () => {
			tx = 0;
			ty = 0;
		};

		const move = (event: PointerEvent) => {
			if (reduce.matches || !stage || (event.pointerType !== 'mouse' && !(mobile.matches && event.pointerType === 'touch'))) {
				rest();
				return;
			}
			const box = stage.getBoundingClientRect();
			// Gaze at the pointer's current position vs the visor, not stage-normalized follow.
			const visorX = box.left + ((visorC + 0.5) / COLS) * box.width;
			const visorY = box.top + ((visorR + 0.5) / ROWS) * box.height;
			const dx = event.clientX - visorX;
			const dy = event.clientY - visorY;
			// Defold / three.js lookAt: +Z faces the pointer on a plane in front of the visor.
			// Rotation only — no invert, no lerp toward cursor position, no velocity.
			const gazeZ = box.width * 1.55;
			tx = Math.max(-MAX_YAW, Math.min(MAX_YAW, Math.atan2(dx, gazeZ)));
			ty = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, Math.atan2(dy, Math.hypot(dx, gazeZ))));
		};

		// Declared, not assigned, so kick() can schedule it before this line runs.
		function draw(now: number) {
			// A direct call can land while a frame is queued. Drop it so only one loop runs.
			if (raf !== 0) cancelAnimationFrame(raf);
			raf = 0;
			if (!canvas || !ctx) return;

			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const cssW = docked ? Math.max(stageW, 384) : stageW;
			const cssH = cssW * ((ROWS * CELL_H) / (COLS * CELL_W));
			if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
				canvas.width = Math.round(cssW * dpr);
				canvas.height = Math.round(cssH * dpr);
				canvas.style.width = '100%';
				canvas.style.height = 'auto';
			}
			// Resizing the canvas resets context state, so set text state every frame. It is cheap
			// when the string is unchanged.
			const nextFont = Math.max(8, (canvas.height / ROWS) * 0.92);
			if (nextFont !== fontPx || ctx.textAlign !== 'center') {
				fontPx = nextFont;
				ctx.font = `${fontPx}px ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
			}

			const dt = prevNow === 0 ? 1 / 60 : Math.min(0.032, (now - prevNow) / 1000);
			prevNow = now;
			if (reduce.matches) {
				yaw = 0;
				pitch = 0;
				yawV = 0;
				pitchV = 0;
			} else {
				const pull = (pos: number, vel: number, target: number) => {
					const acc = -2 * LOOK_ZETA * LOOK_OMEGA * vel - LOOK_OMEGA * LOOK_OMEGA * (pos - target);
					const nextV = vel + acc * dt;
					return [pos + nextV * dt, nextV] as const;
				};
				[yaw, yawV] = pull(yaw, yawV, tx);
				[pitch, pitchV] = pull(pitch, pitchV, ty);
			}

			const t = reduce.matches ? 0 : (now - start) / 1000;
			const flowT = reduce.matches ? 0 : t * FLOW_RATE;
			const cyA = Math.cos(yaw);
			const syA = Math.sin(yaw);
			const cp = Math.cos(pitch);
			const sp = Math.sin(pitch);
			const cx = COLS / 2;
			const cyG = ROWS / 2;
			const scaleX = canvas.width / COLS;
			const scaleY = canvas.height / ROWS;
			const wRest = 1 / (1 - visorPivot.z * PERSPECTIVE);
			const restVisorX = (cx + visorPivot.x * wRest * cx) * scaleX;
			const restVisorY = (cyG - visorPivot.y * wRest * cyG) * scaleY;
			const maxX = canvas.width + 12;
			const maxY = canvas.height + 12;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			let visorSx = 0;
			let visorSy = 0;
			let visorN = 0;
			for (let i = 0; i < N; i++) {
				const x0 = baseX[i];
				const y0 = baseY[i];
				const z0 = baseZ[i];
				const xYaw = x0 * cyA + z0 * syA;
				const zYaw = -x0 * syA + z0 * cyA;
				const y1 = y0 * cp - zYaw * sp + visorPivot.y;
				const z2 = y0 * sp + zYaw * cp + visorPivot.z;
				const x1 = xYaw + visorPivot.x;
				const w = 1 / (1 - z2 * PERSPECTIVE);
				const gx = (cx + x1 * w * cx) * scaleX;
				const gy = (cyG - y1 * w * cyG) * scaleY;
				px[i] = gx;
				py[i] = gy;
				depth[i] = -z2;
				const on = gx >= -12 && gy >= -12 && gx <= maxX && gy <= maxY;
				visible[i] = on ? 1 : 0;
				if (on && glass[i]) {
					visorSx += gx;
					visorSy += gy;
					visorN++;
				}
			}
			if (visorN > 0) {
				const ox = restVisorX - visorSx / visorN;
				const oy = restVisorY - visorSy / visorN;
				for (let i = 0; i < N; i++) {
					px[i] += ox;
					py[i] += oy;
				}
			}

			// Glass last: overlapping shell/rim glyphs stay behind the visor (painter layers).
			sortOrder();

			const elapsed = revealAt === 0 ? -1 : (now - revealAt) / 1000;
			const revealed = elapsed >= revealEnd;
			fillFlow(flowT, flow0);
			fillFlow(flowT * 0.85 + 1.7, flow1);
			const gx = yaw / MAX_YAW;
			const gy = pitch / MAX_PITCH;
			const mag = Math.min(1, Math.hypot(gx, gy));
			const punchOn = mag > 0.04;

			if (revealAt !== 0) {
				let lastAlpha = -1;
				let lastFill = '';
				for (let k = 0; k < N; k++) {
					const i = order[k];
					if (!visible[i]) continue;
					let alpha = 1;
					if (!revealed) {
						const x = (elapsed - appearStart[i]) / appearDur[i];
						if (x <= 0) continue;
						if (x < 1) alpha = x * x * (3 - 2 * x);
					}
					if (alpha !== lastAlpha) {
						ctx.globalAlpha = alpha;
						lastAlpha = alpha;
					}
					let fill: string;
					if (glass[i]) {
						visorRgb(i);
						let punch = 0;
						if (punchOn) {
							const along = (punchUx[i] * gx + punchUy[i] * gy) / (mag * punchLen[i]);
							const lobe = Math.max(0, along);
							punch = mag * RIM_PUNCH * lobe * punchMix[i];
						}
						const s = 1 - punch;
						fill = fillFor((visR * s) | 0, (visG * s) | 0, (visB * s) | 0);
					} else {
						fill = staticFill[i];
					}
					if (fill !== lastFill) {
						ctx.fillStyle = fill;
						lastFill = fill;
					}
					ctx.fillText(glyphs[i], px[i], py[i]);
				}
				ctx.globalAlpha = 1;
			}

			const settled = reduce.matches || (revealAt > 0 && (now - revealAt) / 1000 > 1.05);
			const reach2 = (fontPx * 0.62) ** 2;
			if (settled && (cue === 'sun' || cue === 'rain')) {
				buildGrid(fontPx * 0.62, canvas.width, canvas.height);
			}
			if (settled && cue === 'sun') {
				for (const dot of sunDots) {
					const x = dot.x * canvas.width;
					const y = dot.y * canvas.height;
					if (!weatherShows(x, y, 0.14, reach2)) continue;
					const pulse = reduce.matches
						? 0.5
						: 0.35 + 0.35 * Math.sin((t + dot.delay) * 0.9);
					ctx.fillStyle = `rgba(193,141,93,${pulse})`;
					ctx.beginPath();
					ctx.arc(x, y, dot.d * dpr * 1.2, 0, Math.PI * 2);
					ctx.fill();
				}
			} else if (settled && cue === 'rain') {
				ctx.strokeStyle = 'rgba(244,243,232,0.35)';
				ctx.lineWidth = 0.8 * dpr;
				for (const drop of rainStreaks) {
					const p = reduce.matches ? 0.4 : ((t + drop.delay) % 1.8) / 1.8;
					const x0 = drop.x * canvas.width;
					const y0 = (drop.y + p * 0.12) * canvas.height;
					const x1 = x0 + 1.2 * dpr;
					const y1 = y0 + drop.h * canvas.height;
					ctx.beginPath();
					let drawing = false;
					for (let step = 0; step <= 8; step++) {
						const u = step / 8;
						const x = x0 + (x1 - x0) * u;
						const y = y0 + (y1 - y0) * u;
						if (weatherShows(x, y, 0.2, reach2)) {
							if (!drawing) {
								ctx.moveTo(x, y);
								drawing = true;
							} else ctx.lineTo(x, y);
						} else {
							drawing = false;
						}
					}
					ctx.stroke();
				}
			} else if (settled && cue === 'overcast') {
				ctx.fillStyle = 'rgba(147,158,122,0.16)';
				const ox = canvas.width * 0.5;
				const oy = canvas.height * 0.44;
				const rx = canvas.width * 0.28;
				const ry = canvas.height * 0.3;
				// Painter order: overlapping anti-aliased rects round differently in another order.
				for (let k = 0; k < N; k++) {
					const i = order[k];
					if (!visible[i] || glass[i] || z01s[i] < 0.12) continue;
					const nx = (px[i] - ox) / rx;
					const ny = (py[i] - oy) / ry;
					if (nx * nx + ny * ny > 1) continue;
					ctx.fillRect(px[i] - fontPx * 0.32, py[i] - fontPx * 0.42, fontPx * 0.64, fontPx * 0.84);
				}
			}

			// Reduced motion renders a still frame: nothing changes until resize or weather.
			// Off screen there is nothing to see; the observer restarts the loop.
			if (!reduce.matches && onScreen) raf = requestAnimationFrame(draw);
			else prevNow = 0;
		}

		const down = (event: PointerEvent) => {
			if (event.pointerType === 'touch' && mobile.matches) move(event);
			else if (event.pointerType !== 'mouse') rest();
		};

		const loadWeather = async () => {
			try {
				const weather = await getDurbanWeather();
				cue = weather.cue;
				kick();
			} catch {
				/* keep last cue */
			}
			window.clearTimeout(weatherTimer);
			weatherTimer = window.setTimeout(loadWeather, nextWeatherRefreshMs() || TTL_MS);
		};

		const resize = new ResizeObserver(() => {
			if (!stage) return;
			stageW = stage.clientWidth;
			kick();
		});
		if (stage) resize.observe(stage);

		const updateDock = () => {
			if (!home) return;
			const rect = home.getBoundingClientRect();
			const nextDock = rect.bottom <= 0;
			if (nextDock === desiredDock) return;
			desiredDock = nextDock;
			window.clearTimeout(moveTimer);
			moving = !reduce.matches;
			const transfer = () => {
				docked = desiredDock;
				onScreen = docked || (rect.bottom > 0 && rect.top < window.innerHeight);
				if (docked && !reduce.matches) revealAt = performance.now();
				else if (reduce.matches) revealAt = performance.now() - 4000;
				moving = false;
				kick();
			};
			if (reduce.matches) transfer();
			else moveTimer = window.setTimeout(transfer, 180);
		};

		const visibility = new IntersectionObserver((entries) => {
			const entry = entries[entries.length - 1];
			if (!entry) return;
			onScreen = docked || entry.isIntersecting;
			if (onScreen) kick();
			updateDock();
		});
		if (home) visibility.observe(home);
		window.addEventListener('scroll', updateDock, { passive: true });
		mobile.addEventListener('change', updateDock);
		updateDock();

		reduce.addEventListener('change', kick);

		draw(performance.now());
		loadWeather();
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerdown', down);
		document.documentElement.addEventListener('mouseleave', rest);

		return () => {
			revealWatch?.disconnect();
			resize.disconnect();
			visibility.disconnect();
			window.clearTimeout(moveTimer);
			window.removeEventListener('scroll', updateDock);
			mobile.removeEventListener('change', updateDock);
			reduce.removeEventListener('change', kick);
			cancelAnimationFrame(raf);
			window.clearTimeout(weatherTimer);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerdown', down);
			document.documentElement.removeEventListener('mouseleave', rest);
		};
	});
</script>

<div bind:this={home} class="home" style:aspect-ratio="{COLS * CELL_W} / {ROWS * CELL_H}">
	<div bind:this={stage} class="stage" class:docked class:moving>
		<canvas bind:this={canvas} class="helmet" aria-hidden="true"></canvas>
	</div>
</div>

<style>
	.stage,
	.helmet {
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
	}

	.home {
		position: relative;
		width: min(24rem, 72%);
		margin: 1.25rem auto 0.5rem;
	}

	.stage {
		position: relative;
		width: 100%;
		pointer-events: none;
		transition: opacity 180ms ease;
	}

	.stage.moving {
		opacity: 0;
	}

	.stage.docked {
		position: fixed;
		width: min(27vw, 7.5rem);
		right: max(0.75rem, env(safe-area-inset-right));
		bottom: max(0.75rem, env(safe-area-inset-bottom));
		z-index: 7;
	}

	@media (prefers-reduced-motion: reduce) {
		.stage { transition: none; }
	}

	.helmet {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
