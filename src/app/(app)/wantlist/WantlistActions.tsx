"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function WantlistActions({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    await fetch(`/api/wantlist/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-dim hover:text-red-400 transition-colors p-1"
    >
      <Trash2 size={16} />
    </button>
  );
}
