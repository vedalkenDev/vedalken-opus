/**
 * Synthesized sound. Nothing loads from the network and nothing plays until the visitor unmutes,
 * which is also the user gesture that lets the AudioContext start.
 */

export type Sound =
	| 'shot'
	| 'hit'
	| 'kill'
	| 'down'
	| 'banner'
	| 'cleared'
	| 'bossPhase'
	| 'bossDown'
	| 'victory'
	| 'defeat'
	| 'select'
	| 'move';

export type SoundSettings = { muted: boolean; music: boolean; effects: boolean };
export type Track = 'title' | 'waves' | 'boss' | 'none';

/** Shared for the page session so reopening the arcade keeps the visitor's choice. */
const settings: SoundSettings = { muted: true, music: true, effects: true };

export const soundSettings = (): SoundSettings => ({ ...settings });

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

// A minor pentatonic over a slow drone. Each step is a sixteenth.
const TRACKS: Record<Exclude<Track, 'none'>, { bpm: number; bass: number[]; lead: number[] }> = {
	title: { bpm: 84, bass: [45, 0, 0, 0, 45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0], lead: [69, 0, 72, 0, 76, 0, 0, 74, 0, 72, 0, 0, 69, 0, 67, 0] },
	waves: { bpm: 126, bass: [45, 0, 45, 57, 45, 0, 43, 0, 41, 0, 41, 53, 43, 0, 43, 55], lead: [81, 0, 76, 0, 79, 81, 0, 76, 74, 0, 72, 0, 74, 76, 0, 0] },
	boss: { bpm: 138, bass: [33, 33, 0, 33, 36, 0, 33, 0, 31, 31, 0, 31, 34, 0, 35, 0], lead: [0, 0, 69, 70, 0, 0, 69, 0, 0, 0, 66, 67, 0, 0, 69, 0] }
};

export type Audio = ReturnType<typeof createAudio>;

export function createAudio() {
	let ctx: AudioContext | null = null;
	let master: GainNode | null = null;
	let musicBus: GainNode | null = null;
	let fxBus: GainNode | null = null;
	let noise: AudioBuffer | null = null;
	let track: Track = 'none';
	let timer: ReturnType<typeof setInterval> | null = null;
	let nextAt = 0;
	let stepIndex = 0;

	function ensure(): AudioContext | null {
		if (ctx) return ctx;
		const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctor) return null;
		try {
			ctx = new Ctor();
		} catch {
			return null;
		}
		master = ctx.createGain();
		musicBus = ctx.createGain();
		fxBus = ctx.createGain();
		musicBus.connect(master);
		fxBus.connect(master);
		master.connect(ctx.destination);
		noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
		const data = noise.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		apply();
		return ctx;
	}

	function apply() {
		if (!ctx || !master || !musicBus || !fxBus) return;
		const now = ctx.currentTime;
		master.gain.setTargetAtTime(settings.muted ? 0 : 0.5, now, 0.02);
		musicBus.gain.setTargetAtTime(settings.music ? 0.32 : 0, now, 0.05);
		fxBus.gain.setTargetAtTime(settings.effects ? 0.6 : 0, now, 0.02);
		if (settings.muted) void ctx.suspend().catch(() => {});
		else void ctx.resume().catch(() => {});
		syncTimer();
	}

	function tone(bus: GainNode, type: OscillatorType, from: number, to: number, at: number, dur: number, vol: number) {
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(from, at);
		if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
		g.gain.setValueAtTime(0.0001, at);
		g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
		g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
		osc.connect(g).connect(bus);
		osc.start(at);
		osc.stop(at + dur + 0.02);
	}

	function hiss(at: number, dur: number, vol: number, freq: number) {
		if (!ctx || !noise || !fxBus) return;
		const src = ctx.createBufferSource();
		const filter = ctx.createBiquadFilter();
		const g = ctx.createGain();
		src.buffer = noise;
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(freq, at);
		filter.frequency.exponentialRampToValueAtTime(Math.max(60, freq / 8), at + dur);
		g.gain.setValueAtTime(vol, at);
		g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
		src.connect(filter).connect(g).connect(fxBus);
		src.start(at, Math.random() * 0.2, dur + 0.05);
	}

	function play(sound: Sound) {
		if (settings.muted || !settings.effects || !ctx || !fxBus || ctx.state !== 'running') return;
		const t = ctx.currentTime;
		const fx = fxBus;
		switch (sound) {
			case 'shot':
				return tone(fx, 'square', 1320, 520, t, 0.07, 0.08);
			case 'hit':
				return tone(fx, 'triangle', 300, 180, t, 0.05, 0.15);
			case 'kill':
				hiss(t, 0.22, 0.35, 3200);
				return tone(fx, 'square', 420, 90, t, 0.18, 0.08);
			case 'down':
				hiss(t, 0.9, 0.5, 2000);
				return tone(fx, 'sawtooth', 260, 40, t, 0.9, 0.18);
			case 'banner':
				[0, 0.09, 0.18].forEach((d, i) => tone(fx, 'square', midi(69 + i * 5), midi(69 + i * 5), t + d, 0.1, 0.06));
				return;
			case 'cleared':
				[0, 0.07, 0.14, 0.21].forEach((d, i) => tone(fx, 'triangle', midi(72 + [0, 4, 7, 12][i]), midi(72 + [0, 4, 7, 12][i]), t + d, 0.14, 0.14));
				return;
			case 'bossPhase':
				hiss(t, 1.2, 0.4, 900);
				return tone(fx, 'sawtooth', 70, 35, t, 1.4, 0.3);
			case 'bossDown':
				hiss(t, 2.2, 0.6, 4000);
				return tone(fx, 'sawtooth', 120, 25, t, 2.2, 0.3);
			case 'victory':
				[0, 0.12, 0.24, 0.36, 0.6].forEach((d, i) => tone(fx, 'square', midi([69, 72, 76, 81, 84][i]), midi([69, 72, 76, 81, 84][i]), t + d, 0.22, 0.07));
				return;
			case 'defeat':
				[0, 0.2, 0.4].forEach((d, i) => tone(fx, 'triangle', midi([64, 60, 57][i]), midi([64, 60, 57][i]) * 0.97, t + d, 0.3, 0.14));
				return;
			case 'select':
				return tone(fx, 'square', 880, 1320, t, 0.06, 0.05);
			case 'move':
				return tone(fx, 'square', 660, 660, t, 0.03, 0.03);
		}
	}

	function schedule() {
		if (!ctx || !musicBus || track === 'none') return;
		const spec = TRACKS[track];
		const sixteenth = 60 / spec.bpm / 4;
		while (nextAt < ctx.currentTime + 0.12) {
			const i = stepIndex % 16;
			const bass = spec.bass[i];
			const lead = spec.lead[i];
			if (bass) tone(musicBus, 'triangle', midi(bass), midi(bass), nextAt, sixteenth * 1.8, 0.35);
			if (lead) tone(musicBus, 'square', midi(lead), midi(lead), nextAt, sixteenth * 0.9, 0.06);
			if (track !== 'title' && i % 4 === 2) hiss(nextAt, 0.04, 0.05, 7000);
			nextAt += sixteenth;
			stepIndex++;
		}
	}

	function syncTimer() {
		const run = ctx && !settings.muted && settings.music && track !== 'none';
		if (run && !timer && ctx) {
			nextAt = ctx.currentTime + 0.05;
			timer = setInterval(schedule, 25);
		} else if (!run && timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	return {
		play,
		/** Switches the music loop. Cheap to call every frame. */
		music(next: Track) {
			if (next === track) return;
			track = next;
			stepIndex = 0;
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			syncTimer();
		},
		/** Must run inside a user gesture the first time sound is enabled. */
		set(next: Partial<SoundSettings>): SoundSettings {
			Object.assign(settings, next);
			if (!settings.muted) ensure();
			apply();
			return soundSettings();
		},
		dispose() {
			if (timer) clearInterval(timer);
			timer = null;
			track = 'none';
			void ctx?.close().catch(() => {});
			ctx = null;
		}
	};
}
