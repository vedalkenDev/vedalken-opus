<script lang="ts">
	let sent = $state(false);

	function send(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;
		const data = new FormData(form);
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();
		const subject = encodeURIComponent(`Cosmic Archive — ${name}`);
		const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
		sent = true;
		window.location.href = `mailto:hello@vedalken.dev?subject=${subject}&body=${body}`;
	}
</script>

<section id="contact">
	<h1>Contact</h1>
	<form class="panel" onsubmit={send}>
		<p class="lede">A note for the archive. It opens in your mail app.</p>
		<div class="pair">
			<label>
				<span>name</span>
				<input name="name" autocomplete="name" required maxlength="80" />
			</label>
			<label>
				<span>email</span>
				<input name="email" type="email" autocomplete="email" required maxlength="120" />
			</label>
		</div>
		<label>
			<span>message</span>
			<textarea name="message" rows="7" required maxlength="2000"></textarea>
		</label>
		<div class="actions">
			<button type="submit">&gt; send</button>
			<p class="status">{sent ? 'Opening your mail app.' : ''}</p>
			<a class="direct" href="mailto:hello@vedalken.dev">hello@vedalken.dev</a>
		</div>
	</form>
</section>

<style>
	section {
		margin-top: 3rem;
		scroll-margin-top: 1.5rem;
	}

	.panel {
		box-sizing: border-box;
		width: 100%;
		margin-top: 0.4rem;
		padding: 1.25rem 1.35rem 1.15rem;
		border: 1px solid color-mix(in srgb, var(--cream) 28%, transparent);
		background: color-mix(in srgb, var(--cream) 4%, var(--ground));
		box-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	.lede,
	.status,
	.direct {
		margin: 0;
	}

	.lede {
		margin-bottom: 0.9rem;
		max-width: none;
		opacity: 0.72;
		font-size: 0.85rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
		margin: 0 0 0.75rem;
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		margin: 0;
		padding: 0.45rem 0.5rem;
		border: 1px solid color-mix(in srgb, var(--cream) 22%, transparent);
		border-radius: 0;
		background: var(--ground);
		color: var(--cream);
		font: inherit;
		font-size: 0.92rem;
		letter-spacing: 0;
		text-transform: none;
	}

	textarea {
		resize: vertical;
		min-height: 9.5rem;
	}

	input:focus-visible,
	textarea:focus-visible {
		outline: 1px solid var(--teal);
		outline-offset: 1px;
	}

	.actions {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
	}

	.direct {
		margin-left: auto;
	}

	button {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--cream);
		background: transparent;
		color: var(--cream);
		font: inherit;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}

	button:hover,
	button:focus-visible {
		outline: none;
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	.status {
		min-height: 1.2em;
		opacity: 0.6;
		font-size: 0.8rem;
	}

	@media (max-width: 540px) {
		.pair {
			grid-template-columns: 1fr;
		}

		.direct {
			margin-left: 0;
		}
	}
</style>
