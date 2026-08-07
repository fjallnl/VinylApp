"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Disc3, Search } from "lucide-react";
import CollectionGrid from "@/components/CollectionGrid";

type CollectionRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverImage: string | null;
  rating: number | null;
};

export default function CollectionSearch({ initialRecords }: { initialRecords: CollectionRecord[] }) {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState(initialRecords);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const term = search.trim();

    if (!term) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = (await res.json()) as CollectionRecord[];
        setRecords(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, initialRecords]);

  return (
    <>
      <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5 mb-6">
        {(search.trim() ? records : initialRecords).length} record{(search.trim() ? records : initialRecords).length !== 1 ? "s" : ""}
      </p>

      <div className="mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              if (!value.trim()) setIsLoading(false);
            }}
            placeholder="Search artist, title, label…"
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-subtle rounded-lg text-sm focus:outline-none focus:border-accent placeholder:text-faint"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-dim text-sm">Searching…</div>
      ) : (search.trim() ? records : initialRecords).length === 0 ? (
        <div className="text-center py-20 text-dim">
          <Disc3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">{search.trim() ? "No vinyls found" : "No records yet"}</p>
          {!search.trim() && (
            <Link href="/add" className="mt-4 inline-block text-accent text-sm hover:underline">
              Add your first record
            </Link>
          )}
        </div>
      ) : (
        <CollectionGrid records={search.trim() ? records : initialRecords} />
      )}
    </>
  );
}
