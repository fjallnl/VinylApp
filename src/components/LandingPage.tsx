import Link from "next/link";
import { Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SLEEVE_DESIGNS, SleeveArt, SleeveFilters, type SleeveDesign } from "@/components/landing/GeneratedSleeves";

type FloatSlot = {
  top: string;
  left: string;
  size: number;
  rotate: number;
  /** Position on small screens; slots without one are hidden there */
  mobile?: { top: string; left: string };
};

// Kept along the edges so the centre stays calm and readable.
// On mobile only the corners are used, above and below the hero.
const FLOAT_SLOTS: FloatSlot[] = [
  { top: "8%", left: "6%", size: 150, rotate: -8, mobile: { top: "7%", left: "-6%" } },
  { top: "14%", left: "76%", size: 170, rotate: 6, mobile: { top: "10%", left: "64%" } },
  { top: "66%", left: "4%", size: 140, rotate: 5, mobile: { top: "82%", left: "-4%" } },
  { top: "70%", left: "74%", size: 160, rotate: -5, mobile: { top: "85%", left: "62%" } },
  { top: "40%", left: "86%", size: 110, rotate: 10 },
  { top: "38%", left: "-2%", size: 120, rotate: -12 },
  { top: "-4%", left: "42%", size: 100, rotate: 4 },
  { top: "84%", left: "40%", size: 110, rotate: -6 },
];

// Small seeded PRNG so every sleeve gets its own drift without breaking render purity.
function seeded(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Horizontal, vertical and tilt motions run at unrelated speeds, so the
// combined path never visibly repeats and reads as a slow random drift.
function driftVars(index: number) {
  const rand = seeded(index + 1);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const durX = between(17, 29);
  const durY = between(14, 24);
  const durR = between(20, 34);
  return {
    "--drift-x": `${between(18, 42).toFixed(1)}px`,
    "--drift-y": `${between(14, 32).toFixed(1)}px`,
    "--drift-r": `${between(2, 5).toFixed(1)}deg`,
    "--dur-x": `${durX.toFixed(1)}s`,
    "--dur-y": `${durY.toFixed(1)}s`,
    "--dur-r": `${durR.toFixed(1)}s`,
    "--delay-x": `${(-rand() * durX).toFixed(1)}s`,
    "--delay-y": `${(-rand() * durY).toFixed(1)}s`,
    "--delay-r": `${(-rand() * durR).toFixed(1)}s`,
    "--spin": `${between(28, 46).toFixed(1)}s`,
  };
}

const GROOVES =
  "repeating-radial-gradient(circle, #111 0px, #111 2px, #1c1c1f 3px, #111 4px)";

function FloatingRecord({ slot, index, design }: { slot: FloatSlot; index: number; design: SleeveDesign }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute vinyl-drift-x top-[var(--top-m)] left-[var(--left-m)] size-[calc(var(--size)*0.62)]",
        "md:top-[var(--top)] md:left-[var(--left)] md:size-[var(--size)]",
        !slot.mobile && "hidden md:block",
      )}
      style={
        {
          "--top": slot.top,
          "--left": slot.left,
          "--top-m": slot.mobile?.top ?? slot.top,
          "--left-m": slot.mobile?.left ?? slot.left,
          "--size": `${slot.size}px`,
          "--float-rotate": `${slot.rotate}deg`,
          ...driftVars(index),
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 vinyl-drift-y">
        <div className="absolute inset-0 vinyl-drift-r">
          {/* Record peeking out of the sleeve */}
          <div
            className="absolute top-[6%] left-[38%] w-[88%] h-[88%] rounded-full vinyl-spin shadow-xl ring-1 ring-white/5"
            style={{ background: GROOVES, animationDuration: "var(--spin)" }}
          >
            {/* Light catching the grooves */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 30deg, transparent 0deg, rgba(255,255,255,0.10) 40deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.08) 220deg, transparent 270deg)",
              }}
            />
            <div className="absolute inset-[34%] rounded-full" style={{ background: design.label }} />
            <div className="absolute inset-[48%] rounded-full bg-[#0c0c0f]" />
          </div>
          {/* Sleeve */}
          <div className="relative w-full h-full rounded-[3px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]">
            <SleeveArt design={design} />
            {/* Laminated sheen + edge */}
            <div
              className="absolute inset-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.22) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <SleeveFilters />
      {/* Soft accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-accent) 10%, transparent) 0%, transparent 60%)",
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 md:opacity-90 landing-fade">
        {FLOAT_SLOTS.map((slot, i) => (
          <FloatingRecord key={i} slot={slot} index={i} design={SLEEVE_DESIGNS[i % SLEEVE_DESIGNS.length]} />
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Disc3 size={22} className="text-accent" />
          <span className="text-sm font-bold uppercase tracking-widest">Vinyl Collection</span>
        </div>
        <Link
          href="/login"
          className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-subtle hover:border-accent hover:text-accent transition-colors"
        >
          Sign In
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div className="max-w-2xl text-center landing-fade">
          <p className="flex items-center justify-center gap-3 text-[11px] font-semibold text-accent uppercase tracking-[0.3em] mb-6">
            <span className="h-px w-8 bg-accent/60" />
            Welcome
            <span className="h-px w-8 bg-accent/60" />
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.12em] md:tracking-widest mb-5">
            <span className="block font-light">Your records,</span>
            <span className="block font-bold">beautifully kept</span>
          </h1>
          <p className="text-muted max-w-md mx-auto mb-10">
            Catalogue every record you own, track their condition, rate your favourites and keep a
            wantlist of the ones still out there.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="whitespace-nowrap bg-accent text-accent-fg font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-accent-hover transition-colors"
            >
              Start your collection
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap bg-surface border border-subtle font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-4 text-center text-xs text-dim">
        <Link href="/privacy" className="hover:text-accent transition-colors">
          Privacy &amp; Cookies
        </Link>
      </footer>
    </div>
  );
}
