"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Disc3, Trash2, CheckSquare } from "lucide-react";
import { coverUrl } from "@/lib/s3";

interface Record {
  id: string;
  title: string;
  artist: string;
  year?: number | null;
  coverImage?: string | null;
}

export default function CollectionGrid({ records }: { records: Record[] }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {records.map((record) => {
          const selected = selectedIds.has(record.id);
          const cover = (
            <div
              className={`aspect-square bg-card rounded-lg overflow-hidden mb-2 relative transition-all duration-150 ${
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
              <p className="text-sm font-semibold leading-tight truncate tracking-wide">{record.title}</p>
              <p className="text-[11px] text-dim uppercase tracking-wider truncate">{record.artist}</p>
              {record.year && <p className="text-[11px] text-faint font-light">{record.year}</p>}
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
                <Link href={`/record/${record.id}`} className="block">
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
