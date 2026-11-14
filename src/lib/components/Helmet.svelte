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

	const flowAt = (u: number, v: number, t: number) => {
		const gx = Math.max(0, Math.min(1.999, u * 2));
		const gy = Math.max(0, Math.min(1.999, v * 2));
		const x0 = gx | 0;
		const y0 = gy | 0;
		const x1 = Math.min(2, x0 + 1);
		const y1 = Math.min(2, y0 + 1);
		const fx = gx - x0;
		const fy = gy - y0;
		const vec = (ix: number, iy: number) => {
			const [ang0, spd, mag] = VISOR_FLOW[iy * 3 + ix];
			const a = ang0 + t * spd;
			return [Math.cos(a) * mag, Math.sin(a) * mag] as const;
		};
		const mix = (p: readonly [number, number], q: readonly [number, number], w: number) =>
			[p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w] as const;
		const a = mix(vec(x0, y0), vec(x1, y0), fx);
		const b = mix(vec(x0, y1), vec(x1, y1), fx);
		return mix(a, b, fy);
	};

	/** Domain-warped thin-film. Glyphs stay put; UV advects through VISOR_FLOW. */
	const visorRgb = (c: number, r: number, t: number, yaw: number, lip: boolean) => {
		let u = (c - visorBox.minC) / Math.max(1, visorBox.maxC - visorBox.minC);
		let v = (r - visorBox.minR) / Math.max(1, visorBox.maxR - visorBox.minR);
		const f0 = flowAt(u, v, t);
		u += f0[0] * 0.28;
		v += f0[1] * 0.28;
		const f1 = flowAt(u, v, t * 0.85 + 1.7);
		u += f1[0] * 0.2;
		v += f1[1] * 0.2;
		const thick =
			u * 0.31 + v * 0.27 + Math.sin((u * 2.1 - v * 1.8) * Math.PI) * 0.18 + (lip ? 0.08 : 0) + yaw * 0.04;
		const s = ((thick % 1) + 1) % 1;
		const x = s * (paletteRgb.length - 1);
		const i = Math.min(paletteRgb.length - 2, Math.floor(x));
		const f = x - i;
		const a = paletteRgb[i];
		const b = paletteRgb[i + 1];
		return [
			(a[0] + (b[0] - a[0]) * f) | 0,
			(a[1] + (b[1] - a[1]) * f) | 0,
			(a[2] + (b[2] - a[2]) * f) | 0
		] as const;
	};

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
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
		const visorC = (visorBox.minC + visorBox.maxC) / 2;
		const visorR = (visorBox.minR + visorBox.maxR) / 2;

		const armReveal = () => {
			if (revealAt !== 0) return;
			revealAt = performance.now();
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

		/** Visor fills from its center, then the shell grows out from the opening. */
		const appear = (k: number, c: number, r: number, now: number) => {
			if (revealAt === 0) return 0;
			const elapsed = (now - revealAt) / 1000;
			const dist = Math.min(1, Math.hypot(c - visorC, r - visorR) / 34);
			const visor = k >= 2;
			const start = visor ? dist * 0.2 : 0.46 + dist * 0.42;
			const dur = visor ? 0.34 : 0.28;
			const x = (elapsed - start) / dur;
			if (x <= 0) return 0;
			if (x >= 1) return 1;
			return x * x * (3 - 2 * x);
		};

		const rest = () => {
			tx = 0;
			ty = 0;
		};

		const move = (event: PointerEvent) => {
			if (reduce.matches || event.pointerType !== 'mouse' || !stage) {
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

		const draw = (now: number) => {
			if (!canvas || !stage) return;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const cssW = stage.clientWidth;
			const cssH = cssW * ((ROWS * CELL_H) / (COLS * CELL_W));
			if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
				canvas.width = Math.round(cssW * dpr);
				canvas.height = Math.round(cssH * dpr);
				canvas.style.width = `${cssW}px`;
				canvas.style.height = `${cssH}px`;
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
			const cyA = Math.cos(yaw);
			const syA = Math.sin(yaw);
			const cp = Math.cos(pitch);
			const sp = Math.sin(pitch);
			const cx = COLS / 2;
			const cyG = ROWS / 2;
			const scaleX = canvas.width / COLS;
			const scaleY = canvas.height / ROWS;
			const fontPx = Math.max(8, scaleY * 0.92);
			const wRest = 1 / (1 - visorPivot.z * PERSPECTIVE);
			const restVisorX = (cx + visorPivot.x * wRest * cx) * scaleX;
			const restVisorY = (cyG - visorPivot.y * wRest * cyG) * scaleY;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = `${fontPx}px ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			type Drawn = {
				ch: string;
				k: number;
				c: number;
				r: number;
				px: number;
				py: number;
				depth: number;
				z01: number;
				behind: number;
				lip: boolean;
				rim: boolean;
			};
			const drawn: Drawn[] = [];

			for (let i = 0; i < CELLS.length; i++) {
				const cell = CELLS[i];
				const z01 = cell.z / DEPTH_SPAN;
				const x0 = (cell.c + 0.5 - cx) / cx - visorPivot.x;
				const y0 = -(cell.r + 0.5 - cyG) / cyG - visorPivot.y;
				const z0 = (PIVOT - z01) * DEPTH_SCALE - visorPivot.z;
				const xYaw = x0 * cyA + z0 * syA;
				const zYaw = -x0 * syA + z0 * cyA;
				const y1 = y0 * cp - zYaw * sp + visorPivot.y;
				const z2 = y0 * sp + zYaw * cp + visorPivot.z;
				const x1 = xYaw + visorPivot.x;
				const w = 1 / (1 - z2 * PERSPECTIVE);
				const px = (cx + x1 * w * cx) * scaleX;
				const py = (cyG - y1 * w * cyG) * scaleY;
				if (px < -12 || py < -12 || px > canvas.width + 12 || py > canvas.height + 12) continue;
				drawn.push({
					ch: cell.ch,
					k: cell.k,
					c: cell.c,
					r: cell.r,
					px,
					py,
					depth: -z2,
					z01,
					behind: relief[i],
					lip: fringe[i],
					rim: rim[i]
				});
			}

			let visorSx = 0;
			let visorSy = 0;
			let visorN = 0;
			for (const glyph of drawn) {
				if (glyph.k < 2) continue;
				visorSx += glyph.px;
				visorSy += glyph.py;
				visorN++;
			}
			if (visorN > 0) {
				const ox = restVisorX - visorSx / visorN;
				const oy = restVisorY - visorSy / visorN;
				for (const glyph of drawn) {
					glyph.px += ox;
					glyph.py += oy;
				}
			}

			drawn.sort((a, b) => b.depth - a.depth);
			const reach2 = (fontPx * 0.62) ** 2;
			const coverAt = (x: number, y: number) => {
				let best: Drawn | null = null;
				let bestD = reach2;
				for (const glyph of drawn) {
					const dx = glyph.px - x;
					const dy = glyph.py - y;
					const d = dx * dx + dy * dy;
					if (d < bestD) {
						bestD = d;
						best = glyph;
					}
				}
				return best;
			};
			/** In front of shell glyphs. Never on the visor. Open air around the helmet still shows. */
			const weatherShows = (x: number, y: number, wZ: number) => {
				const glyph = coverAt(x, y);
				if (!glyph) return true;
				if (glyph.k >= 2) return false;
				return glyph.z01 > wZ;
			};

			for (const glyph of drawn) {
				const alpha = appear(glyph.k, glyph.c, glyph.r, now);
				if (alpha <= 0) continue;
				ctx.globalAlpha = alpha;
				if (glyph.k >= 2) {
					const rgb = visorRgb(glyph.c, glyph.r, t, yaw, glyph.lip);
					ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
					ctx.fillText(VISOR_BLOCK[glyph.ch] ?? '▓', glyph.px, glyph.py);
				} else if (glyph.k === 1) {
					ctx.fillStyle = rgbCss(GRAY_RGB, 1 - glyph.z01 * 0.1, 0.88);
					ctx.fillText(glyph.rim ? glyph.ch : (GRAY_BLOCK[glyph.ch] ?? '▓'), glyph.px, glyph.py);
				} else {
					const shade = 1 - glyph.z01 * 0.22 - Math.min(0.14, glyph.behind / CREASE);
					ctx.fillStyle = rgbCss(CREAM_RGB, shade, 0.76);
					ctx.fillText(glyph.rim ? glyph.ch : (SHELL_BLOCK[glyph.ch] ?? '▓'), glyph.px, glyph.py);
				}
			}
			ctx.globalAlpha = 1;

			const settled = reduce.matches || (revealAt > 0 && (now - revealAt) / 1000 > 1.05);
			if (settled && cue === 'sun') {
				for (const dot of sunDots) {
					const x = dot.x * canvas.width;
					const y = dot.y * canvas.height;
					if (!weatherShows(x, y, 0.14)) continue;
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
						if (weatherShows(x, y, 0.2)) {
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
				for (const glyph of drawn) {
					if (glyph.k >= 2 || glyph.z01 < 0.12) continue;
					const nx = (glyph.px - ox) / rx;
					const ny = (glyph.py - oy) / ry;
					if (nx * nx + ny * ny > 1) continue;
					ctx.fillRect(glyph.px - fontPx * 0.32, glyph.py - fontPx * 0.42, fontPx * 0.64, fontPx * 0.84);
				}
			}

			raf = requestAnimationFrame(draw);
		};

		const down = (event: PointerEvent) => {
			if (event.pointerType !== 'mouse') rest();
		};

		const loadWeather = async () => {
			try {
				const weather = await getDurbanWeather();
				cue = weather.cue;
			} catch {
				/* keep last cue */
			}
			window.clearTimeout(weatherTimer);
			weatherTimer = window.setTimeout(loadWeather, nextWeatherRefreshMs() || TTL_MS);
		};

		draw(performance.now());
		loadWeather();
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerdown', down);
		document.documentElement.addEventListener('mouseleave', rest);

		return () => {
			revealWatch?.disconnect();
			cancelAnimationFrame(raf);
			window.clearTimeout(weatherTimer);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerdown', down);
			document.documentElement.removeEventListener('mouseleave', rest);
		};
	});
</script>

<div bind:this={stage} class="stage" aria-hidden="true">
	<canvas bind:this={canvas} class="helmet"></canvas>
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

	.stage {
		position: relative;
		width: min(24rem, 72%);
		margin: 1.25rem auto 0.5rem;
		pointer-events: none;
	}

	.helmet {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
