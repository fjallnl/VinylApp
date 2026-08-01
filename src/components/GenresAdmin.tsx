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
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest">Genres</h2>
        <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5">{genres.length} genre{genres.length !== 1 ? "s" : ""}</p>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-rose-900/20 rounded-lg text-sm text-rose-200">{error}</div>}

      <div className="bg-card/50 border border-card rounded-xl p-4 md:p-5 mb-8">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New genre" className="w-full px-3 py-2 bg-surface border border-subtle rounded-lg text-sm" />
          <button onClick={createGenre} className="bg-accent px-3 py-2 rounded-lg text-accent-fg font-bold">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {genres.map((g) => {
          const isTempId = g.id.startsWith("temp-");
          return (
            <div key={g.id} className="bg-card/50 border border-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{g.name}</div>
                {isTempId && <div className="text-xs text-dim mt-1">In use by records</div>}
              </div>
              <div>
                <button
                  onClick={() => deleteGenre(g.id)}
                  disabled={busyId === g.id || isTempId}
                  className={`${isTempId ? "text-faint cursor-not-allowed" : "text-muted hover:text-red-400"}`}
                  title={isTempId ? "Cannot delete genres in use by records" : "Delete genre"}
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
