import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authApi } from "@/lib/api";

// Use same-origin by default (works behind reverse proxies, avoids CORS/cookie issues).
// If VITE_API_BASE_URL is set (e.g., http://localhost:8080/api), derive backend origin from it.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const BACKEND_ORIGIN = API_BASE_URL
  ? API_BASE_URL.replace(/\/*api\/?$/, "")
  : (import.meta.env.DEV ? "http://localhost:8080" : "");

function GoogleGIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" {...props}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.04 0 5.77 1.05 7.92 2.78l5.9-5.9C34.2 3.08 29.32 1 24 1 14.62 1 6.53 6.38 2.65 14.19l6.88 5.33C11.26 13.62 17.13 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.57-.14-3.08-.4-4.54H24v9.09h12.63c-.54 2.9-2.17 5.36-4.62 7.02l7.06 5.47C43.4 37.6 46.5 31.6 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M9.53 28.52A14.7 14.7 0 0 1 8.75 24c0-1.58.27-3.1.78-4.52l-6.88-5.33A23.93 23.93 0 0 0 1.5 24c0 3.86.92 7.5 2.55 10.71l7-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 46.5c5.32 0 10.2-1.76 13.6-4.76l-7.06-5.47c-1.96 1.32-4.47 2.1-6.54 2.1-6.87 0-12.74-4.12-14.47-10.02l-7 6.19C6.47 41.62 14.62 46.5 24 46.5z"
      />
      <path fill="none" d="M1.5 1h45v45h-45z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = (searchParams.get('error') || '').toLowerCase();
    if (error === 'banned') {
      setBlockedMessage('Your account has been banned. Please contact support.');
    } else if (error) {
      setBlockedMessage('Login failed. Please try again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    let cancelled = false;

    // If we're not authenticated, probe auth/status to see if backend is denying login
    // (e.g., banned user session that shouldn't be treated as logged-in).
    const run = async () => {
      if (authLoading || isAuthenticated) return;
      try {
        const s = await authApi.status();
        if (cancelled) return;
        const msg = typeof s?.message === "string" ? s.message.trim() : "";
        setBlockedMessage(msg || null);
      } catch {
        if (!cancelled) setBlockedMessage(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const handleLogin = () => {
    // Backend-owned login flow.
    // In production, Brave/private can block cross-site cookies.
    // Start OAuth2 on the SAME origin as the SPA so Vercel rewrites can proxy it.
    const origin = import.meta.env.DEV ? (BACKEND_ORIGIN || window.location.origin) : window.location.origin;
    window.location.href = `${origin}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {blockedMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Login blocked</AlertTitle>
            <AlertDescription>{blockedMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="gradient-mesh-card">
          <CardContent className="pt-6 flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold text-center">Login</h1>

            <button
              type="button"
              onClick={handleLogin}
              className={[
                "w-full",
                "h-14",
                "rounded-full",
                "bg-white",
                "text-black",
                "border",
                "border-border/60",
                "shadow-sm",
                "hover:shadow-md",
                "transition-shadow",
                "relative",
                "flex",
                "items-center",
                "justify-center",
                "font-medium",
              ].join(" ")}
            >
              <span className="absolute left-4 flex items-center justify-center">
                <GoogleGIcon className="h-5 w-5" />
              </span>
              <span>Continue with Google</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
