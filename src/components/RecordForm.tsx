"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Camera, Barcode, Loader2, X, Star, Upload, Disc3 } from "lucide-react";
import { cn, CONDITIONS } from "@/lib/utils";
import BarcodeScanner from "./BarcodeScanner";
import Image from "next/image";

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
  const [searchResults, setSearchResults] = useState<{ id: number; title: string; year: string; thumb: string }[]>([]);
  const [tracks, setTracks] = useState<Track[]>(
    record?.tracks.map((t) => ({ position: t.position ?? "", title: t.title, duration: t.duration ?? "" })) ?? []
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [discogsCoverUrl, setDiscogsCoverUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(record?.rating ?? 0);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setSaveError(null);
    try {
      let coverKey: string | undefined;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const key = `${Date.now()}.${ext}`;
        const urlRes = await fetch(`/api/upload-url?key=${encodeURIComponent(key)}&type=${encodeURIComponent(coverFile.type)}`);
        const { url } = await urlRes.json();
        await fetch(url, { method: "PUT", body: coverFile, headers: { "Content-Type": coverFile.type } });
        coverKey = key;
      }

      const payload = {
        ...values,
        year: values.year ? Number(values.year) : null,
        rating: rating || null,
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : null,
        genre: values.genre ? values.genre.split(",").map((s) => s.trim()).filter(Boolean) : [],
        tracks,
        coverImage: coverKey ?? record?.coverImage || null,
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
      <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-zinc-300">Search Discogs to auto-fill</p>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchDiscogs(searchQuery))}
            placeholder="Artist, title, or label…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => searchDiscogs(searchQuery)}
            disabled={searching}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg transition-colors"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setScannerError(null);
              setShowScanner(true);
            }}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg transition-colors"
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
                className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-xs"
              >
                Use photo upload instead
              </button>
              <button
                type="button"
                onClick={() => {
                  setScannerError(null);
                  setShowScanner(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-xs"
              >
                Retry scanner
              </button>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700 max-h-60 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => loadDiscogsRelease(r.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-zinc-700 transition-colors text-left"
              >
                {r.thumb ? (
                  <Image src={`/api/proxy-image?url=${encodeURIComponent(r.thumb)}`} alt="" width={40} height={40} unoptimized className="rounded shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-zinc-700 rounded shrink-0 flex items-center justify-center">
                    <Disc3 size={16} className="text-zinc-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.year && <p className="text-xs text-zinc-400">{r.year}</p>}
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
            className="absolute top-2 right-2 z-10 bg-zinc-900 rounded-full p-1"
          >
            <X size={16} />
          </button>
          <BarcodeScanner onDetected={handleBarcode} onError={setScannerError} />
        </div>
      )}

      {/* Cover image */}
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-2">Cover image</p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden relative shrink-0">
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
                <Disc3 size={28} className="text-zinc-600" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors"
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
                className="text-xs text-red-400 hover:text-red-300 text-left"
              >
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
        <Field label="Genre / Style" hint="Comma-separated">
          <input {...register("genre")} placeholder="Rock, Alternative Rock" className={inputCls} />
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
        <p className="text-sm font-medium text-zinc-300 mb-2">Rating</p>
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
                className={i < rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}
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
          <p className="text-sm font-medium text-zinc-300">Tracklist</p>
          <button
            type="button"
            onClick={() => setTracks([...tracks, { position: "", title: "", duration: "" }])}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            + Add track
          </button>
        </div>
        {tracks.map((track, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
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
              className="text-zinc-500 hover:text-red-400"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <input type="hidden" {...register("discogsId")} />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-amber-400 text-zinc-950 font-semibold py-3 rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {record ? "Save changes" : "Add to collection"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-zinc-800 text-zinc-100 font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 placeholder:text-zinc-500";

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">
        {label}
        {hint && <span className="text-zinc-500 font-normal ml-1 text-xs">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
