<script lang="ts">
	import { onMount } from 'svelte';
	import { tonalPasses } from '#lib/ascii-bands.ts';
	import type { CartCover } from '#lib/cart-covers.ts';

	let { cover }: { cover: CartCover } = $props();
	let host: HTMLDivElement | undefined;
	let canvas: HTMLCanvasElement | undefined;

	const paint = () => {
		if (!host || !canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const cssW = host.clientWidth;
		const cssH = host.clientHeight;
		if (cssW < 2 || cssH < 2) return;
		const w = Math.round(cssW * dpr);
		const h = Math.round(cssH * dpr);
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		const scaleX = w / cover.cols;
		const scaleY = h / cover.rows;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, w, h);
		ctx.font = `${Math.max(6, scaleY * 0.92)}px ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let i = 0; i < cover.luma.length; i++) {
			const luma = cover.luma[i] / 255;
			const pin = cover.pins[i] === 1;
			if (luma < 0.08 && !pin) continue;
			const c = i % cover.cols;
			const r = (i / cover.cols) | 0;
			for (const pass of tonalPasses(luma, cover.colors)) {
				ctx.fillStyle = `rgb(${pass.rgb[0]},${pass.rgb[1]},${pass.rgb[2]})`;
				ctx.fillText(pass.ch, (c + 0.5 + pass.dx) * scaleX, (r + 0.5 + pass.dy) * scaleY);
			}
			if (pin && cover.mark) {
				ctx.fillStyle = `rgb(${cover.mark[0]},${cover.mark[1]},${cover.mark[2]})`;
				ctx.fillText('*', (c + 0.5) * scaleX, (r + 0.5) * scaleY);
			}
		}
	};

	$effect(() => {
		cover;
		paint();
	});

	onMount(() => {
		const observer = new ResizeObserver(() => paint());
		if (host) observer.observe(host);
		paint();
		return () => observer.disconnect();
	});
</script>

<div class="host" bind:this={host}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.host {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	canvas {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
