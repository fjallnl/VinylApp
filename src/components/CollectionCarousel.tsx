"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Disc3 } from "lucide-react";
import { coverUrl } from "@/lib/s3";

interface Record {
  id: string;
  title: string;
  artist: string;
  year?: number | null;
  coverImage?: string | null;
  rating?: number | null;
}

const ACCENT_COLORS = [
  "#5b21b6",
  "#1e3a8a",
  "#064e3b",
  "#7f1d1d",
  "#78350f",
  "#155e75",
  "#701a75",
  "#1e1b4b",
  "#134e4a",
  "#3b0764",
];

export default function CollectionCarousel({ records }: { records: Record[] }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  // detailReady gates the CSS "visible" state so the enter animation fires after mount
  const [detailReady, setDetailReady] = useState(false);
  const [detailLeaving, setDetailLeaving] = useState(false);

  const openRecord = useCallback((index: number) => {
    setActive(index);
    setDetailLeaving(false);
    setExpanded(true);
    // two rAFs so the browser paints the initial (opacity:0) state first
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailReady(true)));
  }, []);

  const closeRecord = useCallback(() => {
    setDetailLeaving(true);
    setDetailReady(false);
    setTimeout(() => {
      setExpanded(false);
      setDetailLeaving(false);
    }, 380);
  }, []);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + records.length) % records.length);
  }, [records.length]);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % records.length);
  }, [records.length]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRecord();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, closeRecord, prev, next]);

  if (records.length === 0) return null;

  const current = records[active];
  const cardColor = ACCENT_COLORS[active % ACCENT_COLORS.length];
  const coverSrc = current.coverImage ? coverUrl(current.coverImage) : null;

  const detailVisible = expanded && detailReady && !detailLeaving;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-base"
      style={{ height: 520 }}
    >
      {/* ── STRIP VIEW ─────────────────────────────────────────────── */}
      <div
        className="strip-scroll absolute inset-0 flex items-stretch gap-2 px-6 py-6 overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          opacity: expanded ? 0 : 1,
          transform: expanded ? "scale(0.94)" : "scale(1)",
          transition: "opacity 350ms ease, transform 350ms ease",
          pointerEvents: expanded ? "none" : "auto",
        }}
      >
        {records.map((record, i) => {
          const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const isActive = i === active;
          return (
            <StripCard
              key={record.id}
              record={record}
              index={i}
              color={color}
              isActive={isActive}
              onHover={() => setActive(i)}
              onClick={() => openRecord(i)}
            />
          );
        })}
      </div>

      {/* ── DETAIL VIEW ────────────────────────────────────────────── */}
      {expanded && (
        <div
          className="absolute inset-0 flex"
          style={{
            opacity: detailVisible ? 1 : 0,
            transform: detailVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 380ms ease, transform 380ms ease",
          }}
        >

            {/* Vinyl record — spinning, pulled out of sleeve */}
            <div
              key={`vinyl-${current.id}`}
              className="vinyl-spin absolute z-10"
              style={{
                width: 120,
                height: 120,
                marginTop: "17%",
                marginLeft: "36%",
                filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.8))",
              }}
            >
              <Image
                src="/lp-record-isolated-on-a-transparent-background-png.png"
                alt="Vinyl record"
                fill
                unoptimized
                className="object-contain"
              />
              {/* Album art as center label */}
              {coverSrc && (
                <div
                  className="absolute rounded-full overflow-hidden"
                  style={{ top: "35%", left: "35%", width: "30%", height: "30%" }}
                >
                  <Image
                    src={coverSrc}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
                
            </div>

          {/* Left info panel */}
          <div
            className="relative flex flex-col justify-between overflow-hidden"
            style={{ width: "42%", backgroundColor: cardColor, padding: "2rem 2rem 2rem 3rem" }}
            key={`panel-${active}`}
          >
            {/* Vertical artist name along left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", paddingLeft: "0.6rem" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">
                {current.artist}
              </span>
            </div>

            {/* Track number */}
            <div>
              <p
                className="font-black text-white/15 leading-none tabular-nums"
                style={{ fontSize: "4.5rem" }}
              >
                {String(active + 1).padStart(2, "0")}
              </p>
            </div>

            {/* Title + meta */}
            <div>
              <h2 className="text-3xl font-black text-white uppercase leading-tight mb-2">
                {current.title}
              </h2>
              <p className="text-white/70 font-semibold tracking-wide">{current.artist}</p>
              {current.year && (
                <p className="text-white/40 text-sm mt-1">{current.year}</p>
              )}
              {current.rating && (
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} size={13} className="fill-accent text-accent" />
                  ))}
                </div>
              )}
              <Link
                href={`/record/${current.id}`}
                className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.15em] text-white/60 hover:text-white border-b border-white/25 hover:border-white pb-0.5 transition-colors"
              >
                View Record →
              </Link>
            </div>

            {/* Navigation row */}
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
              <span className="text-white/30 text-xs tabular-nums ml-1">
                {active + 1} / {records.length}
              </span>
              <button
                onClick={closeRecord}
                className="ml-auto text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                ← All
              </button>
            </div>
          </div>

          {/* Right: vinyl + blurred album art */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-base">
            {/* Blurred album art atmosphere */}
            {coverSrc && (
              <Image
                key={`bg-${current.id}`}
                src={coverSrc}
                alt=""
                fill
                unoptimized
                className="object-cover"
                style={{
                  filter: "blur(1px) brightness(0.9)",
                  transform: "scale(1.0)",
                  transition: "opacity 400ms ease",
                }}
              />
            )}

            {/* Album sleeve (behind, offset right) 
            {coverSrc && (
              <div
                key={`sleeve-${current.id}`}
                className="absolute z-0 rounded-lg overflow-hidden shadow-2xl"
                style={{
                  width: 220,
                  height: 220,
                  right: "8%",
                  top: "50%",
                  transform: "translateY(-50%) rotate(4deg)",
                }}
              >
                <Image
                  src={coverSrc}
                  alt={current.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
*/}
            
          </div>
        </div>
      )}
    </div>
  );
}

function StripCard({
  record,
  index,
  color,
  isActive,
  onHover,
  onClick,
}: {
  record: Record;
  index: number;
  color: string;
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const coverSrc = record.coverImage ? coverUrl(record.coverImage) : null;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer rounded-xl overflow-hidden select-none"
      style={{
        width: isActive ? 190 : 148,
        minWidth: isActive ? 190 : 148,
        height: "100%",
        backgroundColor: color,
        transition: "width 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94), min-width 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms ease",
        boxShadow: isActive
          ? "0 0 0 2px rgba(255,255,255,0.2), 0 24px 60px rgba(0,0,0,0.55)"
          : "0 8px 24px rgba(0,0,0,0.35)",
      }}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      {/* Album cover — object-cover crops to fill, preserving aspect ratio */}
      {coverSrc ? (
        <Image
          src={coverSrc}
          alt={record.title}
          fill
          unoptimized
          className="object-cover"
          style={{
            opacity: isActive ? 0.85 : 0.6,
            transition: "opacity 380ms ease",
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Disc3 size={40} className="text-white/20" />
        </div>
      )}

      {/* Bottom-to-mid gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />

      {/* Track number — top left */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-2xl font-black text-white leading-none tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Artist name — rotated along left edge, below the number */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: 6,
          top: 56,
          bottom: 60,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 whitespace-nowrap overflow-hidden">
          {record.artist}
        </span>
      </div>

      {/* Record title — bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <p className="text-white font-bold text-[11px] uppercase tracking-wide leading-tight line-clamp-3">
          {record.title}
        </p>
      </div>
    </div>
  );
}
