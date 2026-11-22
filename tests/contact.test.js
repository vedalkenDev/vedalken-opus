import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../api/contact.js';

const valid = { name: 'A Visitor', email: 'visitor@example.com', message: 'Hello there', website: '' };
function response() {
	return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(value) { this.body = JSON.parse(value); } };
}
function request(body = valid, method = 'POST') { return { method, headers: { 'content-type': 'application/json' }, body }; }

test('sends to the mailbox with the visitor as reply-to', async () => {
	let sent;
	const handler = createContactHandler({ env: { CONTACT_FORM_ENABLED: 'true', CONTACT_SMTP_PASSWORD: 'test-only' }, makeTransport: () => ({ sendMail: async (mail) => { sent = mail; }, close() {} }) });
	const res = response(); await handler(request(), res);
	assert.equal(res.statusCode, 200);
	assert.equal(sent.to, 'hello@vedalken.dev');
	assert.equal(sent.from, 'hello@vedalken.dev');
	assert.equal(sent.replyTo, valid.email);
	assert.match(sent.text, /Hello there/);
});

test('rejects malformed and injected fields before attempting delivery', async () => {
	let attempts = 0;
	const handler = createContactHandler({ env: { CONTACT_FORM_ENABLED: 'true', CONTACT_SMTP_PASSWORD: 'test-only' }, makeTransport: () => { attempts++; } });
	for (const body of [{ ...valid, name: 'A\nBcc: unwanted@example.com' }, { ...valid, email: 'not-an-email' }, { ...valid, message: 'x'.repeat(2001) }]) {
		const res = response(); await handler(request(body), res); assert.equal(res.statusCode, 400);
	}
	assert.equal(attempts, 0);
});

test('remains disabled until explicitly configured', async () => {
	const res = response(); await createContactHandler({ env: {} })(request(), res);
	assert.equal(res.statusCode, 503);
});

test('does not report SMTP failures as successful submissions', async () => {
	let closed = false;
	const handler = createContactHandler({ env: { CONTACT_FORM_ENABLED: 'true', CONTACT_SMTP_PASSWORD: 'test-only' }, makeTransport: () => ({ sendMail: async () => { throw new Error('private error'); }, close() { closed = true; } }) });
	const res = response(); await handler(request(), res);
	assert.equal(res.statusCode, 502);
	assert.doesNotMatch(JSON.stringify(res.body), /private error/);
	assert.equal(closed, true);
});

test('rejects unsupported methods and silently discards honeypot submissions', async () => {
	let attempts = 0;
	const handler = createContactHandler({ env: {}, makeTransport: () => { attempts++; } });
	let res = response(); await handler(request(valid, 'GET'), res); assert.equal(res.statusCode, 405);
	res = response(); await handler(request({ ...valid, website: 'https://spam.example' }), res); assert.equal(res.statusCode, 200);
	assert.equal(attempts, 0);
});
