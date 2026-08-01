"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Loader2 } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(searchParams.get("verified") === "1" ? "Email verified. You can sign in now." : "");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error.includes("EmailNotVerified")) {
        setError("Please verify your email before signing in.");
      } else {
        setError("Invalid email or password");
      }
    } else {
      window.location.href = "/collection";
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    setResendLoading(true);
    setError("");
    setInfo("");

    const res = await fetch("/api/register/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setResendLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Unable to resend verification email");
      return;
    }

    setInfo("If the account exists and still needs verification, a new link was sent.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <Disc3 size={36} className="text-accent" />
          <h1 className="text-xl font-bold uppercase tracking-widest">Vinyl Collection</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-card border border-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-card border border-subtle rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-red-400 text-xs uppercase tracking-wide font-semibold">{error}</p>}
          {info && <p className="text-emerald-400 text-xs uppercase tracking-wide font-semibold">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-fg font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sign In
          </button>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="w-full bg-[var(--surface-strong)] border border-[var(--border)] text-[var(--muted)] font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:border-accent hover:text-accent disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {resendLoading && <Loader2 size={14} className="animate-spin" />}
            Resend Verification Email
          </button>
        </form>

        <p className="text-center text-xs text-dim mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
