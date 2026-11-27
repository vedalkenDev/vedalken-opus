<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { createGame, step, STEP, END_DELAY, type Game, type Input, type Outcome, type Reached } from '#lib/arcade/sim.ts';
	import { createView, fit, draw, drawAttract, type View } from '#lib/arcade/render.ts';
	import { createAudio, soundSettings, type SoundSettings } from '#lib/arcade/audio.ts';
	import { insert, loadBoard, qualifies, saveBoard, toInitials, type Board, type ScoreEntry } from '#lib/arcade/scores.ts';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	type Result = { outcome: Outcome; score: number; reached: Reached };

	/** What the visitor sees. The game simulation lives apart, in `game`. */
	type Experience =
		| { kind: 'closed' }
		| { kind: 'reveal' }
		| { kind: 'title' }
		| { kind: 'scores'; highlight: number }
		| { kind: 'playing' }
		| { kind: 'paused' }
		| { kind: 'initials'; result: Result }
		| { kind: 'results'; result: Result; place: number };

	type Held = 'left' | 'right' | 'up' | 'down' | 'fire';
	const KEYS: Partial<Record<string, Held>> = {
		ArrowLeft: 'left',
		KeyA: 'left',
		ArrowRight: 'right',
		KeyD: 'right',
		ArrowUp: 'up',
		KeyW: 'up',
		ArrowDown: 'down',
		KeyS: 'down',
		Space: 'fire'
	};

	let experience = $state<Experience>({ kind: 'closed' });
	let board = $state<Board>({ entries: [], persistent: true });
	let sound = $state<SoundSettings>(soundSettings());
	let touch = $state(false);
	let lit = $state(false);
	let status = $state('');
	let initials = $state('');
	let initialsError = $state('');
	let knob = $state({ x: 0, y: 0 });

	let dialog: HTMLDialogElement | undefined;
	let screenEl: HTMLDivElement | undefined;
	let canvasEl: HTMLCanvasElement | undefined;
	let stickEl: HTMLDivElement | undefined;
	let snapEl: HTMLCanvasElement | undefined = $state();
	let cartArt: HTMLCanvasElement | undefined = $state();
	let cartEl: HTMLDivElement | undefined = $state();
	let consoleEl: HTMLDivElement | undefined = $state();
	let tvEl: HTMLSpanElement | undefined = $state();
	let rigEl: HTMLDivElement | undefined = $state();
	let feedEl: HTMLCanvasElement | undefined = $state();
	let veilEl: HTMLDivElement | undefined = $state();
	let titleEl: HTMLElement | undefined = $state();
	/** How far down the screen the title's words reach, so the attract cast can stand clear of them. */
	let titleReach = 0;

	// Owned by the loop, never rendered by Svelte.
	let game: Game | null = null;
	let view: View | null = null;
	let raf = 0;
	let last = 0;
	let acc = 0;
	let revealRun = 0;
	let restore: { scrollY: number; focus: HTMLElement | null; overflow: string } | null = null;
	const held = new Set<Held>();
	let lastTap: { direction: Exclude<Held, 'fire'>; time: number } | null = null;
	let pendingDash: { x: number; y: number } | undefined;
	let stickDirection: Exclude<Held, 'fire'> | null = null;
	function clearInput() {
		held.clear();
		lastTap = null;
		pendingDash = undefined;
	}
	const stick = { x: 0, y: 0, id: -1, cx: 0, cy: 0, r: 1 };
	const audio = createAudio();

	let reduce: MediaQueryList | null = null;
	let coarse: MediaQueryList | null = null;
	const reduced = () => reduce?.matches ?? false;

	const best = $derived(board.entries[0]);

	export async function launch(source: HTMLCanvasElement) {
		if (!dialog || experience.kind !== 'closed') return;
		const html = document.documentElement;
		restore = {
			scrollY: window.scrollY,
			focus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
			overflow: html.style.overflow
		};
		html.style.overflow = 'hidden';
		board = loadBoard();
		sound = soundSettings();
		touch = coarse?.matches ?? false;
		lit = false;
		experience = { kind: 'reveal' };
		open = true;
		dialog.showModal();
		await tick();
		screenEl?.focus({ preventScroll: true });
		if (canvasEl && !view) view = createView(canvasEl, reduced());
		if (view) view.reduced = reduced();
		startLoop();
		const run = ++revealRun;
		await reveal(source, run);
		if (run === revealRun && experience.kind === 'reveal') await toTitle();
	}

	/**
	 * The helmet condenses into a cartridge, the cartridge glides up over a console and slides into its
	 * slot, the console's screen powers on with the live attract loop, and that screen grows into the
	 * game's own. Each beat starts once the last has landed, so nothing crosses anything else.
	 */
	async function reveal(source: HTMLCanvasElement, run: number) {
		const go = (el: Element | undefined, frames: Keyframe[], options: KeyframeAnimationOptions) =>
			el?.animate ? el.animate(frames, { fill: 'both', ...options }).finished : Promise.resolve();
		const alive = () => run === revealRun && experience.kind === 'reveal';
		const out = 'cubic-bezier(0.16, 1, 0.3, 1)';
		const inOut = 'cubic-bezier(0.65, 0, 0.35, 1)';
		try {
			if (cartArt) {
				cartArt.width = source.width;
				cartArt.height = source.height;
				cartArt.getContext('2d')?.drawImage(source, 0, 0);
			}
			if (reduced()) {
				// No travel: the page dims, the console is already loaded and on, then it gives way to the game.
				lit = true;
				powerFeed();
				await Promise.all([
					go(veilEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 }),
					go(rigEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 180 }),
					go(feedEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 180 })
				]);
				await go(rigEl, [{ opacity: 1 }, { opacity: 1 }], { duration: 650 });
				if (!alive()) return;
				await Promise.all([
					go(rigEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }),
					go(feedEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }),
					go(screenEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
				]);
				return;
			}
			const box = source.getBoundingClientRect();
			if (snapEl) {
				snapEl.width = source.width;
				snapEl.height = source.height;
				snapEl.getContext('2d')?.drawImage(source, 0, 0);
				Object.assign(snapEl.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
			}
			// The cart's box is measured where it rests, its contacts on the slot's lip.
			const cart = cartEl?.getBoundingClientRect() ?? box;
			const h = cartEl?.offsetHeight ?? 0;
			const lift = h * 0.24;
			const depth = h * 0.26;
			const s = Math.min(1.6, Math.max(0.7, box.width / cart.width / 2));
			// The rig is scaled up on big screens, and the cart moves inside it, so screen distances shrink by that scale.
			const k = rigEl?.offsetWidth ? rigEl.getBoundingClientRect().width / rigEl.offsetWidth : 1;
			const dx = (box.left + box.width / 2 - (cart.left + cart.width / 2)) / k;
			const dy = (box.top + box.height / 2 - (cart.top + cart.height / 2)) / k;
			const hover = `translate(0px, ${-lift}px) scale(1)`;
			const split = (px: number) => `drop-shadow(${px}px 0 #d96350) drop-shadow(${-px}px 0 #3fb6af)`;

			await Promise.all([
				// The page dims away and leaves the helmet, which splits into its two lights and condenses.
				go(veilEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }),
				go(
					snapEl,
					[
						{ opacity: 1, transform: 'none', filter: split(0) },
						{ opacity: 1, transform: 'none', filter: split(3), offset: 0.35 },
						{ opacity: 0, transform: `scale(${(s * cart.width) / box.width})`, filter: split(1) }
					],
					{ duration: 420, delay: 80, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' }
				),
				go(cartEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: 340 }),
				// It rises to hang over the slot before the console arrives beneath it.
				go(cartEl, [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: hover }], {
					duration: 460,
					delay: 500,
					easing: inOut
				}),
				go(consoleEl, [{ opacity: 0, transform: 'translateY(1.5rem)' }, { opacity: 1, transform: 'none' }], {
					duration: 360,
					delay: 900,
					easing: out
				})
			]);
			if (!alive()) return;
			// Clip the cart's bottom by as much as it has passed the slot's lip, so it slides in rather than over.
			const clip = (px: number) => `inset(-0.5rem -0.5rem ${px}px -0.5rem)`;
			await go(
				cartEl,
				[
					{ transform: hover, clipPath: clip(0) },
					{ transform: 'translate(0px, 0px) scale(1)', clipPath: clip(0), offset: lift / (lift + depth) },
					{ transform: `translate(0px, ${depth}px) scale(1)`, clipPath: clip(depth) }
				],
				{ duration: 280, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' }
			);
			if (!alive()) return;
			lit = true;
			const tv = powerFeed();
			// A tube warming up: a bright line that opens into the picture.
			await go(
				feedEl,
				[
					{ opacity: 0, transform: 'scale(0.5, 0.02)', filter: 'brightness(3)' },
					{ opacity: 1, transform: 'scale(1, 0.02)', filter: 'brightness(3)', offset: 0.35 },
					{ opacity: 1, transform: 'scale(1, 1)', filter: 'brightness(1.4)', offset: 0.8 },
					{ opacity: 1, transform: 'scale(1, 1)', filter: 'brightness(1)' }
				],
				{ duration: 340, delay: 40, easing: 'ease-out' }
			);
			if (!alive() || !tv) return;
			// The little screen becomes the game's: same picture, flown to the same rectangle.
			const to = canvasEl?.getBoundingClientRect() ?? tv;
			const fx = to.left + to.width / 2 - (tv.left + tv.width / 2);
			const fy = to.top + to.height / 2 - (tv.top + tv.height / 2);
			await Promise.all([
				go(feedEl, [{ transform: 'none' }, { transform: `translate(${fx}px, ${fy}px) scale(${to.width / tv.width}, ${to.height / tv.height})` }], {
					duration: 600,
					delay: 160,
					easing: inOut
				}),
				go(rigEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 160, easing: 'ease-out' }),
				go(screenEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 660 })
			]);
		} catch {
			// Cancelled by a skip or an exit.
		}
	}

	/** Lays the feed over the console's screen and starts it showing what the game's screen shows. */
	function powerFeed(): DOMRect | undefined {
		if (!feedEl || !tvEl || !canvasEl) return;
		const r = tvEl.getBoundingClientRect();
		feedEl.width = canvasEl.width;
		feedEl.height = canvasEl.height;
		Object.assign(feedEl.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
		feedEl.getContext('2d')?.drawImage(canvasEl, 0, 0);
		return r;
	}

	function skipReveal() {
		revealRun++;
		void toTitle();
	}

	function clearScreenAnimations() {
		for (const a of screenEl?.getAnimations?.() ?? []) a.cancel();
	}

	async function focusPanel() {
		await tick();
		const target = screenEl?.querySelector<HTMLElement>('[data-autofocus]') ?? screenEl?.querySelector<HTMLElement>('.panel button');
		target?.focus({ preventScroll: true });
	}

	async function toTitle() {
		game = null;
		clearInput();
		releaseStick();
		board = loadBoard();
		experience = { kind: 'title' };
		await tick();
		clearScreenAnimations();
		await focusPanel();
	}

	function start() {
		game = createGame((Math.random() * 2 ** 31) | 0);
		acc = 0;
		last = performance.now();
		clearInput();
		releaseStick();
		status = 'Wave 1 of 5.';
		experience = { kind: 'playing' };
		audio.play('select');
		screenEl?.focus({ preventScroll: true });
	}

	function pause() {
		if (experience.kind !== 'playing') return;
		clearInput();
		releaseStick();
		audio.music('none');
		experience = { kind: 'paused' };
		status = 'Paused.';
		void focusPanel();
	}

	function resume() {
		if (experience.kind !== 'paused' || !game) return;
		last = performance.now();
		acc = 0;
		experience = { kind: 'playing' };
		status = '';
		screenEl?.focus({ preventScroll: true });
	}

	function finish(g: Game) {
		if (g.stage.kind !== 'ended') return;
		const result: Result = { outcome: g.stage.outcome, score: g.score, reached: g.reached };
		game = null;
		audio.music('none');
		board = loadBoard();
		status = `${result.outcome === 'victory' ? 'Victory' : 'Game over'}. Score ${result.score}.`;
		initials = '';
		initialsError = '';
		experience = qualifies(board.entries, result.score) ? { kind: 'initials', result } : { kind: 'results', result, place: -1 };
		void focusPanel();
	}

	function saveInitials(raw: string | null) {
		if (experience.kind !== 'initials') return;
		const result = experience.result;
		if (raw === null) {
			experience = { kind: 'results', result, place: -1 };
			void focusPanel();
			return;
		}
		const tag = toInitials(raw);
		if (!tag) {
			initialsError = 'Use three letters or numbers.';
			return;
		}
		const entry: ScoreEntry = { initials: tag, score: result.score, reached: result.reached, victory: result.outcome === 'victory', at: Date.now() };
		const next = insert(loadBoard().entries, entry);
		board = saveBoard(next.entries);
		audio.play('select');
		experience = { kind: 'results', result, place: next.place };
		void focusPanel();
	}

	function showScores(highlight = -1) {
		board = loadBoard();
		experience = { kind: 'scores', highlight };
		void focusPanel();
	}

	function exit() {
		if (experience.kind === 'closed') return;
		revealRun++;
		experience = { kind: 'closed' };
		game = null;
		clearInput();
		releaseStick();
		audio.music('none');
		stopLoop();
		open = false;
		clearScreenAnimations();
		if (dialog?.open) dialog.close();
		const r = restore;
		restore = null;
		if (!r) return;
		document.documentElement.style.overflow = r.overflow;
		r.focus?.focus({ preventScroll: true });
		window.scrollTo({ top: r.scrollY, behavior: 'instant' });
	}

	/** Escape walks one step back toward the page. */
	function back() {
		switch (experience.kind) {
			case 'reveal':
				return skipReveal();
			case 'title':
				return exit();
			case 'scores':
			case 'results':
				return void toTitle();
			case 'playing':
				return pause();
			case 'paused':
				return resume();
			case 'initials':
				return saveInitials(null);
			case 'closed':
				return;
		}
	}

	function setSound(next: Partial<SoundSettings>) {
		sound = audio.set(next);
		audio.play('select');
	}

	const toggleMute = () => setSound({ muted: !sound.muted });

	function directionTap(direction: Exclude<Held, 'fire'>) {
		const now = performance.now();
		if (lastTap?.direction === direction && now - lastTap.time < 350) {
			pendingDash = { x: direction === 'left' ? -1 : direction === 'right' ? 1 : 0, y: direction === 'up' ? -1 : direction === 'down' ? 1 : 0 };
			lastTap = null;
		} else lastTap = { direction, time: now };
	}

	function input(): Input {
		let x = stick.x;
		let y = stick.y;
		if (held.has('left')) x -= 1;
		if (held.has('right')) x += 1;
		if (held.has('up')) y -= 1;
		if (held.has('down')) y += 1;
		return { x, y, fire: touch || held.has('fire') };
	}

	function drain(g: Game) {
		for (const e of g.events) {
			switch (e.kind) {
				case 'shot':
				case 'hit':
				case 'kill':
					audio.play(e.kind);
					break;
				case 'down':
					audio.play('down');
					status = e.lives > 0 ? `Ship lost. ${e.lives} ${e.lives === 1 ? 'life' : 'lives'} left.` : 'Ship lost.';
					break;
				case 'banner':
					audio.play('banner');
					status = e.next === 'boss' ? 'Warning. The Unwritten approaches.' : `Wave ${e.next} of 5.`;
					break;
				case 'cleared':
					audio.play('cleared');
					status = `Wave ${e.wave} cleared. Bonus ${e.bonus}.`;
					break;
				case 'bossPhase':
					audio.play('bossPhase');
					status = 'The Unwritten shifts.';
					break;
				case 'bossDown':
					audio.play('bossDown');
					status = 'The Unwritten falls.';
					break;
				case 'power':
					status = `${e.power === 'rapid' ? 'Rapid fire' : e.power === 'spread' ? 'Spread shot' : 'Dash'} level ${e.level}, 40 seconds.`;
					break;
				case 'ended':
					audio.play(e.outcome === 'victory' ? 'victory' : 'defeat');
					break;
			}
		}
		g.events.length = 0;
	}

	function frame(now: number) {
		raf = requestAnimationFrame(frame);
		if (!view || !canvasEl) return;
		const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
		last = now;
		fit(view, canvasEl);
		const x = experience;
		if (x.kind === 'playing' && game) {
			acc = Math.min(acc + dt, 0.25);
			while (acc >= STEP) {
				step(game, { ...input(), dash: pendingDash }, STEP);
				pendingDash = undefined;
				acc -= STEP;
			}
			drain(game);
			audio.music(game.stage.kind === 'boss' ? 'boss' : 'waves');
			draw(view, game);
			if (game.stage.kind === 'ended' && game.stage.t >= END_DELAY) finish(game);
		} else if (x.kind === 'paused' && game) {
			draw(view, game);
		} else {
			drawAttract(view, now / 1000, x.kind === 'title' ? titleReach : 0);
			if (x.kind === 'title' || x.kind === 'scores') audio.music('title');
			if (x.kind === 'reveal' && feedEl?.width) feedEl.getContext('2d')?.drawImage(canvasEl, 0, 0, feedEl.width, feedEl.height);
		}
	}

	// Layout offsets ignore the title's settle animation, and the menu grows when sound rows appear.
	$effect(() => {
		const el = titleEl;
		if (!el) return;
		const measure = () => {
			const last = el.lastElementChild as HTMLElement | null;
			titleReach = last && el.offsetHeight ? (last.offsetTop + last.offsetHeight) / el.offsetHeight : 0;
		};
		const watch = new ResizeObserver(measure);
		watch.observe(el);
		for (const part of el.children) watch.observe(part);
		return () => {
			watch.disconnect();
			titleReach = 0;
		};
	});

	function startLoop() {
		if (raf) return;
		last = performance.now();
		raf = requestAnimationFrame(frame);
	}

	function stopLoop() {
		cancelAnimationFrame(raf);
		raf = 0;
	}

	/** Arrow keys move between menu rows, like the site index. */
	function moveFocus(dir: 1 | -1) {
		const rows = [...(screenEl?.querySelectorAll<HTMLElement>('.panel .menu button') ?? [])];
		if (rows.length === 0) return;
		const i = rows.indexOf(document.activeElement as HTMLElement);
		rows[(i + dir + rows.length) % rows.length]?.focus();
		audio.play('move');
	}

	function onKeyDown(e: KeyboardEvent) {
		if (experience.kind === 'closed') return;
		// The site index shortcut stays asleep while the arcade owns the screen.
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			e.stopImmediatePropagation();
			return;
		}
		if (e.key === 'Escape') {
			// Preventing the keydown keeps the dialog from closing itself.
			e.preventDefault();
			e.stopImmediatePropagation();
			back();
			return;
		}
		if (experience.kind === 'reveal') {
			e.preventDefault();
			skipReveal();
			return;
		}
		const typing = e.target instanceof HTMLInputElement;
		if (!typing && e.code === 'KeyM' && !e.metaKey && !e.ctrlKey && !e.altKey) {
			toggleMute();
			return;
		}
		if (experience.kind === 'playing') {
			if (e.code === 'KeyP') {
				e.preventDefault();
				pause();
				return;
			}
			const k = KEYS[e.code];
			if (!k) return;
			e.preventDefault();
			touch = false;
			if (k !== 'fire' && !e.repeat && !held.has(k)) directionTap(k);
			held.add(k);
			return;
		}
		if (!typing && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			e.preventDefault();
			moveFocus(e.key === 'ArrowDown' ? 1 : -1);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const k = KEYS[e.code];
		if (k) held.delete(k);
	}

	function releaseStick() {
		stick.x = 0;
		stick.y = 0;
		stick.id = -1;
		stickDirection = null;
		knob = { x: 0, y: 0 };
	}

	function stickMove(e: PointerEvent) {
		if (e.pointerId !== stick.id) return;
		let dx = e.clientX - stick.cx;
		let dy = e.clientY - stick.cy;
		const d = Math.hypot(dx, dy);
		if (d > stick.r) {
			dx = (dx / d) * stick.r;
			dy = (dy / d) * stick.r;
		}
		knob = { x: dx, y: dy };
		const dead = 0.14;
		const m = Math.min(1, d / stick.r);
		const k = m < dead ? 0 : (m - dead) / (1 - dead) / (m || 1);
		stick.x = (dx / stick.r) * k;
		stick.y = (dy / stick.r) * k;
		const direction = m < 0.35 ? null : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
		if (direction && direction !== stickDirection && stickDirection === null) directionTap(direction);
		stickDirection = direction;
	}

	function stickDown(e: PointerEvent) {
		if (!stickEl || experience.kind !== 'playing') return;
		e.preventDefault();
		const box = stickEl.getBoundingClientRect();
		stick.id = e.pointerId;
		stick.cx = box.left + box.width / 2;
		stick.cy = box.top + box.height / 2;
		stick.r = box.width * 0.36;
		stickEl.setPointerCapture?.(e.pointerId);
		stickMove(e);
	}

	function stickUp(e: PointerEvent) {
		if (e.pointerId === stick.id) releaseStick();
	}

	function onCancel(e: Event) {
		e.preventDefault();
		back();
	}

	function onClose() {
		if (experience.kind !== 'closed') exit();
	}

	function onInitials(e: Event & { currentTarget: HTMLInputElement }) {
		const clean = e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
		e.currentTarget.value = clean;
		initials = clean;
		initialsError = '';
	}

	const reachedLabel = (r: number) => (r === 6 ? 'the unwritten' : `wave ${r}`);
	const pad = (n: number) => String(n).padStart(6, '0');

	onMount(() => {
		reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		coarse = window.matchMedia('(pointer: coarse)');
		const sleep = () => {
			if (document.hidden) pause();
		};
		const blur = () => pause();
		const anyTouch = (e: PointerEvent) => {
			if (e.pointerType === 'touch' && experience.kind !== 'closed') touch = true;
		};
		// A click, not a press, skips: the whole tap is spent before the title's menu appears under it.
		const tapSkip = () => {
			if (experience.kind === 'reveal') skipReveal();
		};
		const motion = () => {
			if (view) view.reduced = reduced();
		};
		window.addEventListener('keydown', onKeyDown, { capture: true });
		window.addEventListener('keyup', onKeyUp, { capture: true });
		window.addEventListener('blur', blur);
		document.addEventListener('visibilitychange', sleep);
		reduce.addEventListener('change', motion);
		dialog?.addEventListener('pointerdown', anyTouch);
		dialog?.addEventListener('click', tapSkip);
		stickEl?.addEventListener('pointerdown', stickDown);
		stickEl?.addEventListener('pointermove', stickMove);
		stickEl?.addEventListener('pointerup', stickUp);
		stickEl?.addEventListener('pointercancel', stickUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown, { capture: true });
			window.removeEventListener('keyup', onKeyUp, { capture: true });
			window.removeEventListener('blur', blur);
			document.removeEventListener('visibilitychange', sleep);
			reduce?.removeEventListener('change', motion);
			dialog?.removeEventListener('pointerdown', anyTouch);
			dialog?.removeEventListener('click', tapSkip);
			stickEl?.removeEventListener('pointerdown', stickDown);
			stickEl?.removeEventListener('pointermove', stickMove);
			stickEl?.removeEventListener('pointerup', stickUp);
			stickEl?.removeEventListener('pointercancel', stickUp);
			stopLoop();
			audio.dispose();
			if (restore) document.documentElement.style.overflow = restore.overflow;
		};
	});
</script>

{#snippet soundRows()}
	<li>
		<button type="button" aria-pressed={!sound.muted} onclick={toggleMute}>sound: {sound.muted ? 'off' : 'on'}</button>
	</li>
	{#if !sound.muted}
		<li>
			<button type="button" aria-pressed={sound.music} onclick={() => setSound({ music: !sound.music })}>music: {sound.music ? 'on' : 'off'}</button>
		</li>
		<li>
			<button type="button" aria-pressed={sound.effects} onclick={() => setSound({ effects: !sound.effects })}>effects: {sound.effects ? 'on' : 'off'}</button>
		</li>
	{/if}
{/snippet}

{#snippet storageNote()}
	{#if !board.persistent}
		<p class="note">storage is unavailable. scores last until you leave the page.</p>
	{/if}
{/snippet}

<dialog
	bind:this={dialog}
	class="arcade"
	class:touch
	data-phase={experience.kind}
	aria-label="Cosmic arcade"
	oncancel={onCancel}
	onclose={onClose}
>
	<header class="bar">
		<span class="brand" aria-hidden="true">:: cosmic arcade ::</span>
		<div class="actions">
			<button type="button" aria-pressed={!sound.muted} onclick={toggleMute}>{sound.muted ? 'sound off' : 'sound on'}</button>
			{#if experience.kind === 'playing'}
				<button type="button" onclick={pause}>pause</button>
			{/if}
			<button type="button" onclick={exit}>exit</button>
		</div>
	</header>

	<div class="well">
		<div class="screen" bind:this={screenEl} tabindex="-1">
			<canvas bind:this={canvasEl} aria-hidden="true"></canvas>

			{#if experience.kind === 'title'}
				<section class="panel title" aria-labelledby="arcade-title" bind:this={titleEl}>
					<h2 id="arcade-title" class="logo">
						<span>COSMIC</span>
						<span>ARCADE</span>
					</h2>
					<p class="tag">five waves. one unwritten thing.</p>
					<ul class="menu">
						<li><button type="button" data-autofocus onclick={start}>start</button></li>
						<li><button type="button" onclick={() => showScores()}>high scores</button></li>
						{@render soundRows()}
						<li><button type="button" onclick={exit}>exit</button></li>
					</ul>
					{#if best}
						<p class="best">best <strong>{pad(best.score)}</strong> {best.initials}</p>
					{/if}
					<p class="hint">
						{#if touch}
							drag to fly · fire is automatic · double-flick to dash with D.
						{:else}
							arrows or wasd fly · space fires · double-tap to dash with D
						{/if}
					</p>
					<p class="hint">collect R rapid fire · P spread shot · D dash</p>
				</section>
			{:else if experience.kind === 'scores'}
				<section class="panel" aria-labelledby="arcade-scores">
					<h2 id="arcade-scores">HIGH SCORES</h2>
					{#if board.entries.length === 0}
						<p class="tag">no signals recorded yet.</p>
					{:else}
						<ol class="board">
							{#each board.entries as entry, i (entry.at + entry.initials + i)}
								<li class:mine={i === experience.highlight}>
									<span class="rank">{String(i + 1).padStart(2, '0')}</span>
									<span>{entry.initials}</span>
									<span class="pts">{pad(entry.score)}</span>
									<span class="reach">{entry.victory ? '★' : reachedLabel(entry.reached)}</span>
								</li>
							{/each}
						</ol>
					{/if}
					{@render storageNote()}
					<ul class="menu">
						<li><button type="button" data-autofocus onclick={() => toTitle()}>back</button></li>
					</ul>
				</section>
			{:else if experience.kind === 'paused'}
				<section class="panel" aria-labelledby="arcade-paused">
					<h2 id="arcade-paused">PAUSED</h2>
					<ul class="menu">
						<li><button type="button" data-autofocus onclick={resume}>resume</button></li>
						<li><button type="button" onclick={start}>restart</button></li>
						{@render soundRows()}
						<li><button type="button" onclick={() => toTitle()}>quit to title</button></li>
						<li><button type="button" onclick={exit}>exit arcade</button></li>
					</ul>
				</section>
			{:else if experience.kind === 'initials'}
				<section class="panel" aria-labelledby="arcade-initials">
					<h2 id="arcade-initials">NEW HIGH SCORE</h2>
					<p class="score">{pad(experience.result.score)}</p>
					<form
						class="initials"
						onsubmit={(e) => {
							e.preventDefault();
							saveInitials(initials);
						}}
					>
						<label for="arcade-initials-input">your initials</label>
						<input
							id="arcade-initials-input"
							data-autofocus
							value={initials}
							oninput={onInitials}
							maxlength="3"
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							inputmode="text"
							aria-describedby="arcade-initials-help"
							aria-invalid={initialsError !== ''}
						/>
						<p id="arcade-initials-help" class="note" class:error={initialsError !== ''}>
							{initialsError || 'three letters or numbers'}
						</p>
						<ul class="menu">
							<li><button type="submit" disabled={toInitials(initials) === null}>save</button></li>
							<li><button type="button" onclick={() => saveInitials(null)}>skip</button></li>
						</ul>
					</form>
					{@render storageNote()}
				</section>
			{:else if experience.kind === 'results'}
				{@const r = experience.result}
				<section class="panel" aria-labelledby="arcade-results">
					<h2 id="arcade-results" class:win={r.outcome === 'victory'}>
						{r.outcome === 'victory' ? 'THE UNWRITTEN IS UNMADE' : 'SIGNAL LOST'}
					</h2>
					<p class="score">{pad(r.score)}</p>
					<p class="tag">
						{r.outcome === 'victory' ? 'all five waves and the boss.' : `reached ${reachedLabel(r.reached)}.`}
						{#if experience.place >= 0}rank {experience.place + 1}.{/if}
					</p>
					{@render storageNote()}
					<ul class="menu">
						<li><button type="button" data-autofocus onclick={start}>play again</button></li>
						<li><button type="button" onclick={() => showScores(experience.kind === 'results' ? experience.place : -1)}>high scores</button></li>
						<li><button type="button" onclick={() => toTitle()}>title</button></li>
						<li><button type="button" onclick={exit}>exit</button></li>
					</ul>
				</section>
			{/if}
		</div>
	</div>

	<footer class="foot">
		<div class="stick" bind:this={stickEl} class:live={touch && experience.kind === 'playing'} aria-hidden="true">
			<span class="knob" style:transform="translate({knob.x}px, {knob.y}px)"></span>
		</div>
		{#if !touch}
			<p class="hint">esc {experience.kind === 'playing' ? 'pauses' : 'steps back'}</p>
		{/if}
	</footer>

	<p class="sr-only" aria-live="polite">{status}</p>

	{#if experience.kind === 'reveal'}
		<div class="reveal" aria-hidden="true">
			<div class="veil" bind:this={veilEl}>
				<p class="skip">{touch ? 'tap' : 'press any key'} to skip</p>
			</div>
			<canvas class="snap" bind:this={snapEl}></canvas>
			<div class="rig" bind:this={rigEl}>
				<div class="console" bind:this={consoleEl}>
					<span class="deck"><span class="slot"></span></span>
					<div class="face">
						<span class="joy"></span>
						<span class="bezel"><span class="tv" bind:this={tvEl}></span></span>
						<span class="buttons"><span></span><span></span></span>
						<span class="plate">vx-1 cosmic system<span class="led" class:lit></span></span>
					</div>
				</div>
				<div class="cart" bind:this={cartEl} class:inserted={reduced()}>
					<span class="shell">
						<span class="grip"></span>
						<span class="art"><canvas bind:this={cartArt}></canvas></span>
						<span class="name">cosmic arcade</span>
					</span>
					<span class="pins"></span>
				</div>
			</div>
			<canvas class="feed" bind:this={feedEl} width="0" height="0"></canvas>
		</div>
	{/if}
</dialog>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.arcade {
		--chrome: 1px solid var(--cream);
		box-sizing: border-box;
		width: 100vw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: max(0.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
			max(0.75rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
		border: 0;
		background: var(--ground);
		color: var(--cream);
		font: inherit;
		overflow: hidden;
		overscroll-behavior: contain;
		touch-action: none;
	}

	.arcade[open] {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 0.75rem;
	}

	.arcade::backdrop {
		background: var(--ground);
	}

	/* The reveal dims the page itself, so the arcade is see-through and its chrome waits until it lands. */
	.arcade[data-phase='reveal'],
	.arcade[data-phase='reveal']::backdrop {
		background: transparent;
	}

	.bar,
	.foot {
		transition: opacity 0.32s ease-out;
	}

	.arcade[data-phase='reveal'] :is(.bar, .foot) {
		opacity: 0;
		transition: none;
	}

	/* The title settles onto the screen the reveal just landed. */
	.arcade[data-phase='title'] .panel {
		animation: settle 0.22s ease-out;
	}

	@keyframes settle {
		from {
			opacity: 0;
		}
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
	}

	.brand {
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.actions {
		display: flex;
		flex-shrink: 0;
		gap: 0.5rem;
	}

	.actions button {
		white-space: nowrap;
	}

	.touch .actions button {
		min-height: 2.75rem;
	}

	@media (max-width: 26rem) {
		.brand {
			display: none;
		}

		.bar {
			justify-content: flex-end;
		}
	}

	.actions button,
	.menu button {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0.2rem 0.4rem;
		letter-spacing: inherit;
	}

	.actions button {
		border: 1px solid color-mix(in srgb, var(--cream) 35%, transparent);
	}

	.actions button:hover,
	.actions button:focus-visible {
		border-color: var(--cream);
		outline: none;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.well {
		container-type: size;
		display: grid;
		place-items: center;
		min-height: 0;
	}

	.screen {
		container-type: inline-size;
		position: relative;
		width: min(100cqw, 75cqh);
		aspect-ratio: 3 / 4;
		border: var(--chrome);
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
		background: var(--ground);
		outline: none;
	}

	.arcade[data-phase='reveal'] .screen {
		opacity: 0;
	}

	/* The game's screen fades in over the reveal's veil, so the hand-off is seen rather than cut. */
	.arcade[data-phase='reveal'] .well {
		position: relative;
		z-index: 3;
	}

	.screen canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: default;
		image-rendering: auto;
	}

	.panel {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6em;
		padding: 1.2em;
		text-align: center;
		font-size: clamp(11px, 4.4cqw, 16px);
		line-height: 1.45;
		background: color-mix(in srgb, var(--ground) 72%, transparent);
	}

	.panel.title {
		justify-content: flex-start;
		gap: 0.5em;
		padding-top: 8%;
		font-size: clamp(11px, 4cqw, 16px);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--ground) 82%, transparent) 55%,
			transparent
		);
	}

	.panel h2 {
		margin: 0;
		font-size: 1.25em;
		font-weight: 400;
		letter-spacing: 0.16em;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.panel h2.win {
		font-size: 1em;
	}

	.logo {
		display: flex;
		flex-direction: column;
		line-height: 1.05;
	}

	.logo span {
		font-size: 2.1em;
		letter-spacing: 0.22em;
		text-indent: 0.22em;
		background: var(--visor);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none;
		filter: drop-shadow(1px 0 var(--coral)) drop-shadow(-1px 0 var(--teal));
	}

	.tag,
	.hint,
	.best,
	.note {
		margin: 0;
		color: var(--sage);
	}

	.hint,
	.note {
		font-size: 0.78em;
	}

	.panel.title .menu {
		margin: 0.2em 0;
	}

	/* A landscape phone leaves the screen too short for a stacked logo and the tag line. */
	@container (max-width: 16rem) {
		.panel.title {
			gap: 0.35em;
			padding-top: 5%;
		}

		.panel.title .logo {
			flex-direction: row;
			gap: 0.6em;
		}

		.panel.title .logo span {
			font-size: 1.25em;
		}

		.panel.title .tag {
			display: none;
		}
	}

	.best strong {
		color: var(--cream);
		font-weight: 400;
	}

	.note.error {
		color: var(--coral);
	}

	.score {
		margin: 0;
		font-size: 1.7em;
		letter-spacing: 0.12em;
	}

	.menu {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.1em;
		margin: 0.4em 0;
		padding: 0;
		list-style: none;
		min-width: 11em;
	}

	.menu button {
		width: 100%;
		text-align: left;
		padding: 0.15em 0.6em 0.15em 1.6em;
		position: relative;
	}

	.menu button::before {
		content: '>';
		position: absolute;
		left: 0.5em;
		opacity: 0;
	}

	.menu button:hover,
	.menu button:focus-visible {
		outline: none;
		background: color-mix(in srgb, var(--cream) 8%, transparent);
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.menu button:hover::before,
	.menu button:focus-visible::before {
		opacity: 1;
	}

	.menu button:disabled {
		opacity: 0.4;
	}

	.board {
		margin: 0;
		padding: 0;
		list-style: none;
		width: min(100%, 17em);
	}

	.board li {
		display: grid;
		grid-template-columns: 2em 3em 1fr auto;
		gap: 0.6em;
		padding: 0.05em 0.4em;
		text-align: left;
	}

	.board li.mine {
		color: var(--ground);
		background: var(--teal);
	}

	.rank,
	.reach {
		color: var(--sage);
	}

	.mine .rank,
	.mine .reach {
		color: inherit;
	}

	.pts {
		text-align: right;
	}

	.initials {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35em;
	}

	.initials label {
		color: var(--sage);
	}

	.initials input {
		width: 4.2em;
		padding: 0.15em 0;
		border: 1px solid var(--cream);
		background: var(--ground);
		color: var(--cream);
		font: inherit;
		font-size: 1.6em;
		letter-spacing: 0.4em;
		text-indent: 0.4em;
		text-align: center;
		text-transform: uppercase;
	}

	.initials input:focus-visible {
		outline: none;
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
	}

	.foot {
		display: flex;
		justify-content: center;
		min-height: 1.5rem;
	}

	.foot .hint {
		font-size: 0.75rem;
	}

	.stick {
		display: none;
		position: relative;
		width: 7.5rem;
		aspect-ratio: 1;
		border: 1px dashed color-mix(in srgb, var(--cream) 45%, transparent);
		border-radius: 50%;
		touch-action: none;
	}

	.stick.live {
		display: block;
	}

	.knob {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 2.8rem;
		height: 2.8rem;
		margin: -1.4rem 0 0 -1.4rem;
		border: 1px solid var(--cream);
		border-radius: 50%;
		background: color-mix(in srgb, var(--cream) 10%, var(--ground));
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
	}

	/* Reveal: helmet to cartridge to console. */
	.reveal {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.veil {
		position: absolute;
		inset: 0;
		background: var(--ground);
	}

	.snap {
		position: fixed;
	}

	.rig {
		--k: 1;
		position: absolute;
		left: 50%;
		top: 50%;
		width: min(20rem, 86vw);
		transform: translate(-50%, -30%) scale(var(--k));
	}

	/* A console sized for a phone looks like a toy on a big screen. */
	@media (min-width: 48rem) and (min-height: 46rem) {
		.rig {
			--k: 1.15;
		}
	}

	@media (min-width: 64rem) and (min-height: 54rem) {
		.rig {
			--k: 1.3;
		}
	}

	/*
	 * The cartridge. Its box ends at the contact edge, and it rests with that edge on the slot's
	 * front lip, so clipping its bottom by as much as it moves down reads as sliding into the slot.
	 */
	.cart {
		--lip: calc(0.8rem + 1px);
		position: absolute;
		left: 50%;
		bottom: calc(100% - var(--lip));
		z-index: 3;
		width: 5.4rem;
		aspect-ratio: 9 / 11;
		margin-left: -2.7rem;
		clip-path: inset(-0.5rem -0.5rem 0 -0.5rem);
		filter: drop-shadow(1px 0 0 var(--coral)) drop-shadow(-1px 0 0 var(--teal));
		opacity: 0;
	}

	.cart.inserted {
		opacity: 1;
		transform: translateY(26%);
		clip-path: inset(-0.5rem -0.5rem 26% -0.5rem);
	}

	.shell {
		position: absolute;
		inset: 0 0 0.42rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
		padding: 0.8rem 0.42rem 0.36rem;
		border: var(--chrome);
		border-radius: 0.3rem 0.3rem 0.16rem 0.16rem;
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--cream) 14%, var(--charcoal)),
			var(--charcoal) 42%,
			color-mix(in srgb, #000 35%, var(--charcoal))
		);
		clip-path: polygon(0 0, calc(100% - 0.75rem) 0, 100% 0.75rem, 100% 100%, 0 100%);
	}

	/* The chamfer's edge, which the clip would otherwise leave unlined. */
	.shell::after {
		content: '';
		position: absolute;
		top: calc(0.375rem - 2px);
		right: calc(-0.155rem - 1px);
		width: 1.06rem;
		height: 2px;
		background: var(--cream);
		transform: rotate(45deg);
	}

	.grip {
		position: absolute;
		top: 0.22rem;
		left: 0.42rem;
		right: 1.05rem;
		height: 0.36rem;
		background: repeating-linear-gradient(
			180deg,
			color-mix(in srgb, var(--cream) 30%, transparent) 0 1px,
			transparent 1px 0.12rem
		);
	}

	.art {
		flex: 1;
		min-height: 0;
		display: grid;
		place-items: center;
		border: 2px solid transparent;
		border-radius: 0.2rem;
		background:
			linear-gradient(var(--ground), var(--ground)) padding-box,
			var(--visor) border-box;
		overflow: hidden;
	}

	.art canvas {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.name {
		font-size: 0.42rem;
		line-height: 1;
		letter-spacing: 0.24em;
		text-align: center;
		text-transform: uppercase;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	/* Gold contacts on the edge that goes in first. */
	.pins {
		position: absolute;
		left: 15%;
		right: 15%;
		bottom: 0;
		height: calc(0.42rem + 1px);
		margin-top: -1px;
		box-sizing: border-box;
		padding: 0.06rem 0.12rem 0.1rem;
		border: var(--chrome);
		border-top: 0;
		border-radius: 0 0 0.14rem 0.14rem;
		background:
			repeating-linear-gradient(90deg, var(--amber) 0 0.13rem, transparent 0.13rem 0.24rem) content-box,
			color-mix(in srgb, #000 30%, var(--charcoal));
	}

	/* A bartop cabinet: a raised deck with the cartridge slot, then a portrait screen like the game's. */
	.console {
		position: relative;
		z-index: 2;
	}

	.deck {
		display: block;
		position: relative;
		height: 1.15rem;
		margin: 0 1.3rem;
		border: var(--chrome);
		border-bottom: 0;
		border-radius: 0.7rem 0.7rem 0 0;
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--cream) 16%, var(--charcoal)),
			color-mix(in srgb, var(--cream) 5%, var(--charcoal))
		);
	}

	.slot {
		position: absolute;
		left: 50%;
		top: 0.32rem;
		width: 6.2rem;
		height: 0.48rem;
		margin-left: -3.1rem;
		border-radius: 0.2rem;
		background: #000;
		box-shadow:
			inset 0 0.14rem 0.2rem #000,
			0 1px 0 color-mix(in srgb, var(--cream) 28%, transparent);
	}

	.face {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		row-gap: 0.55rem;
		margin-top: -1px;
		padding: 0.8rem 0.9rem 0.6rem;
		border: var(--chrome);
		border-radius: 0.55rem 0.55rem 1.1rem 1.1rem;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--cream) 9%, var(--charcoal)),
			color-mix(in srgb, #000 42%, var(--charcoal))
		);
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
	}

	.bezel {
		grid-column: 2;
		padding: 0.32rem;
		border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
		border-radius: 0.4rem;
		background: #0b0c10;
	}

	/* Dark glass until the feed powers on over it. */
	.tv {
		display: block;
		height: 7rem;
		aspect-ratio: 3 / 4;
		background:
			linear-gradient(155deg, color-mix(in srgb, var(--cream) 9%, transparent), transparent 38%),
			repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in srgb, var(--cream) 4%, transparent) 2px 3px),
			#07080b;
	}

	/* The console's picture, laid over its glass and later flown to the game's screen. */
	.feed {
		position: fixed;
		left: 0;
		top: 0;
		opacity: 0;
	}

	/* A ball-top stick: the ball, its shaft, and the ring it sits in. */
	.joy {
		position: relative;
		justify-self: center;
		width: 1.2rem;
		height: 1.2rem;
		margin-bottom: 1.1rem;
		border-radius: 50%;
		background: radial-gradient(
			circle at 35% 30%,
			color-mix(in srgb, var(--cream) 50%, var(--coral)),
			var(--coral) 45%,
			color-mix(in srgb, #000 35%, var(--coral))
		);
	}

	.joy::before,
	.joy::after {
		content: '';
		position: absolute;
		left: 50%;
	}

	.joy::before {
		top: calc(100% + 0.5rem);
		width: 1.7rem;
		height: 0.44rem;
		margin-left: -0.85rem;
		border: 1px solid color-mix(in srgb, var(--cream) 25%, transparent);
		border-radius: 50%;
		background: #0b0c10;
	}

	.joy::after {
		top: 100%;
		width: 0.2rem;
		height: 0.74rem;
		margin-left: -0.1rem;
		background: linear-gradient(90deg, #000, color-mix(in srgb, var(--cream) 45%, var(--charcoal)), #000);
	}

	.buttons {
		justify-self: center;
		display: flex;
		align-items: flex-start;
		gap: 0.3rem;
		margin-bottom: 0.6rem;
	}

	.buttons span {
		width: 0.95rem;
		height: 0.95rem;
		border-radius: 50%;
		background: radial-gradient(
			circle at 35% 30%,
			color-mix(in srgb, var(--cream) 45%, var(--teal)),
			var(--teal) 50%,
			color-mix(in srgb, #000 40%, var(--teal))
		);
		box-shadow: 0 2px 0 color-mix(in srgb, #000 70%, var(--teal));
	}

	.buttons span + span {
		margin-top: -0.45rem;
		background: radial-gradient(
			circle at 35% 30%,
			color-mix(in srgb, var(--cream) 45%, var(--amber)),
			var(--amber) 50%,
			color-mix(in srgb, #000 40%, var(--amber))
		);
		box-shadow: 0 2px 0 color-mix(in srgb, #000 70%, var(--amber));
	}

	.plate {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.55rem;
		letter-spacing: 0.2em;
		color: var(--sage);
	}

	.led {
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: #2a1512;
		border: 1px solid color-mix(in srgb, var(--cream) 30%, transparent);
	}

	.led.lit {
		background: var(--coral);
		box-shadow: 0 0 0.6rem var(--coral);
	}

	.skip {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 1.5rem;
		margin: 0;
		text-align: center;
		font-size: 0.72rem;
		color: var(--sage);
	}
</style>
