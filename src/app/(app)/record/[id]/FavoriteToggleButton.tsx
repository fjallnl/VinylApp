"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function FavoriteToggleButton({
  recordId,
  initialFavorite,
}: {
  recordId: string;
  initialFavorite: boolean;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isSaving, setIsSaving] = useState(false);

  const toggleFavorite = async () => {
    const nextFavorite = !favorite;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFavorite }),
      });
      if (!res.ok) throw new Error("Failed");
      setFavorite(nextFavorite);
    } catch {
      alert("Error updating favorite");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isSaving}
      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/70 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
    >
      <Star size={13} className={favorite ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />
      {favorite ? "Unfavorite" : "Favorite"}
    </button>
  );
}
