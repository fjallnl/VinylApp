"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export default function AddWantlistPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "", year: "", label: "", notes: "" });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/wantlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, year: form.year ? Number(form.year) : null }),
    });
    router.push("/wantlist");
    router.refresh();
  }

  const inputCls = "w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-dim";

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/wantlist" className="text-muted hover:text-content">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Add to Wantlist</h1>
        </div>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Title *</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Artist *</label>
          <input value={form.artist} onChange={(e) => update("artist", e.target.value)} required className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Year</label>
            <input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Label</label>
            <input value={form.label} onChange={(e) => update("label", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-accent-fg font-semibold py-3 rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Add to Wantlist
        </button>
      </form>
    </div>
  );
}
