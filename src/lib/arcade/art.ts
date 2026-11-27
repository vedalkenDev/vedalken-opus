/**
 * Illustrated text art for the arcade, drawn the way the site's helmet is: one glyph per cell,
 * outline glyphs on the silhouette, shade blocks for volume, and colour that comes from light.
 *
 * Each frame is two grids of equal size. `glyphs` is the drawing. `paint` is a sparse accent
 * layer over it: a space means "shade this cell from the light", and a letter pins a colour.
 *
 *   +  brighter than the light gives      -  darker (a crease or underside)
 *   k  charcoal panel line                w  cream
 *   t  teal    c  coral    a  amber    s  sage    p  violet
 *   v  iridescent, cycles the visor gradient every frame
 *   e  ember, flickers every frame
 *   o  an eye: an ink pupil with a catchlight, drawn live so it can look and blink
 *   m  ink etched into the body: a mouth, a closed eye
 */

export type Frame = { glyphs: readonly string[]; paint: readonly string[] };
export type Sheet = readonly Frame[];

export const SHIP: Sheet = [
	{
		glyphs: [
			'       ^       ',
			'      /█\\      ',
			'      |◆|      ',
			'     /▓◆▓\\     ',
			'  ,  |▓▀▓|  ,  ',
			' /|  /▓█▓\\  |\\ ',
			'/▓▓\\/▒▓█▓▒\\/▓▓\\',
			'▓▓▓▓▓▓▓█▓▓▓▓▓▓▓',
			"'▀▀ \\▓▀ ▀▓/ ▀▀'",
			"     '   '     "
		],
		paint: [
			'       +       ',
			'      +        ',
			'      kvk      ',
			'     + v -     ',
			'  t  k k k  c  ',
			' +k  +   -  k- ',
			'+  kk     kk  -',
			't             c',
			't-- k - - k --c',
			'     e   e     '
		]
	}
];

/** A puff saucer: a teal dome, two eyes, a little smile, ember jets. */
export const DRONE: Sheet = [
	{
		glyphs: [
			'  _.-._  ',
			' /▓▓▓▓▓\\ ',
			'(▓●▓▓▓●▓)',
			'(▓▓▓ᴗ▓▓▓)',
			" '▀▀▀▀▀' ",
			"  ' ' '  "
		],
		paint: [
			'         ',
			'  +      ',
			'  o   o  ',
			'    m    ',
			'  -----  ',
			'  e e e  '
		]
	},
	{
		glyphs: [
			'  _.-._  ',
			' /▓▓▓▓▓\\ ',
			'(▓●▓▓▓●▓)',
			'(▓▓▓ᴗ▓▓▓)',
			" '▀▀▀▀▀' ",
			"   ' '   "
		],
		paint: [
			'         ',
			'  +      ',
			'  o   o  ',
			'    m    ',
			'  -----  ',
			'   e e   '
		]
	}
];

/** A star sprite: a round amber face under an iridescent tuft, on gossamer wings. */
export const WISP: Sheet = [
	{
		glyphs: [
			'    _*_    ',
			' .-./▓\\.-. ',
			'(░░(●▓●)░░)',
			" '-(▓ᴗ▓)-' ",
			'    \\▓/    ',
			'     °     '
		],
		paint: [
			'    -v-    ',
			'     +     ',
			' tt o o tt ',
			'     m     ',
			'     -     ',
			'     e     '
		]
	},
	{
		glyphs: [
			'    _*_    ',
			'    /▓\\    ',
			'.-.(●▓●).-.',
			'(░░(▓ᴗ▓)░░)',
			" '-'\\▓/'-' ",
			'     °     '
		],
		paint: [
			'    -v-    ',
			'     +     ',
			'    o o    ',
			' tt  m  tt ',
			'     -     ',
			'     e     '
		]
	}
];

/** A little helmet: a sage dome whose iridescent visor carries its eyes, like the site's own. */
export const WARDEN: Sheet = [
	{
		glyphs: [
			'     *     ',
			"  .-'▓'-.  ",
			' /▓▄▄▄▄▄▓\\ ',
			'|(█●███●█)|',
			'|▓\\▀▀▀▀▀/▓|',
			' \\▓▓▓▓▓▓▓/ ',
			"  '-' '-'  "
		],
		paint: [
			'     e     ',
			'   + +     ',
			'  +vvvvv   ',
			'  vovvvov  ',
			'   vvvvv   ',
			'           ',
			'  - - - -  '
		]
	},
	{
		glyphs: [
			'     +     ',
			"  .-'▓'-.  ",
			' /▓▄▄▄▄▄▓\\ ',
			'|(█●███●█)|',
			'|▓\\▀▀▀▀▀/▓|',
			' \\▓▓▓▓▓▓▓/ ',
			"   '-'-'   "
		],
		paint: [
			'     e     ',
			'   + +     ',
			'  +vvvvv   ',
			'  vovvvov  ',
			'   vvvvv   ',
			'           ',
			'   - - -   '
		]
	}
];

/** Where the boss's eyes centre, in cells. The renderer paints the pupils live so they follow the ship. */
export const BOSS_EYES = [
	{ col: 11, row: 6 },
	{ col: 21, row: 6 }
] as const;

/** Rows 4 to 7 of the boss: brows, lids and eyes. Every other row is shared by all its frames. */
type Face = { glyphs: readonly string[]; paint: readonly string[] };

const BOSS_TOP = {
	glyphs: [
		'              ^ * ^              ',
		"          .-'▓▓▓▓▓▓▓'-.          ",
		"▄      .-'▓▓▓▓▓▓▓▓▓▓▓▓▓'-.      ▄",
		"▓▓▄   /▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\\   ▄▓▓"
	],
	paint: [
		'              v v v              ',
		'             +++                 ',
		'p         ++                    p',
		'ppp       +                   ppp'
	]
};

const BOSS_BOTTOM = {
	glyphs: [
		'      \\▓▓▄▄▓▓▓▓╰─╯▓▓▓▓▄▄▓▓/      ',
		'       \\▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓/       ',
		"        '-.▓▓▓▓▓▓▓▓▓▓▓.-'        "
	],
	paint: [
		'         cc    mmm    cc         ',
		'                                 ',
		'           -----------           '
	]
};

const BOSS_LID = '     |▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|     ';

const head = (face: Face): Frame => ({
	glyphs: [...BOSS_TOP.glyphs, ...face.glyphs, ...BOSS_BOTTOM.glyphs],
	paint: [...BOSS_TOP.paint, ...face.paint, ...BOSS_BOTTOM.paint]
});

/**
 * The Unwritten: a dreaming octopoid under a small star crown, on little bat wings. Its tentacles
 * are drawn by the renderer. Frame 0 is wide awake with set brows, frame 1 half-lidded and
 * dreamy, frame 2 a slow blink.
 */
export const BOSS: Sheet = [
	head({
		glyphs: [
			'▓▓▓▓▄|▓▓▓▄▀▀▀▄▓▓▓▓▓▄▀▀▀▄▓▓▓|▄▓▓▓▓',
			"▀ ▀ ▀|▓▓▓▄███▄▓▓▓▓▓▄███▄▓▓▓|▀ ▀ ▀",
			'     |▓▓▓█████▓▓▓▓▓█████▓▓▓|     ',
			'     |▓▓▓▀███▀▓▓▓▓▓▀███▀▓▓▓|     '
		],
		paint: [
			'ppppp    kkkkk     kkkkk    ppppp',
			'p p p    wwwww     wwwww    p p p',
			'         wwwww     wwwww         ',
			'         wwwww     wwwww         '
		]
	}),
	head({
		glyphs: [
			'▓▓▓▓▄|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|▄▓▓▓▓',
			"▀ ▀ ▀|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|▀ ▀ ▀",
			'     |▓▓▓▄▄▄▄▄▓▓▓▓▓▄▄▄▄▄▓▓▓|     ',
			'     |▓▓▓▀███▀▓▓▓▓▓▀███▀▓▓▓|     '
		],
		paint: [
			'ppppp                       ppppp',
			'p p p                       p p p',
			'         wwwww     wwwww         ',
			'         wwwww     wwwww         '
		]
	}),
	head({
		glyphs: [
			'▓▓▓▓▄|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|▄▓▓▓▓',
			"▀ ▀ ▀|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|▀ ▀ ▀",
			'     |▓▓▓╰───╯▓▓▓▓▓╰───╯▓▓▓|     ',
			BOSS_LID
		],
		paint: [
			'ppppp                       ppppp',
			'p p p                       p p p',
			'         mmmmm     mmmmm         ',
			'                                 '
		]
	})
];
