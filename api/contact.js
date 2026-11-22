import nodemailer from 'nodemailer';

const MAX_BODY_BYTES = 8192;
const RECIPIENT = 'hello@vedalken.dev';

function respond(res, status, message) {
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.setHeader('Cache-Control', 'no-store');
	res.statusCode = status;
	res.end(JSON.stringify({ message }));
}

async function readBody(req) {
	if (req.body !== undefined) {
		const serialized = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
		if (Buffer.byteLength(serialized) > MAX_BODY_BYTES) throw new Error('too large');
		return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
	}
	let raw = '';
	for await (const chunk of req) {
		raw += chunk;
		if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new Error('too large');
	}
	return JSON.parse(raw);
}

export function createContactHandler({ env = process.env, makeTransport = nodemailer.createTransport } = {}) {
	return async (req, res) => {
		if (req.method !== 'POST') {
			res.setHeader('Allow', 'POST');
			return respond(res, 405, 'Method not allowed.');
		}
		if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
			return respond(res, 415, 'Expected JSON.');
		}
		let body;
		try { body = await readBody(req); } catch { return respond(res, 400, 'Invalid request.'); }
		if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(res, 400, 'Invalid request.');
		if (body.website) return respond(res, 200, 'Message accepted.');
		const { name, email, message } = body;
		if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') return respond(res, 400, 'Please check your details.');
		const cleanName = name.trim();
		const cleanEmail = email.trim();
		const cleanMessage = message.trim();
		if (!cleanName || cleanName.length > 80 || /[\r\n]/.test(cleanName) || cleanEmail.length > 120 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cleanEmail) || !cleanMessage || cleanMessage.length > 2000) {
			return respond(res, 400, 'Please check your details.');
		}
		// Enable only after SMTP credentials and the Vercel firewall rule are configured.
		if (env.CONTACT_FORM_ENABLED !== 'true' || !env.CONTACT_SMTP_PASSWORD) return respond(res, 503, 'Contact form is unavailable.');
		const transport = makeTransport({
			host: 'smtpout.secureserver.net', port: 465, secure: true,
			auth: { user: RECIPIENT, pass: env.CONTACT_SMTP_PASSWORD },
			connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000
		});
		try {
			await transport.sendMail({ from: RECIPIENT, to: RECIPIENT, replyTo: cleanEmail,
				subject: `Portfolio contact: ${cleanName}`,
				text: `From: ${cleanName}\nEmail: ${cleanEmail}\n\n${cleanMessage}` });
			return respond(res, 200, 'Message accepted.');
		} catch {
			return respond(res, 502, 'Message could not be sent.');
		} finally { transport.close(); }
	};
}

export default createContactHandler();
