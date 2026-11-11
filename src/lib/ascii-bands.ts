/** Ink from empty to full. Matches the helmet ramp. Heavier glyphs read as lighter tones. */
export const INK_RAMP = [':', '-', '=', '+', '*', '#'] as const;

export type Rgb = readonly [number, number, number];

export type TonalPass = {
	ch: string;
	rgb: Rgb;
	/** Sub-cell stagger so the stacked glyphs do not sit on the same strokes. */
	dx: number;
	dy: number;
};

export function inkIndex(ch: string): number {
	const i = INK_RAMP.indexOf(ch as (typeof INK_RAMP)[number]);
	return i < 0 ? 3 : i;
}

/** One step along the ramp. Steps the other way when the glyph is already at that end. */
export function adjacentInk(ch: string, towardHeavy: boolean): string {
	const i = inkIndex(ch);
	const dir = towardHeavy ? 1 : -1;
	let j = i + dir;
	if (j < 0 || j >= INK_RAMP.length) j = i - dir;
	return INK_RAMP[j];
}

/**
 * DitherTONE-style tonal bands.
 * Luma 0 is a shadow, luma 1 is a highlight. Each color is its own ASCII pass.
 * Passes overlap in the blend between stops, so a midtone is two or three glyphs
 * of neighboring colors stacked in one cell. The darkest stop uses the lightest
 * ink. The lightest stop uses the heaviest ink. Draw the returned passes in order.
 */
export function tonalPasses(luma: number, colors: readonly Rgb[]): TonalPass[] {
	const n = colors.length;
	if (n === 0) return [];
	const t = Math.min(1, Math.max(0, luma));
	const span = Math.max(1, n - 1);
	const radius = 0.78;
	const hits: { i: number; dist: number; pass: TonalPass }[] = [];
	for (let i = 0; i < n; i++) {
		const dist = Math.abs(t * span - i);
		if (dist > radius) continue;
		const bandT = n === 1 ? t : i / span;
		const inkT = bandT * 0.55 + t * 0.45;
		const gi = Math.round(Math.min(1, Math.max(0, inkT)) * (INK_RAMP.length - 1));
		const stagger = (i % 3) - 1;
		hits.push({
			i,
			dist,
			pass: {
				ch: INK_RAMP[gi],
				rgb: colors[i],
				dx: stagger * 0.22,
				dy: (i % 2 === 0 ? -1 : 1) * 0.1
			}
		});
	}
	hits.sort((a, b) => b.dist - a.dist);
	return hits.slice(0, 3).map((hit) => hit.pass);
}
