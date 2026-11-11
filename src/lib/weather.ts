export type WeatherCue = 'sun' | 'rain' | 'overcast';

export type DurbanWeather = {
	cue: WeatherCue | null;
	celsius: number;
	code: number;
	cloud: number;
	fetchedAt: number;
};

const KEY = 'vedalken.durbanWeather.v1';
const TTL_MS = 3 * 60 * 60 * 1000;
const LAT = -29.8587;
const LON = 31.0218;

export const DURBAN_WEATHER_URL =
	`https://api.open-meteo.com/v1/forecast` +
	`?latitude=${LAT}&longitude=${LON}` +
	`&current=temperature_2m,weather_code,is_day,cloud_cover,precipitation,rain` +
	`&timezone=Africa%2FJohannesburg` +
	`&temperature_unit=celsius`;

type Snapshot = DurbanWeather & { expiresAt: number };

function rainCode(code: number) {
	return (
		(code >= 51 && code <= 67) ||
		(code >= 80 && code <= 82) ||
		(code >= 95 && code <= 99)
	);
}

export function cueFromCurrent(current: {
	weather_code: number;
	cloud_cover: number;
	is_day: number;
	precipitation: number;
	rain: number;
}): WeatherCue | null {
	if (rainCode(current.weather_code) || current.precipitation > 0 || current.rain > 0) {
		return 'rain';
	}
	if (
		current.weather_code === 3 ||
		current.weather_code === 45 ||
		current.weather_code === 48 ||
		current.cloud_cover >= 55
	) {
		return 'overcast';
	}
	if (current.is_day === 1 && current.weather_code <= 2 && current.cloud_cover < 55) {
		return 'sun';
	}
	return null;
}

function readCache(): Snapshot | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const snap = JSON.parse(raw) as Snapshot;
		if (!snap || typeof snap.fetchedAt !== 'number') return null;
		return snap;
	} catch {
		return null;
	}
}

function writeCache(weather: DurbanWeather): Snapshot {
	const snap: Snapshot = { ...weather, expiresAt: weather.fetchedAt + TTL_MS };
	try {
		localStorage.setItem(KEY, JSON.stringify(snap));
	} catch {
		/* private mode */
	}
	return snap;
}

async function pull(): Promise<DurbanWeather> {
	const res = await fetch(DURBAN_WEATHER_URL);
	if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
	const data = await res.json();
	const current = data.current as {
		temperature_2m: number;
		weather_code: number;
		is_day: number;
		cloud_cover: number;
		precipitation: number;
		rain: number;
	};
	return {
		cue: cueFromCurrent(current),
		celsius: current.temperature_2m,
		code: current.weather_code,
		cloud: current.cloud_cover,
		fetchedAt: Date.now()
	};
}

let memory: Snapshot | null = null;
let inflight: Promise<DurbanWeather> | null = null;

export async function getDurbanWeather(): Promise<DurbanWeather> {
	const now = Date.now();
	if (memory && memory.expiresAt > now) return memory;
	const cached = readCache();
	if (cached && cached.expiresAt > now) {
		memory = cached;
		return cached;
	}
	if (inflight) return inflight;
	inflight = pull()
		.then((weather) => {
			memory = writeCache(weather);
			return weather;
		})
		.finally(() => {
			inflight = null;
		});
	if (cached) {
		inflight.catch(() => {});
		return cached;
	}
	return inflight;
}

export function nextWeatherRefreshMs(): number {
	const snap = memory ?? readCache();
	if (!snap) return 0;
	return Math.max(0, snap.expiresAt - Date.now());
}
