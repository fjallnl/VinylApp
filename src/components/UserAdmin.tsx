"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Trash2, KeyRound, Shield, Disc3, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "ADMIN" | "USER";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  _count: { records: number; wantlist: number };
}

const createSchema = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().optional(),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["ADMIN", "USER"]),
});

type CreateForm = z.infer<typeof createSchema>;

const inputClass =
  "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-amber-400 placeholder:text-zinc-600";
const labelClass = "block text-xs uppercase tracking-widest text-zinc-500 mb-1.5";

export default function UserAdmin({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "USER" },
  });

  async function apiCall(url: string, init: RequestInit) {
    setError(null);
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = typeof body?.error === "string" ? body.error : "Something went wrong";
      setError(message);
      return false;
    }
    router.refresh();
    return true;
  }

  async function onCreate(data: CreateForm) {
    const ok = await apiCall("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ ...data, name: data.name || null }),
    });
    if (ok) reset({ role: "USER", email: "", name: "", password: "" });
  }

  async function changeRole(user: AdminUser, role: Role) {
    setBusyId(user.id);
    await apiCall(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
    setBusyId(null);
  }

  async function resetPassword(user: AdminUser) {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusyId(user.id);
    const ok = await apiCall(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ password: newPassword }),
    });
    setBusyId(null);
    if (ok) {
      setPasswordFor(null);
      setNewPassword("");
    }
  }

  async function deleteUser(user: AdminUser) {
    setBusyId(user.id);
    const ok = await apiCall(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setBusyId(null);
    if (ok) setDeletingId(null);
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest">Users</h2>
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mt-0.5">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Add user */}
      <form
        onSubmit={handleSubmit(onCreate)}
        className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 md:p-5 mb-8"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
          <UserPlus size={14} />
          Add User
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input {...register("email")} type="email" placeholder="user@example.com" className={inputClass} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Name</label>
            <input {...register("name")} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input {...register("password")} type="password" placeholder="Min. 6 characters" className={inputClass} />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select {...register("role")} className={inputClass}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex items-center gap-2 bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          Create User
        </button>
      </form>

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const busy = busyId === user.id;
          return (
            <div key={user.id} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{user.name || user.email}</p>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        user.role === "ADMIN" ? "bg-amber-400/10 text-amber-400" : "bg-zinc-700/50 text-zinc-400"
                      )}
                    >
                      {user.role === "ADMIN" && <Shield size={10} />}
                      {user.role}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-300">
                        You
                      </span>
                    )}
                  </div>
                  {user.name && <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Disc3 size={12} /> {user._count.records}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {user._count.wantlist}
                    </span>
                    <span>Joined {user.createdAt.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    disabled={busy}
                    onChange={(e) => changeRole(user, e.target.value as Role)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    onClick={() => {
                      setPasswordFor(passwordFor === user.id ? null : user.id);
                      setNewPassword("");
                    }}
                    disabled={busy}
                    title="Reset password"
                    className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    onClick={() => setDeletingId(deletingId === user.id ? null : user.id)}
                    disabled={busy || isSelf}
                    title={isSelf ? "You cannot delete your own account" : "Delete user"}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>

              {deletingId === user.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-zinc-400">
                    Delete {user.email} and their {user._count.records} record(s) and {user._count.wantlist}{" "}
                    wantlist item(s)? This cannot be undone.
                  </span>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={busy}
                    className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    disabled={busy}
                    className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    No
                  </button>
                </div>
              )}

              {passwordFor === user.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 6 characters)"
                    className={cn(inputClass, "max-w-xs")}
                  />
                  <button
                    onClick={() => resetPassword(user)}
                    disabled={busy}
                    className="bg-amber-400 text-zinc-950 font-bold px-3 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
