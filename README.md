# Vedalken Opus — Cosmic Archive

Luqmaan Sayed’s portfolio. He is a web designer and developer in Durban, transitioning into product. Cosmic Archive is the look: ASCII, glitch, cosmic.

This README is the on-repo brief so a new agent can run, change, and ship without the Vedalken Dev Project chat. Do not invent extra constraints. If a preference and this tree disagree, prefer the code plus the notes below.

**Owner:** Luqmaan Sayed (`vedalken.dev@gmail.com`). Do not merge pull requests unless he asks.

## What the site is

One prerendered homepage, then a page per project.

1. **Preloader** — ASCII glitch on `COSMIC ARCHIVE`. Keep it.
2. **Hero** — canvas ASCII helmet that **looks at** the pointer (orientation only).
3. **About** — Durban, product transition; Cosmic Archive, web design, interfaces, motion. Hover-video on some words (`WordVideo`).
4. **Projects** — Game Boy–style carts that wait, then slot in on click.
5. **Contact** — mailto form to `hello@vedalken.dev`.

Routes: `/`, `/work`, `/work/[slug]`, `/about`. Command palette: Ctrl/⌘K (`GameMenu`). Stars are faint and desktop-edge only (hidden under 960px).

Local checkout on Luqmaan’s machine is often `~/Documents/projects/vedalken.dev`. Same GitHub repo: [vedalkenDev/vedalken-opus](https://github.com/vedalkenDev/vedalken-opus).

## Stack

- **SvelteKit 3** (`@sveltejs/kit` ^3) + **Svelte 5 runes** (forced in `vite.config.ts`)
- **Prerender** everything (`src/routes/+layout.ts` → `export const prerender = true`)
- **`@sveltejs/adapter-static`** (wired on the SvelteKit Vite plugin in `vite.config.ts`; there is no separate `svelte.config.js`)
- **No Tailwind.** Styles live in Svelte `<style>` blocks. Palette is CSS variables on `:root`. Helmet and cart art are canvas.
- **GSAP** only if a real sequence needs it. React is not a better host for this site.
- **Node `>=22.17`**
- Imports: `#lib/*` → `src/lib/*`

```sh
npm install
npm run dev          # vite dev
npm run build        # static output in build/
npm run preview
npm run check        # svelte-check
```

Do not send Luqmaan localhost links (he often checks from his phone). Put preview evidence in the Project store `media/` instead.

## Palette

CSS variables in `src/routes/+layout.svelte`. Visor gradient is **light only**, never body text. Cream on charcoal is fine; violet/blue on charcoal is not. Page ground is near-black (not charcoal fills). No full-page scanline overlay.

| Token | Hex | Use |
|---|---|---|
| ground | `#050508` | page |
| charcoal | `#242A30` | cartridge plastic, helmet side/neck |
| cream | `#F4F3E8` | text, helmet shell highlight |
| off-white | `#d0ccbe` at 0.8 | even second shell colour next to cream, not a receding shadow |
| violet | `#592AA4` | visor loop (start/end) |
| blue | `#4277A2` | visor |
| teal | `#3FB6AF` | visor |
| sage | `#939E7A` | visor |
| amber | `#C18D5D` | visor |
| coral | `#D96350` | visor |

Helmet canvas also uses cream `[0xf4, 0xf3, 0xe8]` and charcoal `[0x24, 0x2a, 0x30]`.

## Helmet (do not regress)

Source: `src/lib/components/Helmet.svelte` + `src/lib/helmet-cells.ts`.

**Look AT the pointer.** Keyword AT. The visor gazes at the pointer’s **current** screen position. The helmet stays planted; only orientation changes (critically damped yaw/pitch around the visor centroid). After project, the visor glyph centroid is re-centered so the head does not slide.

Do **not**:

- translate / lerp the helmet toward the cursor
- chase cursor velocity / trajectory (“where it’s going”)
- invert look-at axes
- morph ASCII in `Helmet.svelte` as the design source

Color or shape of the helmet goes **Blender CLI on the GLB → forward transparent render → ASCII cells**. `DEPTH_LEVELS` is **exactly 35**.

**Visor glyphs stay fixed** as one flat block each: `▒ ▓ █` (`VISOR_BLOCK`). Glyph type does not change with color. Color walks the palette via a 3×3 vector field (`VISOR_FLOW`) and domain warp. `FLOW_RATE = 3.2` (wall-clock multiplier so the flow reads in about a second; field speeds are 0.12–0.22 rad/s of that time). Reduced motion: yaw/pitch frozen, visor time `t = 0` (static color).

Other helmet rules already in the component:

- Shell fill even `▓` (no full-block `█` on cream). PNG/letters stay on silhouette and visor opening.
- One-cell lip shift on glass only. No second offset glyph on the glass.
- After the preloader: visor blocks fade in from the center of the glass, then the shell grows outward (~1s). Reduced motion draws the finished helmet.
- Durban weather via Open-Meteo, Celsius only, ~3h cache (`src/lib/weather.ts`). Cues draw in **front of the shell, never on the visor**, and wait until the shell is in.

Disqualified (do not retry): depth-jump rims that brighten or thicken glyphs; rewriting glyph weight or size from depth; full-block `█` on the cream shell. Those flattened the shell into one blob around the visor.

## Homepage carts

Listed in `src/lib/projects.ts`. Desktop grid of four; they wait, then slot in on click (`Cartridge.svelte`). Do not invent case-study copy. PlanCheck, Zone of Awareness, and Burning Wish stay **“In progress.”** until Luqmaan writes more.

| Slug | Title | Notes |
|---|---|---|
| `plancheck` | PlanCheck | In progress. |
| `zone-of-awareness` | Zone of Awareness | In progress. |
| `burning-wish` | Burning Wish | In progress. |
| `ascii-image-generator` | ASCII image generator | Live [generator](https://vedalkendev.github.io/ascii-image-generator/), GitHub `vedalkenDev/ascii-image-generator`. Feature list + stills are in `projects.ts`. |

**Fatima Studio is not a Cosmic Archive cart.** Separate Cursor Project (`bc-f7a2db7c`), Origin repo `vedalken-dev/woo-aperture`. Local `~/Documents/projects/Fathimasstudio` is an empty worker workspace. Do not hunt protobuf or restore old agents for it. Do not put it on this homepage.

Existing Origin `vedalken-dev/vedalken.dev` is a GitHub inbound mirror of the **old** vedalken.dev repo. Do not overwrite it unless Luqmaan confirms this opus checkout is meant to replace it. Prefer Origin `vedalken-dev/vedalken-opus`.

## Shelf

`/shelf` is Luqmaan's library. It shows the real covers of books he owns, styled as physical books: spine crease, a glow taken from each cover's colours, and a tilt on hover. He tried an ASCII-generator treatment and rejected it, so do not bring it back.

1. Add `{ "isbn", "title", "author" }` to `src/lib/shelf.json`. Include `category` and, for books in a series, `series` to make them filterable. ISBNs can include hyphens. Use only books Luqmaan lists. Do not invent any.
2. Optional: put a photo of his own edition at `assets/shelf-sources/<isbn>.jpg`. If there is none, the script uses Amazon's full-size cover (about 1700px wide), then falls back to Open Library (333px).
3. Run `node scripts/shelf.mjs` (add `--force` to rebuild every cover). It writes `static/shelf/<isbn>-600.webp` and `<isbn>-1200.webp`. It needs `cwebp` and `sips` (macOS).

If a listed book has no WebP, prerender fails with a 404. That is on purpose.

## Current git work

Current Cosmic Archive work is **not** on `main`.

- GitHub: https://github.com/vedalkenDev/vedalken-opus
- Open PR: [vedalken-opus#1](https://github.com/vedalkenDev/vedalken-opus/pull/1) — branch `cursor/xp-ascii-cursor-c828`
- PR base (today): `cursor/shell-block-glyphs-1b8d`, not `main`
- `main` is behind this branch (Node engines pin, no XP cursors / later helmet motion)

**Do not merge** that PR (or any other) without Luqmaan. Keep the GitHub `origin` remote. If you add Origin, use a second remote name (for example `origin-cursor`) so GitHub remotes stay intact.

XP cursors live as CSS `cursor: url()` in `src/routes/+layout.svelte` (`static/cursors/*.png`). Fine pointer + no reduced-motion only; coarse / reduced-motion keep native keywords. No overlay library.

## Graphify before edits

Before editing Cosmic Archive or the ASCII generator, query the Graphify knowledge graph for dependencies.

- Skill: `.cursor/rules/graphify.mdc` (project-scoped; `graphify cursor install --project`)
- Source: https://github.com/Graphify-Labs/graphify
- If `graphify-out/` is missing, build with `/graphify .` first, then query
- Activate in Cursor with `/graphify`
- Do not skip the query because the files “look small”
- Do not commit `graphify-out/`, secrets, or huge binaries

This cloud checkout may not include `.cursor/rules/graphify.mdc`. If the file is present, follow it. Tracker/docs-only bookkeeping can skip Graphify.

## Prove it works

After any claimed completion (code, UI, motion, export, preview), run **Prove it works** (`/prove-it-works`):

1. Restate every clause of the request.
2. For motion/animation, research current practice this run (start at https://animations.dev and https://www.easing.dev). Save URLs. Do not ship a canned invert, a single-axis scroll, or a default lerp because it was nearby.
3. Exercise the **real** surface. One still is not enough for motion. Drive the named gesture (pointer left/right/up/down; visor over several seconds).
4. Hit edges that used to fail (reduced-motion static visor, opposite cursor axis, high cols, export vs preview).
5. Compare evidence to the request. Missing clause → not done.
6. Evidence files go under the Project store `media/` before telling Luqmaan it is finished.

Helmet look-at is not done unless proof shows the visor **facing** the pointer’s current position (not sliding, not chasing trajectory). Visor flow is not done unless proof shows multi-directional color.

## Layout of the tree

| Path | Role |
|---|---|
| `src/routes/+layout.svelte` | chrome, palette, XP cursors, stars, command palette |
| `src/routes/+page.svelte` | homepage: preloader, helmet, about, carts, contact |
| `src/lib/components/Helmet.svelte` | look-at, visor flow, weather |
| `src/lib/helmet-cells.ts` | `COLS` 100, `ROWS` 68, `DEPTH_LEVELS` 35, cell glyphs |
| `src/lib/projects.ts` | cart list — edit here for homepage work |
| `src/lib/cart-covers.ts` | cartridge mosaics |
| `src/lib/weather.ts` | Durban Open-Meteo cache |
| `src/lib/components/Cartridge.svelte` | slot-in cart |
| `src/lib/components/WordVideo.svelte` | hover-video words |
| `src/lib/components/Preloader.svelte` | ASCII glitch intro |
| `src/lib/components/Contact.svelte` | mailto `hello@vedalken.dev` |
| `static/cursors/` | XP pointer PNGs |
| `static/videos/` | about-line hover clips |

## Ship checklist for a new agent

1. Graphify query if `.cursor/rules/graphify.mdc` exists (build the graph if needed).
2. Branch from `cursor/xp-ascii-cursor-c828` unless Luqmaan names another base.
3. Change the smallest surface. Do not restyle Cosmic Archive while working a different product.
4. `npm run check` and exercise the real preview.
5. Prove it works (recording for motion).
6. Commit product work only. Push the PR branch. **Do not merge.**
