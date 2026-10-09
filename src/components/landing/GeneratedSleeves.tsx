// Procedurally drawn sleeve artwork for the public landing page.
// Everything is original SVG (no third-party cover art), rendered on the server.

const INK = "#0c0c0f";
const CREAM = "#f3ead8";
const AMBER = "#f5b43c";
const SIENNA = "#c2410c";
const SAGE = "#9ca38f";
const DUSK = "#7c8ca8";

export type SleeveDesign = {
  /** Colour of the centre label on the record peeking out of the sleeve */
  label: string;
  art: React.ReactNode;
};

const f = (n: number) => n.toFixed(2);

function Grain({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <rect
      width="100"
      height="100"
      filter="url(#lp-grain)"
      opacity={opacity}
      style={{ mixBlendMode: "overlay" }}
    />
  );
}

function Caption({ x, y, children, fill, anchor = "start", size = 3 }: {
  x: number;
  y: number;
  children: React.ReactNode;
  fill: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
}) {
  return (
    <text x={x} y={y} fill={fill} fontSize={size} fontWeight={600} letterSpacing={0.6} textAnchor={anchor}>
      {children}
    </text>
  );
}

const wavePaths = Array.from({ length: 22 }, (_, i) => {
  const y0 = 22 + i * 2.6;
  let d = "";
  for (let x = 0; x <= 100; x += 2) {
    const envelope = 2 + 6 * Math.exp(-((x - 55) ** 2) / 400);
    const y = y0 + Math.sin(x * 0.09 + i * 0.35) * envelope;
    d += `${x === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
  }
  return d;
});

const halftoneDots = Array.from({ length: 14 * 14 }, (_, n) => {
  const cx = 3.6 + (n % 14) * 7.1;
  const cy = 3.6 + Math.floor(n / 14) * 7.1;
  const r = Math.max(0.25, 3.2 - Math.hypot(cx - 32, cy - 68) * 0.045);
  return { cx, cy, r };
});

const contourPaths = Array.from({ length: 12 }, (_, k) => {
  const base = 6 + k * 5.2;
  let d = "";
  for (let s = 0; s <= 72; s++) {
    const t = (s / 72) * Math.PI * 2;
    const r = base + 2.2 * Math.sin(3 * t + k * 0.5) + 1.4 * Math.sin(5 * t - k * 0.3);
    d += `${s === 0 ? "M" : "L"}${f(45 + r * Math.cos(t))} ${f(55 + r * Math.sin(t))}`;
  }
  return `${d}Z`;
});

export const SLEEVE_DESIGNS: SleeveDesign[] = [
  // Aurora — blurred colour fields
  {
    label: "#e11d48",
    art: (
      <>
        <rect width="100" height="100" fill="#0e0d12" />
        <g filter="url(#lp-blur)">
          <circle cx="25" cy="30" r="34" fill={AMBER} />
          <circle cx="78" cy="58" r="30" fill="#e11d48" opacity="0.8" />
          <circle cx="45" cy="98" r="34" fill="#6d28d9" opacity="0.75" />
        </g>
        <Grain opacity={0.3} />
        <Caption x={8} y={92} fill={CREAM} size={3.6}>NOCTURNE</Caption>
        <Caption x={92} y={10} fill={CREAM} anchor="end" size={2.6}>VC · 01</Caption>
      </>
    ),
  },
  // Concentric grooves on cream
  {
    label: AMBER,
    art: (
      <>
        <rect width="100" height="100" fill={CREAM} />
        {Array.from({ length: 28 }, (_, k) => (
          <circle key={k} cx="64" cy="60" r={(k + 1) * 3.2} fill="none" stroke={INK} strokeWidth="0.45" />
        ))}
        <circle cx="64" cy="60" r="12" fill={AMBER} />
        <Grain opacity={0.18} />
        <Caption x={8} y={10} fill={INK} size={2.6}>STUDIES IN RESONANCE</Caption>
      </>
    ),
  },
  // Swiss — big setting sun, strict typography
  {
    label: CREAM,
    art: (
      <>
        <rect width="100" height="100" fill={SIENNA} />
        <circle cx="58" cy="96" r="44" fill={CREAM} />
        <circle cx="58" cy="96" r="3" fill={INK} />
        <rect x="8" y="22" width="84" height="0.6" fill={INK} />
        <text x="8" y="18" fill={INK} fontSize="11" fontWeight={700} letterSpacing={-0.3}>33⅓</text>
        <Caption x={92} y={18} fill={INK} anchor="end" size={2.8}>RPM — SIDE A</Caption>
        <Grain />
      </>
    ),
  },
  // Interference waves
  {
    label: "#fb7185",
    art: (
      <>
        <defs>
          <linearGradient id="lp-wave" x1="0" x2="1">
            <stop offset="0" stopColor={AMBER} />
            <stop offset="1" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={INK} />
        {wavePaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="url(#lp-wave)" strokeWidth="0.4" opacity={0.35 + (i / 22) * 0.65} />
        ))}
        <Caption x={8} y={92} fill={CREAM} size={2.6}>FREQUENCIES</Caption>
        <Grain />
      </>
    ),
  },
  // Halftone sun
  {
    label: "#e9d8a6",
    art: (
      <>
        <rect width="100" height="100" fill="#1f2a2e" />
        {halftoneDots.map(({ cx, cy, r }, i) => (
          <circle key={i} cx={f(cx)} cy={f(cy)} r={f(r)} fill="#e9d8a6" />
        ))}
        <Grain />
        <Caption x={92} y={10} fill="#e9d8a6" anchor="end" size={2.6}>LP · 1974</Caption>
      </>
    ),
  },
  // Bauhaus quarters
  {
    label: SIENNA,
    art: (
      <>
        <rect width="100" height="100" fill="#e7e0d2" />
        <rect width="50" height="50" fill={INK} />
        <path d="M0 50 A50 50 0 0 1 50 0 L50 50 Z" fill={AMBER} />
        <circle cx="75" cy="25" r="17" fill={SIENNA} />
        <rect y="50" width="50" height="50" fill={SAGE} />
        <path d="M0 100 A25 25 0 0 1 50 100 Z" fill={CREAM} />
        <rect x="50" y="50" width="50" height="50" fill={DUSK} />
        <path d="M50 50 A50 50 0 0 1 100 100 L50 100 Z" fill={INK} />
        <Grain opacity={0.2} />
      </>
    ),
  },
  // Glass orb over a horizon
  {
    label: "#fde68a",
    art: (
      <>
        <defs>
          <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b1530" />
            <stop offset="1" stopColor="#0b0b10" />
          </linearGradient>
          <radialGradient id="lp-orb" cx="0.36" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#fff7d6" />
            <stop offset="0.25" stopColor="#fde68a" />
            <stop offset="0.6" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#7c2d12" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#lp-sky)" />
        <rect x="0" y="66" width="100" height="0.3" fill={CREAM} opacity="0.35" />
        <ellipse cx="50" cy="80" rx="22" ry="4" fill="#f59e0b" opacity="0.25" filter="url(#lp-blur-soft)" />
        <circle cx="50" cy="46" r="24" fill="url(#lp-orb)" />
        <Caption x={50} y={92} fill={CREAM} size={2.6} anchor="middle">HORIZON</Caption>
        <Grain opacity={0.28} />
      </>
    ),
  },
  // Topographic contours
  {
    label: "#d6c7a1",
    art: (
      <>
        <rect width="100" height="100" fill="#2b2f26" />
        {contourPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#d6c7a1" strokeWidth="0.45" opacity={1 - i * 0.05} />
        ))}
        <circle cx="45" cy="55" r="1.6" fill={AMBER} />
        <Caption x={8} y={10} fill="#d6c7a1" size={2.6}>FIELD RECORDINGS</Caption>
        <Grain />
      </>
    ),
  },
];

/** Shared filters, rendered once per page and referenced by id from each sleeve. */
export function SleeveFilters() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <filter id="lp-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id="lp-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="lp-blur-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
    </svg>
  );
}

export function SleeveArt({ design }: { design: SleeveDesign }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      {design.art}
    </svg>
  );
}
