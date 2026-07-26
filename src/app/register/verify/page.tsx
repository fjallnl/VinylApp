"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Loader2 } from "lucide-react";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const missingToken = !token;
  const [state, setState] = useState<VerificationState>(missingToken ? "error" : "loading");
  const [message, setMessage] = useState(missingToken ? "This verification link is invalid." : "Verifying your email...");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (cancelled) return;

      if (res.ok) {
        setState("success");
        setMessage("Email verified. You can sign in now.");
        return;
      }

      const body = await res.json().catch(() => null);
      setState("error");
      setMessage(typeof body?.error === "string" ? body.error : "This verification link is invalid or expired.");
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <Disc3 size={36} className="text-amber-400" />
          <h1 className="text-xl font-bold uppercase tracking-widest">Verify Email</h1>
        </div>

        <div
          className={
            state === "success"
              ? "text-emerald-400 text-xs uppercase tracking-wide font-semibold"
              : state === "error"
                ? "text-red-400 text-xs uppercase tracking-wide font-semibold"
                : "text-zinc-400 text-xs uppercase tracking-wide font-semibold flex items-center justify-center gap-2"
          }
        >
          {state === "loading" && <Loader2 size={14} className="animate-spin" />}
          {message}
        </div>

        <Link
          href={state === "success" ? "/login?verified=1" : "/login"}
          className="w-full block text-center bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-amber-300 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
