# Contact form delivery

The contact form can send directly to `hello@vedalken.dev` through the Vercel function at `/api/contact` and the existing GoDaddy mailbox. With the flags unset, the website retains its existing mail-app flow and the function cannot send mail.

## Configuration

Set these values in the intended Vercel environment, not in the repository:

- `CONTACT_SMTP_PASSWORD`: the mailbox's SMTP password, stored as a sensitive server-side environment variable. This may grant broader access to the mailbox than sending alone. Never use a `VITE_` prefix for this value.
- `CONTACT_FORM_ENABLED=true`: enables server-side delivery once the firewall and credential are configured.
- `VITE_CONTACT_DIRECT_SEND=true`: enables direct sending in the browser. This is a public **build-time** flag, so redeploy after changing it.

The sender and recipient are fixed to the existing mailbox; the visitor's email is used as the reply-to address. Delivery succeeds only when the SMTP server accepts the message. The form retains the visitor's input on failure and offers the email address as a fallback.

Before enabling the endpoint, apply a Vercel firewall rate-limit rule for `/api/contact`; a draft for 5 requests per IP per 10 minutes was prepared in the project dashboard but has not been published. The hidden honeypot is an additional spam deterrent, not a replacement for rate limiting. Review usage limits and the rule's effect on visitors sharing an IP.

Configure and test in an isolated preview environment before enabling production. Use a test message only with explicit authorization, verify it arrives in the mailbox and that replying targets the visitor's address, and verify the error path. The Vercel function and SMTP delivery cannot be verified by the ordinary Vite development server alone.

## Checks

- `npm run test:contact` exercises validation, disabled configuration, delivery options, spam trap, and failure reporting with a mocked transport.
- `npm run check` and `npm run build` check and build the site.
- A Vercel build is needed to verify that `/api/contact` is packaged as a function. Local tests do not prove actual email delivery.
