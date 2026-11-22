# Contact form delivery

The contact form can send directly to `hello@vedalken.dev` through the Vercel function at `/api/contact` and the existing GoDaddy mailbox. With the flags unset, the website retains its existing mail-app flow and the function cannot send mail.

## Configuration

Set these values in the intended Vercel environment, not in the repository:

- `CONTACT_SMTP_PASSWORD`: the mailbox's SMTP password, stored as a sensitive server-side environment variable. This may grant broader access to the mailbox than sending alone. Never use a `VITE_` prefix for this value.
- `CONTACT_FORM_ENABLED=true`: enables server-side delivery once the firewall and credential are configured.
- `VITE_CONTACT_DIRECT_SEND=true`: enables direct sending in the browser. This is a public **build-time** flag, so redeploy after changing it.

The sender and recipient are fixed to the existing mailbox; the visitor's email is used as the reply-to address. Delivery succeeds only when the SMTP server accepts the message. The form retains the visitor's input on failure and offers the email address as a fallback.

Before enabling the endpoint, apply a Vercel firewall rate-limit rule for `/api/contact`; a rule for 5 requests per IP per 10 minutes was published in the project dashboard on 22 November 2026. The hidden honeypot is an additional spam deterrent, not a replacement for rate limiting. Review usage limits and the rule's effect on visitors sharing an IP.

Configure and test in an isolated preview environment before enabling production. Use a test message only with explicit authorization, verify it arrives in the mailbox and that replying targets the visitor's address, and verify the error path. The Vercel function and SMTP delivery cannot be verified by the ordinary Vite development server alone.

## Checks

- `npm run test:contact` exercises validation, disabled configuration, delivery options, spam trap, and failure reporting with a mocked transport.
- `npm run check` and `npm run build` check and build the site.
- A Vercel build is needed to verify that `/api/contact` is packaged as a function. Local tests do not prove actual email delivery.

## End-to-end delivery test

Run this against the Vercel preview deployment with the preview environment configured and the contact firewall rule published. Do not use real client information.

1. Open the preview on a desktop browser. In Contact, enter `Delivery test` for the name, an email address you control for the email, and a short identifiable message such as `Preview contact test — please ignore`.
2. Submit the form. Confirm the button shows a sending state, then `Message sent. Thank you.` without opening a mail application. The form should clear only after the success message.
3. Open the `hello@vedalken.dev` inbox. Check Inbox and Spam for a message with subject `Portfolio contact: Delivery test`. Confirm the name, address and message are intact. A success response means the SMTP server accepted the message, not that inbox delivery is guaranteed.
4. Open Reply and confirm the recipient is the address entered in step 1. Do not send the reply unless you intend to send an email.
5. On a phone, repeat once with a different test message. Check the layout, keyboard and success message. If testing repeatedly from one network, the rate limit may return an error after five requests in ten minutes.
6. Test required-field and malformed-email validation. For the delivery-failure path, temporarily disable server-side delivery **only in the preview environment** and redeploy the preview; confirm the form reports an error and retains the entered message. Restore the preview setting afterwards. Do not modify production settings for this test.
7. Once preview delivery and reply-to are verified, configure production separately, publish the rate-limit rule if still staged, deploy the approved code, and repeat a single production test.

If the test fails, leave direct sending disabled for that environment. Check the Vercel function logs for operational errors without logging form contents or credentials, confirm the server-side secret and flags, and check the mailbox's Spam folder. With `VITE_CONTACT_DIRECT_SEND` unset or `false`, a new build returns the site to its existing mail-app flow.
