# Google Login (Backend-driven OAuth)

This frontend does **not** use Google Identity Services, the Google JS SDK, or any client-side Google OAuth libraries.

Instead, login is initiated by redirecting the browser to the backend (Spring Security) endpoint:

- `http://localhost:8080/oauth2/authorization/google`

The backend performs the entire OAuth flow with Google and then redirects back to the frontend with whatever authentication mechanism your backend uses (typically an HttpOnly session cookie or a backend-issued JWT).

## Key properties of this approach

- The frontend **does not generate or send Google ID tokens**.
- The frontend **does not store Google tokens** in `localStorage` / `sessionStorage`.
- CORS configuration is a **backend** responsibility.

## Troubleshooting

- If clicking "Login with Google" doesn’t navigate, ensure your backend is running on `http://localhost:8080`.
- If the backend redirects back but the frontend still appears logged out, confirm your backend sets a session cookie or returns a backend token that the existing frontend auth system can use.
