"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/records/${id}`, { method: "DELETE" });
    router.push("/collection");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-400 shrink-0">Delete?</span>
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 px-4 max-[455px]:px-3 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      <Trash2 size={14} />
      Delete
    </button>
  );
}
