<script lang="ts">
	import { onMount } from 'svelte';

	const items = [
		{ label: 'Home', href: '/' },
		{ label: 'About', href: '/#about' },
		{ label: 'Projects', href: '/#work' },
		{ label: 'Contact', href: '/#contact' }
	];

	// Easter eggs later: append hidden/unlockable rows to `items`,
	// or add a second list under the divider below. Do not implement them now.

	let menu: HTMLDialogElement | undefined = $state();
	let selected = $state(0);
	let shortcut = $state('Ctrl+K');

	onMount(() => {
		const mac = /Mac|Macintosh/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent);
		if (mac) shortcut = '⌘K';
	});

	function typingInField(target: EventTarget | null) {
		if (!(target instanceof HTMLElement)) return false;
		if (target.isContentEditable) return true;
		const tag = target.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
	}

	function open() {
		selected = 0;
		menu?.showModal();
	}

	function close() {
		menu?.close();
	}

	function onGlobalKey(event: KeyboardEvent) {
		if (event.repeat) return;
		if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
		if (event.code !== 'KeyK') return;
		if (typingInField(event.target)) return;
		event.preventDefault();
		if (menu?.open) close();
		else open();
	}

	function onMenuKey(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selected = (selected + 1) % items.length;
			focusSelected(event.currentTarget);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selected = (selected - 1 + items.length) % items.length;
			focusSelected(event.currentTarget);
		}
	}

	function focusSelected(root: EventTarget | null) {
		if (!(root instanceof HTMLElement)) return;
		const links = root.querySelectorAll('a');
		links[selected]?.focus();
	}

	function onBackdrop(event: MouseEvent) {
		if (event.target === menu) close();
	}
</script>

<svelte:window onkeydown={onGlobalKey} />

<button
	type="button"
	class="shortcut"
	aria-haspopup="dialog"
	aria-controls="game-menu"
	onclick={open}
>
	{shortcut}
</button>

<dialog
	bind:this={menu}
	id="game-menu"
	class="menu"
	aria-labelledby="game-menu-title"
	onkeydown={onMenuKey}
	onclick={onBackdrop}
>
	<p id="game-menu-title" class="title">:: index ::</p>
	<nav aria-label="Game menu">
		{#each items as item, i}
			<a
				href={item.href}
				class:on={i === selected}
				onmouseenter={() => (selected = i)}
				onclick={close}
			>
				<span class="cursor" aria-hidden="true">{i === selected ? '>' : ' '}</span>
				{item.label}
			</a>
		{/each}
		<!-- Easter eggs slot: extra <a> rows go here later. -->
	</nav>
	<p class="hint">esc / click out</p>
</dialog>

<style>
	.menu {
		width: min(22rem, calc(100vw - 2rem));
		margin: auto;
		padding: 1.25rem 1.4rem 1rem;
		border: 1px solid var(--cream);
		background: var(--ground);
		color: var(--cream);
		font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
		box-shadow:
			2px 0 var(--coral),
			-2px 0 var(--teal);
	}

	.menu::backdrop {
		background: color-mix(in srgb, var(--ground) 82%, transparent);
	}

	.title {
		margin: 0 0 1rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		font-size: 0.8rem;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	a {
		display: block;
		padding: 0.2rem 0;
		color: inherit;
		text-decoration: none;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	a:hover,
	a:focus-visible,
	a.on {
		outline: none;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.cursor {
		display: inline-block;
		width: 1.25em;
		white-space: pre;
	}

	.hint {
		margin: 1rem 0 0;
		opacity: 0.5;
		font-size: 0.75rem;
	}

	.shortcut {
		position: fixed;
		left: 1rem;
		bottom: 1rem;
		z-index: 8;
		margin: 0;
		padding: 0.2rem 0.15rem;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		opacity: 0.45;
	}

	.shortcut:hover,
	.shortcut:focus-visible {
		opacity: 0.95;
		outline: none;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}
</style>
