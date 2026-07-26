"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Disc3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPasswordRuleResults, isPasswordPolicyCompliant } from "@/lib/password-policy";

const schema = z
  .object({
    email: z.string().email("Valid email required"),
    name: z.string().optional(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!isPasswordPolicyCompliant({ password: data.password, email: data.email, name: data.name })) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Please use a stronger password",
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400";
const labelClass = "block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2";

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = useWatch({ control, name: "password" }) || "";
  const emailValue = useWatch({ control, name: "email" }) || "";
  const nameValue = useWatch({ control, name: "name" }) || "";
  const confirmPasswordValue = useWatch({ control, name: "confirmPassword" }) || "";
  const passwordRules = getPasswordRuleResults({
    password: passwordValue,
    email: emailValue,
    name: nameValue,
  });
  const showPasswordRules = passwordValue.length > 0;
  const showPasswordMatchRule = passwordValue.length > 0 || confirmPasswordValue.length > 0;
  const passwordsMatch = passwordValue.length > 0 && confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

  async function onSubmit(data: FormData) {
    setLoading(true);
    setServerError("");
    setServerMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, name: data.name || null, password: data.password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(typeof body?.error === "string" ? body.error : "Something went wrong");
      setLoading(false);
      return;
    }

    setLoading(false);
    setServerMessage("Check your email for a verification link before signing in.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <Disc3 size={36} className="text-amber-400" />
          <h1 className="text-xl font-bold uppercase tracking-widest">Vinyl Collection</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900 rounded-2xl p-6 space-y-5">
          <div>
            <label className={labelClass}>Email</label>
            <input {...register("email")} type="email" autoComplete="email" className={inputClass} />
            {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Name</label>
            <input {...register("name")} autoComplete="name" placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input {...register("password")} type="password" autoComplete="new-password" className={inputClass} />
            {showPasswordRules && (
              <ul className="mt-2.5 space-y-1">
                {passwordRules.map((rule) => (
                  <li
                    key={rule.id}
                    className={cn(
                      "text-xs transition-colors",
                      rule.passed ? "text-amber-400" : "text-zinc-500"
                    )}
                  >
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
            {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Confirm password</label>
            <input {...register("confirmPassword")} type="password" autoComplete="new-password" className={inputClass} />
            {showPasswordMatchRule && (
              <ul className="mt-2.5 space-y-1">
                <li className={cn("text-xs transition-colors", passwordsMatch ? "text-amber-400" : "text-zinc-500")}>
                  Passwords match
                </li>
              </ul>
            )}
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && <p className="text-red-400 text-xs uppercase tracking-wide font-semibold">{serverError}</p>}
          {serverMessage && <p className="text-emerald-400 text-xs uppercase tracking-wide font-semibold">{serverMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-zinc-500 mt-2">
          Need a new verification email?{" "}
          <Link href={`/login?email=${encodeURIComponent(getValues("email") || "")}`} className="text-amber-400 hover:underline">
            Resend it
          </Link>
        </p>
      </div>
    </div>
  );
}
