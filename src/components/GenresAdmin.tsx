"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

export default function GenresAdmin({ genres }: { genres: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function apiCall(url: string, init: RequestInit) {
    setError(null);
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Something went wrong");
      return false;
    }
    router.refresh();
    return true;
  }

  async function createGenre() {
    if (!name.trim()) return;
    await apiCall("/api/genres", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
    setName("");
  }

  async function deleteGenre(id: string) {
    setBusyId(id);
    await apiCall(`/api/genres/${id}`, { method: "DELETE" });
    setBusyId(null);
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Genres</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mt-0.5">{genres.length} genre{genres.length !== 1 ? "s" : ""}</p>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-rose-900/20 rounded-lg text-sm text-rose-200">{error}</div>}

      <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 md:p-5 mb-8">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New genre" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm" />
          <button onClick={createGenre} className="bg-amber-400 px-3 py-2 rounded-lg text-zinc-950 font-bold">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {genres.map((g) => (
          <div key={g.id} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="text-sm font-medium">{g.name}</div>
            <div>
              <button onClick={() => deleteGenre(g.id)} disabled={busyId === g.id} className="text-zinc-400 hover:text-red-400">
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
