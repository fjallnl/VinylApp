"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Disc3, Trash2, CheckSquare } from "lucide-react";
import { coverUrl } from "@/lib/s3";

type CollectionViewMode = "grid" | "grid-large" | "grid-small" | "list";

interface CollectionRecord {
  id: string;
  title: string;
  artist: string;
  year?: number | null;
  label?: string | null;
  country?: string | null;
  genre?: string[];
  tracks?: { position?: string | null }[];
  coverImage?: string | null;
}

function getVinylCountFromTracks(tracks?: { position?: string | null }[]) {
  if (!tracks?.length) return 1;

  const uniqueSides = new Set(
    tracks
      .map((track) => track.position?.trim().charAt(0).toUpperCase())
      .filter((side): side is string => Boolean(side && /[A-Z]/.test(side)))
  );

  if (uniqueSides.size === 0) return 1;

  return Math.max(1, Math.ceil(uniqueSides.size / 2));
}

export default function CollectionGrid({
  records,
  viewMode = "grid",
}: {
  records: CollectionRecord[];
  viewMode?: CollectionViewMode;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCollectionUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const getRecordHref = (id: string) =>
    `/record/${id}?returnTo=${encodeURIComponent(currentCollectionUrl)}`;

  const gridClassByMode: Record<CollectionViewMode, string> = {
    grid: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    "grid-large": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    "grid-small": "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
    list: "grid-cols-1",
  };

  const coverClassByMode: Record<Exclude<CollectionViewMode, "list">, string> = {
    grid: "aspect-square",
    "grid-large": "aspect-square",
    "grid-small": "aspect-[1/1]",
  };

  const titleClassByMode: Record<Exclude<CollectionViewMode, "list">, string> = {
    grid: "text-sm",
    "grid-large": "text-base",
    "grid-small": "text-xs",
  };

  const metaClassByMode: Record<Exclude<CollectionViewMode, "list">, string> = {
    grid: "text-[11px]",
    "grid-large": "text-xs",
    "grid-small": "text-[10px]",
  };

  const enterSelect = () => setSelectMode(true);

  const exitSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === records.length
        ? new Set()
        : new Set(records.map((r) => r.id))
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} record(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/records/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch {
      alert("Error deleting records");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Toolbar */}
      {selectMode ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="text-[11px] font-bold text-accent hover:text-accent-hover uppercase tracking-widest transition-colors"
            >
              {selectedIds.size === records.length ? "Deselect All" : "Select All"}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-[11px] font-semibold text-dim uppercase tracking-wider">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
              >
                <Trash2 size={13} />
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <button
              onClick={exitSelect}
              className="text-[11px] font-semibold text-muted hover:text-content uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-end">
          <button
            onClick={enterSelect}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-content uppercase tracking-widest transition-colors"
          >
            <CheckSquare size={14} />
            Select
          </button>
        </div>
      )}

      {/* Grid / list */}
      <div className={`grid gap-4 ${gridClassByMode[viewMode]}`}>
        {records.map((record) => {
          const selected = selectedIds.has(record.id);

          if (viewMode === "list") {
            const row = (
              <div
                className={`relative overflow-hidden rounded-lg border border-subtle bg-card p-3 transition-colors ${
                  selected ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                    {record.coverImage ? (
                      <Image
                        src={coverUrl(record.coverImage)}
                        alt={record.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Disc3 size={24} className="text-faint" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2">
                      <p className="truncate text-sm font-semibold tracking-wide">{record.title}</p>
                      <p className="truncate text-[11px] uppercase tracking-wider text-dim">{record.artist}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-faint sm:grid-cols-4">
                      <p>
                        <span className="text-dim">Year:</span> {record.year ?? "-"}
                      </p>
                      <p>
                        <span className="text-dim">Label:</span> {record.label ?? "-"}
                      </p>
                      <p>
                        <span className="text-dim">Country:</span> {record.country ?? "-"}
                      </p>
                      <p>
                        <span className="text-dim">Genre:</span> {record.genre?.join(", ") || "-"}
                      </p>
                      <p>
                        <span className="text-dim">Vinyls:</span> {getVinylCountFromTracks(record.tracks)}
                      </p>
                    </div>
                  </div>

                  {selectMode && (
                    <div className="ml-2 shrink-0">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                          selected
                            ? "border-accent bg-accent"
                            : "border-white/70 bg-black/40 backdrop-blur-sm"
                        }`}
                      >
                        {selected && (
                          <svg viewBox="0 0 10 8" className="h-3 w-3 fill-accent-fg">
                            <path
                              d="M1 4l2.5 2.5L9 1"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <div key={record.id} className="relative group">
                {selectMode ? (
                  <button className="block w-full text-left" onClick={() => toggleSelect(record.id)}>
                    {row}
                  </button>
                ) : (
                  <Link href={getRecordHref(record.id)} className="block">
                    {row}
                  </Link>
                )}
              </div>
            );
          }

          const cover = (
            <div
              className={`${coverClassByMode[viewMode]} bg-card rounded-lg overflow-hidden mb-2 relative transition-all duration-150 ${
                selected ? "ring-2 ring-accent" : ""
              }`}
            >
              {record.coverImage ? (
                <Image
                  src={coverUrl(record.coverImage)}
                  alt={record.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 size={40} className="text-faint" />
                </div>
              )}

              {/* Checkbox — only visible in select mode */}
              {selectMode && (
                <div className="absolute top-2 left-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected
                        ? "bg-accent border-accent"
                        : "bg-black/40 border-white/70 backdrop-blur-sm"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 10 8" className="w-3 h-3 fill-accent-fg">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
          );

          const meta = (
            <>
              <p className={`${titleClassByMode[viewMode]} font-semibold leading-tight truncate tracking-wide`}>
                {record.title}
              </p>
              <p className={`${metaClassByMode[viewMode]} text-dim uppercase tracking-wider truncate`}>
                {record.artist}
              </p>
              {record.year && <p className={`${metaClassByMode[viewMode]} text-faint font-light`}>{record.year}</p>}
            </>
          );

          return (
            <div key={record.id} className="relative group">
              {selectMode ? (
                <button
                  className="block w-full text-left"
                  onClick={() => toggleSelect(record.id)}
                >
                  {cover}
                  {meta}
                </button>
              ) : (
                <Link href={getRecordHref(record.id)} className="block">
                  {cover}
                  {meta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
