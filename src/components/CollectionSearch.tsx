"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Disc3,
  Grid2x2,
  Grid3x3,
  LayoutGrid,
  List,
  type LucideIcon,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import CollectionGrid from "@/components/CollectionGrid";

type CollectionViewMode = "grid" | "grid-large" | "grid-small" | "list";

type CollectionRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  label: string | null;
  genre: string[];
  country: string | null;
  format: string | null;
  coverImage: string | null;
  rating: number | null;
  tracks: { position: string | null }[];
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

const VIEW_MODES: CollectionViewMode[] = ["grid", "grid-large", "grid-small", "list"];

function parseFilters(params: URLSearchParams): Filters {
  return {
    artist: params.get("artist") ?? "",
    title: params.get("title") ?? "",
    year: params.get("year") ?? "",
    label: params.get("label") ?? "",
    genre: params.get("genre") ?? "",
    country: params.get("country") ?? "",
  };
}

function parseViewMode(params: URLSearchParams): CollectionViewMode {
  const view = params.get("view");
  if (view && VIEW_MODES.includes(view as CollectionViewMode)) {
    return view as CollectionViewMode;
  }
  return "grid";
}

function buildQueryParams(search: string, filters: Filters, viewMode: CollectionViewMode): URLSearchParams {
  const params = new URLSearchParams();
  const normalizedSearch = search.trim();

  if (normalizedSearch) params.set("q", normalizedSearch);
  if (filters.artist.trim()) params.set("artist", filters.artist.trim());
  if (filters.title.trim()) params.set("title", filters.title.trim());
  if (filters.year) params.set("year", filters.year);
  if (filters.label.trim()) params.set("label", filters.label.trim());
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.country) params.set("country", filters.country);
  if (viewMode !== "grid") params.set("view", viewMode);

  return params;
}

export default function CollectionSearch({ initialRecords }: { initialRecords: CollectionRecord[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>(() => parseFilters(new URLSearchParams(searchParams.toString())));
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<CollectionViewMode>(() =>
    parseViewMode(new URLSearchParams(searchParams.toString()))
  );
  const [showViewMenu, setShowViewMenu] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = buildQueryParams(search, filters, viewMode);
    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [filters, pathname, router, search, searchParams, viewMode]);

  useEffect(() => {
    if (!showViewMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!viewMenuRef.current?.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showViewMenu]);

  const viewOptions: Array<{ mode: CollectionViewMode; label: string; icon: LucideIcon }> = [
    { mode: "grid", label: "Grid", icon: LayoutGrid },
    { mode: "grid-large", label: "Large Grid", icon: Grid2x2 },
    { mode: "grid-small", label: "Small Grid", icon: Grid3x3 },
    { mode: "list", label: "List", icon: List },
  ];

  const selectedViewOption = viewOptions.find((option) => option.mode === viewMode) ?? viewOptions[0];
  const SelectedViewIcon = selectedViewOption.icon;

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
          <div className="relative" ref={viewMenuRef}>
            <button
              type="button"
              aria-label="Views"
              aria-haspopup="menu"
              aria-expanded={showViewMenu}
              onClick={() => setShowViewMenu((v) => !v)}
              className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-lg border transition-colors ${
                showViewMenu
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-subtle bg-surface text-dim hover:text-content"
              }`}
            >
              <SelectedViewIcon size={16} />
            </button>
            {showViewMenu && (
              <div
                role="menu"
                aria-label="View options"
                className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-subtle bg-surface shadow-lg"
              >
                {viewOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const active = option.mode === viewMode;

                  return (
                    <button
                      key={option.mode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setViewMode(option.mode);
                        setShowViewMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-dim hover:bg-subtle hover:text-content"
                      }`}
                    >
                      <OptionIcon size={15} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            aria-expanded={showFilters}
            className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
              showFilters
                ? "border-accent bg-accent/10 text-accent"
                : "border-subtle bg-surface text-dim hover:text-content"
            }`}
          >
            <SlidersHorizontal size={15} />
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
        <CollectionGrid records={filteredRecords} viewMode={viewMode} />
      )}
    </>
  );
}
