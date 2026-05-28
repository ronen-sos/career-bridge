"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

const ERROR_MESSAGES: Record<string, string> = {
  NotRegistered:
    "Your Google account is not registered with Career Bridge. Contact your program manager to get access.",
  AccessDenied:
    "Google blocked sign-in. Add steve@thriveinmn.com as a Test user in Google Cloud Console → OAuth consent screen, then try again in an incognito window.",
  DatabaseError:
    "Could not verify your account against the database. Check that DATABASE_URL is set and run npm run db:seed.",
  Configuration:
    "Auth is misconfigured. Check AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET in your .env file.",
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  OAuthCallback:
    "Google sign-in callback failed. Confirm http://localhost:3000/api/auth/callback/google is in Google Console redirect URIs.",
  CallbackRouteError:
    "Sign-in callback failed. Check the terminal for [auth] error logs.",
  Default: "Sign-in failed. Please try again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorCode = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const error = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default
    : null;

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="flex min-h-full bg-stone-50">
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-emerald-800 to-emerald-950 px-12 py-16 text-white lg:flex">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-200">
          Bridge to Thrive
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">Career Bridge</h1>
        <p className="mt-4 max-w-md text-lg text-emerald-100">
          Accountability and resources for your job search journey in St. Paul.
        </p>
      </div>

      <div className="flex min-h-full flex-1 flex-col">
        <header className="px-6 py-8 text-center lg:px-10 lg:py-10">
          <Link href="/" className="text-sm text-emerald-800">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-stone-900 lg:hidden">Sign in</h1>
          <p className="mt-2 text-stone-600 lg:mt-4 lg:text-lg">
            Sign in to Career Bridge
          </p>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-6 pb-12 lg:flex lg:max-w-lg lg:flex-col lg:justify-center lg:px-10 lg:pb-16">
          <Card>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in with your Google account. Only emails registered with the
              program can access Career Bridge.
            </CardDescription>

            <div className="mt-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p>{error}</p>
                  {errorCode && errorCode !== "AccessDenied" && (
                    <p className="mt-2 text-xs text-red-600">Error code: {errorCode}</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full gap-3"
              >
                <GoogleIcon />
                {loading ? "Redirecting…" : "Continue with Google"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
