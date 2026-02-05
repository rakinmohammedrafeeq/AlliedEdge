# Vercel: proxy `/api` to backend (same-site cookies)

When the frontend (Vercel) and backend (Render) are on different sites, some browsers (notably Brave Private/Incognito) block or partition **third‑party cookies**.

This app uses **Spring Security session auth** (`JSESSIONID` cookie). The most reliable fix is to make the browser treat API calls as **same-site** by proxying the backend through the frontend origin.

## 1) Update `frontend/vercel.json`

Add a rewrite for `/api/*` first, then the SPA catch-all.

Example (replace the backend URL):

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://alliededge-backend.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

## 2) Frontend env

On Vercel, set:

- `VITE_API_BASE_URL=/api`

So the SPA calls the same origin and the rewrite forwards it.

## 3) Backend CORS

If the SPA calls `/api` on the same origin, CORS becomes much less relevant.
However, keep your backend CORS origin list correct anyway.

## 4) Verify

In Brave Private/Incognito:

- Open DevTools → Network → a request to `/api/auth/status`
- Confirm request is same-origin to your Vercel domain
- Confirm the `Cookie: JSESSIONID=...` is sent

If it still fails, check Vercel rewrite destination and that the backend is reachable.
