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
      className="flex items-center gap-2 bg-card hover:bg-subtle disabled:bg-card/70 px-4 max-[455px]:px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
    >
      <Star size={13} className={favorite ? "fill-accent text-accent" : "text-secondary"} />
      {favorite ? "Unfavorite" : "Favorite"}
    </button>
  );
}
