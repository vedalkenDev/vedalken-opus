<script lang="ts">
	const directSend = import.meta.env.VITE_CONTACT_DIRECT_SEND === 'true';
	let errors = $state<Record<string, string>>({});
	function validate(input: HTMLInputElement | HTMLTextAreaElement) {
		const value = input.value.trim();
		errors[input.name] = !value ? 'Please fill in this field.' : input.type === 'email' && !input.validity.valid ? 'Please enter a valid email address.' : '';
	}
	let status = $state<'idle' | 'sending' | 'sent' | 'error' | 'mail-app'>('idle');

	async function send(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'sending') return;
		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) return;
		const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]'));
		fields.forEach(validate);
		if (fields.some((field) => errors[field.name])) { fields.find((field) => errors[field.name])?.focus(); return; }
		const data = new FormData(form);
		if (!directSend) {
			const name = String(data.get('name') ?? '').trim();
			const email = String(data.get('email') ?? '').trim();
			const message = String(data.get('message') ?? '').trim();
			const subject = encodeURIComponent(`Cosmic Archive — ${name}`);
			const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
			status = 'mail-app';
			window.location.href = `mailto:hello@vedalken.dev?subject=${subject}&body=${body}`;
			return;
		}
		status = 'sending';
		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ name: data.get('name'), email: data.get('email'), message: data.get('message'), website: data.get('website') })
			});
			if (!response.ok) throw new Error('Submission failed');
			form.reset();
			status = 'sent';
		} catch {
			status = 'error';
		}
	}
</script>

<section id="contact">
	<h2>Contact</h2>
	<form class="panel" onsubmit={send} novalidate>
		<p class="lede">A note for the archive.{directSend ? '' : ' It opens in your mail app.'}</p>
		<div class="pair">
			<label>
				<span>name</span>
				<input name="name" autocomplete="name" required maxlength="80" aria-invalid={!!errors.name} aria-describedby={errors.name ? "error-name" : undefined} oninput={(e) => { if (errors.name) validate(e.currentTarget); }} />
				{#if errors.name}<span id="error-name" class="field-error">{errors.name}</span>{/if}
			</label>
			<label>
				<span>email</span>
				<input name="email" type="email" autocomplete="email" required maxlength="120" aria-invalid={!!errors.email} aria-describedby={errors.email ? "error-email" : undefined} oninput={(e) => { if (errors.email) validate(e.currentTarget); }} />
				{#if errors.email}<span id="error-email" class="field-error">{errors.email}</span>{/if}
			</label>
		</div>
		<label>
			<span>message</span>
			<textarea name="message" rows="7" required maxlength="2000" aria-invalid={!!errors.message} aria-describedby={errors.message ? "error-message" : undefined} oninput={(e) => { if (errors.message) validate(e.currentTarget); }}></textarea>
			{#if errors.message}<span id="error-message" class="field-error">{errors.message}</span>{/if}
		</label>
		<div class="trap" aria-hidden="true">
			<label>Website <input name="website" tabindex="-1" autocomplete="off" /></label>
		</div>
		<div class="actions">
			<button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : '> send'}</button>
			<p class="status" role="status">{status === 'sent' ? 'Message sent. Thank you.' : status === 'error' ? 'Could not send. Please try again or email me directly.' : status === 'mail-app' ? 'Opening your mail app.' : ''}</p>
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
		border: 1px solid color-mix(in srgb, var(--cream) 48%, transparent);
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
	}

	input,
	textarea {
		min-height: 44px;
		width: 100%;
		box-sizing: border-box;
		margin: 0;
		padding: 0.45rem 0.5rem;
		border: 1px solid color-mix(in srgb, var(--cream) 55%, transparent);
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
		outline: 2px solid var(--cream);
		outline-offset: 1px;
	}

	.trap {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.actions {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.direct {
		margin-left: auto;
	}

	button {
		min-height: 44px;
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--cream);
		background: transparent;
		color: var(--cream);
		font: inherit;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	button:hover {
		text-shadow:
			1px 0 var(--coral),
			-1px 0 var(--teal);
	}

	button:focus-visible { outline: 2px solid var(--cream); outline-offset: 3px; }
	.field-error { color: #ffb3a5; font-size: .75rem; letter-spacing: 0; text-transform: none; }
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
