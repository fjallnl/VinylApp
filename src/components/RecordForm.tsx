"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Camera, Barcode, Loader2, X, Star, Upload, Disc3 } from "lucide-react";
import { cn, CONDITIONS } from "@/lib/utils";
import BarcodeScanner from "./BarcodeScanner";
import Image from "next/image";
import { coverUrl } from "@/lib/s3";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  year: z.string().optional(),
  label: z.string().optional(),
  catalogNumber: z.string().optional(),
  country: z.string().optional(),
  format: z.string().optional(),
  genre: z.string().optional(),
  notes: z.string().optional(),
  discogsId: z.string().optional(),
  mediaCondition: z.string().optional(),
  sleeveCondition: z.string().optional(),
  purchasePrice: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Track { position: string; title: string; duration: string }

interface RecordData {
  id: string;
  title: string;
  artist: string;
  year?: number | null;
  label?: string | null;
  catalogNumber?: string | null;
  country?: string | null;
  format?: string | null;
  genre: string[];
  notes?: string | null;
  discogsId?: string | null;
  rating?: number | null;
  mediaCondition?: string | null;
  sleeveCondition?: string | null;
  purchasePrice?: number | null;
  coverImage?: string | null;
  tracks: { position: string | null; title: string; duration: string | null }[];
}

export default function RecordForm({ record }: { record?: RecordData }) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: number; title: string; year: string; thumb: string; catalogNumber?: string | null }[]>([]);
  const [tracks, setTracks] = useState<Track[]>(
    record?.tracks.map((t) => ({ position: t.position ?? "", title: t.title, duration: t.duration ?? "" })) ?? []
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    record?.coverImage ? coverUrl(record.coverImage) : null
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [discogsCoverUrl, setDiscogsCoverUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(record?.rating ?? 0);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [genreTags, setGenreTags] = useState<string[]>(record?.genre ?? []);
  const [genreInput, setGenreInput] = useState("");
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchSuggestions = async () => {
      const q = genreInput.trim();
      if (!q) { setGenreSuggestions([]); return; }
      const res = await fetch(`/api/genres?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => []);
      if (!mounted) return;
      const names = (data || []).map((g: any) => g.name).filter(Boolean).filter((n: string) => !genreTags.includes(n));
      setGenreSuggestions(names);
    };
    const t = setTimeout(fetchSuggestions, 200);
    return () => { mounted = false; clearTimeout(t); };
  }, [genreInput, genreTags]);

  function addTag(tag: string) {
    if (!tag) return;
    if (genreTags.includes(tag)) return;
    setGenreTags((prev) => [...prev, tag]);
  }

  function removeTag(tag: string) {
    setGenreTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleGenreKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = genreInput.trim().replace(/,$/, "");
      if (val) {
        addTag(val);
        setGenreInput("");
        setGenreSuggestions([]);
      }
    } else if (e.key === "Backspace" && !genreInput && genreTags.length > 0) {
      setGenreTags((prev) => prev.slice(0, -1));
    }
  }

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: record?.title ?? "",
      artist: record?.artist ?? "",
      year: record?.year?.toString() ?? "",
      label: record?.label ?? "",
      catalogNumber: record?.catalogNumber ?? "",
      country: record?.country ?? "",
      format: record?.format ?? "",
      genre: record?.genre?.join(", ") ?? "",
      notes: record?.notes ?? "",
      discogsId: record?.discogsId ?? "",
      mediaCondition: record?.mediaCondition ?? "",
      sleeveCondition: record?.sleeveCondition ?? "",
      purchasePrice: record?.purchasePrice?.toString() ?? "",
    },
  });

  useEffect(() => {
    // keep hidden form value in sync
    setValue("genre", genreTags.join(", "));
  }, [genreTags, setValue]);

  async function searchDiscogs(query: string) {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/discogs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function loadDiscogsRelease(id: number) {
    setSearching(true);
    try {
      const res = await fetch(`/api/discogs/release/${id}`);
      const data = await res.json();
      setValue("title", data.title ?? "");
      setValue("artist", data.artist ?? "");
      setValue("year", data.year ? String(data.year) : "");
      setValue("label", data.label ?? "");
      setValue("catalogNumber", data.catalogNumber ?? "");
      setValue("country", data.country ?? "");
      setValue("format", data.format ?? "");
      setValue("genre", data.genre ?? "");
      setValue("discogsId", String(id));
      if (data.tracks) setTracks(data.tracks);
      if (data.coverUrl) {
        setCoverPreview(data.coverUrl);
        setDiscogsCoverUrl(data.coverUrl);
        setCoverFile(null);
      }
    } finally {
      setSearching(false);
      setSearchResults([]);
    }
  }

  async function handleBarcode(barcode: string) {
    setShowScanner(false);
    setSearching(true);
    try {
      const res = await fetch(`/api/discogs/barcode?code=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (data.results?.[0]) {
        await loadDiscogsRelease(data.results[0].id);
      }
    } finally {
      setSearching(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setDiscogsCoverUrl(null);
  }

  function getNextSide(trackList: Track[]): string {
    if (trackList.length === 0) return "A";
    const sides = trackList.map((t) => t.position?.[0]?.toUpperCase() || "A");
    const lastSide = sides[sides.length - 1];
    const sideOrder = ["A", "B", "C", "D"];
    const currentIndex = sideOrder.indexOf(lastSide);
    return currentIndex < 3 ? sideOrder[currentIndex + 1] : lastSide;
  }

  function getNextTrackNumber(trackList: Track[], side: string): number {
    const tracksOnSide = trackList.filter((t) => t.position?.[0]?.toUpperCase() === side);
    return tracksOnSide.length + 1;
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setSaveError(null);
    try {
      let coverKey: string | undefined;

      if (coverFile) {
        const extFromName = coverFile.name.split(".").pop()?.toLowerCase();
        const extFromType = coverFile.type.split("/")[1]?.toLowerCase();
        const ext = extFromName || extFromType || "jpg";
        const key = `${Date.now()}.${ext}`;
        const urlRes = await fetch(`/api/upload-url?key=${encodeURIComponent(key)}&type=${encodeURIComponent(coverFile.type)}`);
        if (!urlRes.ok) {
          const errorData = await urlRes.json().catch(() => ({}));
          const errorMsg = errorData.error ? String(errorData.error) : `Failed to get upload URL (HTTP ${urlRes.status})`;
          setSaveError(errorMsg);
          throw new Error(errorMsg);
        }
        const { url } = await urlRes.json();
        const uploadRes = await fetch(url, { method: "PUT", body: coverFile, headers: { "Content-Type": coverFile.type } });
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text().catch(() => "");
          const errorMsg = `Cover upload failed (HTTP ${uploadRes.status})${errorText ? `: ${errorText.slice(0, 200)}` : ""}`;
          setSaveError(errorMsg);
          throw new Error(errorMsg);
        }
        coverKey = key;
      }

      const payload = {
        ...values,
        year: values.year ? Number(values.year) : null,
        rating: rating || null,
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : null,
        genre: genreTags.length ? genreTags : (values.genre ? values.genre.split(",").map((s) => s.trim()).filter(Boolean) : []),
        tracks,
        coverImage: coverKey ?? record?.coverImage ?? null,
        discogsCoverUrl: coverKey ? null : discogsCoverUrl,
        // Convert empty strings to null for unique fields
        discogsId: values.discogsId?.trim() || null,
      };

      const url = record ? `/api/records/${record.id}` : "/api/records";
      const method = record ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error ? JSON.stringify(errorData.error) : `HTTP ${res.status}`;
        console.error("Save failed:", errorMsg);
        setSaveError(errorMsg);
        throw new Error("Save failed");
      }
      const saved = await res.json();
      router.push(`/record/${saved.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {saveError && (
        <div className="bg-rose-950 border border-rose-800 rounded-lg p-3 text-sm text-rose-200">
          <p className="font-medium">Failed to save: {saveError}</p>
        </div>
      )}

      {/* Discogs search */}
      <div className="bg-surface rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-secondary">Search Discogs to auto-fill</p>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchDiscogs(searchQuery))}
            placeholder="Artist, title, or label…"
            className="flex-1 bg-card border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-dim"
          />
          <button
            type="button"
            onClick={() => searchDiscogs(searchQuery)}
            disabled={searching}
            className="bg-subtle hover:bg-faint px-3 py-2 rounded-lg transition-colors"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setScannerError(null);
              setShowScanner(true);
            }}
            className="bg-subtle hover:bg-faint px-3 py-2 rounded-lg transition-colors"
            title="Scan barcode"
          >
            <Barcode size={16} />
          </button>
        </div>
        {scannerError && (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-3 mt-3 text-sm text-rose-200">
            <p>{scannerError}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-card hover:bg-subtle px-3 py-2 rounded-lg text-xs"
              >
                Use photo upload instead
              </button>
              <button
                type="button"
                onClick={() => {
                  setScannerError(null);
                  setShowScanner(true);
                }}
                className="bg-card hover:bg-subtle px-3 py-2 rounded-lg text-xs"
              >
                Retry scanner
              </button>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="bg-card rounded-lg divide-y divide-subtle max-h-60 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => loadDiscogsRelease(r.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-subtle transition-colors text-left"
              >
                {r.thumb ? (
                  <Image src={`/api/proxy-image?url=${encodeURIComponent(r.thumb)}`} alt="" width={40} height={40} unoptimized className="rounded shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-subtle rounded shrink-0 flex items-center justify-center">
                    <Disc3 size={16} className="text-dim" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {(r.year || r.catalogNumber) && (
                    <p className="text-xs text-muted">
                      {r.year && r.catalogNumber ? `${r.year} - cat. no. ${r.catalogNumber}` : r.year || `cat. no. ${r.catalogNumber}`}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showScanner && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowScanner(false)}
            className="absolute top-2 right-2 z-10 bg-surface rounded-full p-1"
          >
            <X size={16} />
          </button>
          <BarcodeScanner onDetected={handleBarcode} onError={setScannerError} />
        </div>
      )}

      {/* Cover image */}
      <div>
        <p className="text-sm font-medium text-secondary mb-2">Cover image</p>
        <div className="w-full sm:w-64">
          <div className="w-full aspect-square bg-card rounded-lg overflow-hidden relative shrink-0">
            {coverPreview ? (
              <Image
                src={discogsCoverUrl ? `/api/proxy-image?url=${encodeURIComponent(coverPreview)}` : coverPreview}
                alt="Cover"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 size={28} className="text-faint" />
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-card hover:bg-subtle px-3 py-2 rounded-lg text-sm transition-colors border border-subtle"
            >
              <Upload size={14} />
              Upload photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            {coverPreview && (
              <button
                type="button"
                onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-700/70 bg-rose-900/30 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-900/50 transition-colors"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title *" error={errors.title?.message}>
          <input {...register("title")} className={inputCls} />
        </Field>
        <Field label="Artist *" error={errors.artist?.message}>
          <input {...register("artist")} className={inputCls} />
        </Field>
        <Field label="Year">
          <input {...register("year")} type="number" min={1900} max={2100} className={inputCls} />
        </Field>
        <Field label="Label">
          <input {...register("label")} className={inputCls} />
        </Field>
        <Field label="Catalog Number">
          <input {...register("catalogNumber")} className={inputCls} />
        </Field>
        <Field label="Country">
          <input {...register("country")} className={inputCls} />
        </Field>
        <Field label="Format">
          <input {...register("format")} placeholder="LP, 7&quot;, 12&quot;…" className={inputCls} />
        </Field>
        <Field label="Genre / Style" hint="Add tags — autocomplete">
          <div>
            <div className="flex gap-2 flex-wrap">
              {/** tags */}
              {genreTags.map((t) => (
                <span key={t} className="bg-card text-muted text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{t}</span>
                  <button type="button" onClick={() => removeTag(t)} className="text-dim hover:text-secondary">
                    <X size={14} />
                  </button>
                </span>
              ))}

              <input
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => handleGenreKeyDown(e)}
                placeholder="Add genre…"
                className={cn(inputCls, "w-48")}
              />
            </div>

            {genreSuggestions.length > 0 && (
              <div className="bg-card rounded-lg mt-2 divide-y divide-subtle max-h-40 overflow-y-auto">
                {genreSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { addTag(s); setGenreInput(""); setGenreSuggestions([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-subtle"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* keep form value in sync */}
            <input type="hidden" {...register("genre")} />
          </div>
        </Field>
      </div>

      {/* Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Media condition">
          <select {...register("mediaCondition")} className={inputCls}>
            <option value="">—</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Sleeve condition">
          <select {...register("sleeveCondition")} className={inputCls}>
            <option value="">—</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Purchase price (€)">
          <input {...register("purchasePrice")} type="number" min={0} step={0.01} className={inputCls} />
        </Field>
      </div>

      {/* Rating */}
      <div>
        <p className="text-sm font-medium text-secondary mb-2">Rating</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1 === rating ? 0 : i + 1)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={i < rating ? "fill-accent text-accent" : "text-faint"}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <Field label="Notes">
        <textarea {...register("notes")} rows={3} className={cn(inputCls, "resize-none")} />
      </Field>

      {/* Tracklist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-secondary">Tracklist</p>
          <button
            type="button"
            onClick={() => {
              // Add track should respect the current side (last track's side)
              const last = tracks[tracks.length - 1];
              const currentSide = last?.position?.[0]?.toUpperCase() || "A";
              const nextNumber = getNextTrackNumber(tracks, currentSide);
              setTracks([...tracks, { position: `${currentSide}${nextNumber}`, title: "", duration: "" }]);
            }}
            className="text-xs text-accent hover:text-accent-hover"
          >
            + Add track
          </button>
        </div>
        {tracks.map((track, i) => {
          const currentSide = track.position?.[0]?.toUpperCase() || "A";
          const tracksOnSide = tracks.filter((t) => t.position?.[0]?.toUpperCase() === currentSide).length;
          return (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <div className="flex gap-1 shrink-0">
                {["A", "B", "C", "D"].map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => {
                      const currentSideLocal = track.position?.[0]?.toUpperCase() || "A";
                      const otherTracksOnNewSide = tracks.filter(
                        (t, idx) => idx !== i && t.position?.[0]?.toUpperCase() === side
                      );
                      let newNumber: number;
                      if (currentSideLocal === side) {
                        // If clicking the active side button, advance to the next side and start at 1
                        const sideOrder = ["A", "B", "C", "D"];
                        const currentIndex = sideOrder.indexOf(currentSideLocal);
                        const nextSide = currentIndex < sideOrder.length - 1 ? sideOrder[currentIndex + 1] : currentSideLocal;
                        newNumber = 1;
                        // update to nextSide (not the clicked 'side' since clicked equals current)
                        setTracks(
                          tracks.map((t, j) =>
                            j === i ? { ...t, position: `${nextSide}${newNumber}` } : t
                          )
                        );
                        return;
                      }
                      // If clicking a different side, place at the end of that side
                      newNumber = otherTracksOnNewSide.length + 1;
                      setTracks(
                        tracks.map((t, j) =>
                          j === i ? { ...t, position: `${side}${newNumber}` } : t
                        )
                      );
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-colors",
                      currentSide === side
                        ? "bg-accent text-accent-fg"
                        : "bg-subtle text-secondary hover:bg-faint"
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>
              <input
                value={track.position}
                onChange={(e) => setTracks(tracks.map((t, j) => j === i ? { ...t, position: e.target.value } : t))}
                placeholder="A1"
                className={cn(inputCls, "w-14 shrink-0")}
              />
              <input
                value={track.title}
                onChange={(e) => setTracks(tracks.map((t, j) => j === i ? { ...t, title: e.target.value } : t))}
                placeholder="Track title"
                className={cn(inputCls, "flex-1")}
              />
              <input
                value={track.duration}
                onChange={(e) => setTracks(tracks.map((t, j) => j === i ? { ...t, duration: e.target.value } : t))}
                placeholder="3:45"
                className={cn(inputCls, "w-16 shrink-0")}
              />
              <button
                type="button"
                onClick={() => setTracks(tracks.filter((_, j) => j !== i))}
                className="text-dim hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <input type="hidden" {...register("discogsId")} />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-accent text-accent-fg font-semibold py-3 rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {record ? "Save changes" : "Add to collection"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-card text-content font-semibold py-3 rounded-xl hover:bg-subtle transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-dim";

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1">
        {label}
        {hint && <span className="text-dim font-normal ml-1 text-xs">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
