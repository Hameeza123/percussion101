Tawk secure visitor hash helper

1) Set environment variable `TAWK_SECRET` to your Tawk secret key.

2) Install and run locally:

```bash
npm install
TAWK_SECRET=your_secret_here npm start
```

3) Deploy to a secure HTTPS host (Heroku / Render / Vercel) and keep `TAWK_SECRET` private.

4) Client-side: call `/api/tawk-hash?id=<user@example.com>` after the user logs in,
   then set `window.Tawk_API.visitor = { name, email, hash }` before loading the Tawk widget.
