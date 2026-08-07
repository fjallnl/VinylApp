"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Disc3, Search, SlidersHorizontal } from "lucide-react";
import CollectionGrid from "@/components/CollectionGrid";

type CollectionRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  label: string | null;
  genre: string[];
  country: string | null;
  coverImage: string | null;
  rating: number | null;
};

type Filters = {
  artist: string;
  title: string;
  year: string;
  label: string;
  genre: string;
  country: string;
};

const EMPTY_FILTERS: Filters = {
  artist: "",
  title: "",
  year: "",
  label: "",
  genre: "",
  country: "",
};

const inputClass =
  "w-full rounded-lg border border-subtle bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none placeholder:text-faint";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-dim";

export default function CollectionSearch({ initialRecords }: { initialRecords: CollectionRecord[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(initialRecords.flatMap((record) => (record.year ? [String(record.year)] : [])))).sort(
        (a, b) => Number(b) - Number(a)
      ),
    [initialRecords]
  );

  const genreOptions = useMemo(
    () =>
      Array.from(
        new Set(
          initialRecords.flatMap((record) =>
            record.genre.map((genre) => genre.trim()).filter(Boolean)
          )
        )
      ).sort((a, b) => a.localeCompare(b)),
    [initialRecords]
  );

  const countryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          initialRecords.flatMap((record) => (record.country?.trim() ? [record.country.trim()] : []))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [initialRecords]
  );

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return initialRecords.filter((record) => {
      const matchesSearch =
        !term ||
        [
          record.artist,
          record.title,
          record.label ?? "",
          record.country ?? "",
          record.year ? String(record.year) : "",
          ...record.genre,
        ].some((value) => value.toLowerCase().includes(term));

      const matchesArtist =
        !filters.artist || record.artist.toLowerCase().includes(filters.artist.toLowerCase());
      const matchesTitle =
        !filters.title || record.title.toLowerCase().includes(filters.title.toLowerCase());
      const matchesYear = !filters.year || String(record.year ?? "") === filters.year;
      const matchesLabel =
        !filters.label || (record.label ?? "").toLowerCase().includes(filters.label.toLowerCase());
      const matchesGenre =
        !filters.genre ||
        record.genre.some((genre) => genre.toLowerCase() === filters.genre.toLowerCase());
      const matchesCountry =
        !filters.country || (record.country ?? "").toLowerCase() === filters.country.toLowerCase();

      return (
        matchesSearch &&
        matchesArtist &&
        matchesTitle &&
        matchesYear &&
        matchesLabel &&
        matchesGenre &&
        matchesCountry
      );
    });
  }, [filters, initialRecords, search]);

  const hasActiveFilters = search.trim().length > 0 || Object.values(filters).some(Boolean);

  return (
    <>
      <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5 mb-6">
        {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
      </p>

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artist, title, year, label, genre, country…"
              className={`${inputClass} pl-9 pr-4`}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            aria-expanded={showFilters}
            className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              showFilters
                ? "border-accent bg-accent/10 text-accent"
                : "border-subtle bg-surface text-dim hover:text-content"
            }`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {Object.values(filters).some(Boolean) && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label htmlFor="artist-filter" className={labelClass}>
              Artist
            </label>
            <input
              id="artist-filter"
              value={filters.artist}
              onChange={(e) => setFilters((current) => ({ ...current, artist: e.target.value }))}
              placeholder="Filter by artist"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="title-filter" className={labelClass}>
              Title
            </label>
            <input
              id="title-filter"
              value={filters.title}
              onChange={(e) => setFilters((current) => ({ ...current, title: e.target.value }))}
              placeholder="Filter by title"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="year-filter" className={labelClass}>
              Year
            </label>
            <select
              id="year-filter"
              value={filters.year}
              onChange={(e) => setFilters((current) => ({ ...current, year: e.target.value }))}
              className={inputClass}
            >
              <option value="">All years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="label-filter" className={labelClass}>
              Label
            </label>
            <input
              id="label-filter"
              value={filters.label}
              onChange={(e) => setFilters((current) => ({ ...current, label: e.target.value }))}
              placeholder="Filter by label"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="genre-filter" className={labelClass}>
              Genre
            </label>
            <select
              id="genre-filter"
              value={filters.genre}
              onChange={(e) => setFilters((current) => ({ ...current, genre: e.target.value }))}
              className={inputClass}
            >
              <option value="">All genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="country-filter" className={labelClass}>
              Country
            </label>
            <select
              id="country-filter"
              value={filters.country}
              onChange={(e) => setFilters((current) => ({ ...current, country: e.target.value }))}
              className={inputClass}
            >
              <option value="">All countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}

        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilters(EMPTY_FILTERS);
              }}
              className="text-[11px] font-semibold uppercase tracking-widest text-muted transition-colors hover:text-content"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-20 text-dim">
          <Disc3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">{hasActiveFilters ? "No records match your filters" : "No records yet"}</p>
          {!hasActiveFilters && (
            <Link href="/add" className="mt-4 inline-block text-accent text-sm hover:underline">
              Add your first record
            </Link>
          )}
        </div>
      ) : (
        <CollectionGrid records={filteredRecords} />
      )}
    </>
  );
}
