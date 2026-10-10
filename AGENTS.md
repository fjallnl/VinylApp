# AGENTS.md — GitHub Copilot & AI Agent Instructions for VinylApp

Welcome to **VinylApp**! This file serves as the primary guidance document for GitHub Copilot, Copilot Workspace, and other AI coding agents working within this repository.

---

## 1. Project Context & Objectives
`VinylApp` is a full-featured web/mobile application for cataloging, searching, managing, and valuing vinyl record collections.

### Core Features
- **Collection Management**: Catalog vinyl albums, EPs, singles, pressings, matrix codes, catalog numbers, and condition ratings.
- **External Metadata Synchronization**: Integrate with external APIs (Discogs, MusicBrainz, Spotify) for automatic metadata fetching, tracklists, high-res sleeve artwork, and market values.
- **Grading & Condition Tracking**: Utilize standard vinyl condition grading (Goldmine Grading System: M, NM, VG+, VG, G+, G, F, P).
- **Wishlist & Wantlist**: Track desired records, target prices, and pressing variants.
- **Statistics & Insights**: Interactive dashboard displaying collection value, top genres, release decades, and artist breakdown.

---

## 4. Coding Standards & Guidelines for AI Agents

### TypeScript & Code Structure
- **Strict Typing**: Never use `any`. Always define explicit interfaces in `src/types/` (e.g., `VinylRecord`, `DiscogsRelease`, `ConditionGrade`).
- **Functional & Modular Components**: Write clean, modern functional React components with strict props interfaces.
- **Separation of Concerns**: Keep business logic and API calls inside custom hooks (`src/hooks/`) or utility libraries (`src/lib/`), separated from UI views.

### API Handling & Caching
- **Rate Limiting**: Discogs API enforces strict rate limits (60 req/min for authenticated users). Always route Discogs calls through server-side cached routes or `src/lib/discogs/` rate-limited wrappers.
- **Graceful Loading & Error States**: Provide loading skeletons for album artwork and fallback placeholder graphics if cover art is missing or fails to load.

### Security & Credentials
- **Zero Secrets in Code**: Never commit API tokens, client secrets, or database URLs. Use `.env.local` for local secrets and read them exclusively via `process.env`.

### General
- Provide minimal diffs or targeted file edits only. Do not rewrite unmodified boilerplate or re-export existing functions

---

## 5. Domain Rules & Definitions

### Vinyl Grading Standard (Goldmine Grading Scale)
Use these exact enum values and descriptions when handling vinyl item condition:
- `M` (**Mint**): Brand new, sealed, unplayed, flawless.
- `NM` (**Near Mint**): Nearly perfect, played once/twice, no visible surface marks.
- `VG+` (**Very Good Plus**): Minor signs of wear, light surface sleeve scuffs, negligible background noise.
- `VG` (**Very Good**): Visible scuffs/light scratches, surface noise in soft passages, light split seams.
- `G+` / `G` (**Good / Good Plus**): Significant surface noise, scratches feelable by fingernail, sleeve wear heavy.
- `P` / `F` (**Poor / Fair**): Warped, skips, jacket severely damaged.

### Vinyl Formats & Speeds
- **RPM**: `33 1/3 RPM`, `45 RPM`, `78 RPM`
- **Size**: `12"`, `10"`, `7"`
- **Packaging**: `LP`, `2xLP`, `EP`, `Single`, `Gatefold`, `Box Set`, `Picture Disc`

---

## 6. Useful Workflows & CLI Commands

Commands are listed in `CLAUDE.md` and `package.json`. There is no test runner or formatter script yet.

---

## 7. Instructions for Copilot Prompts

When generating code for this repository:
1. Follow existing UI conventions using Tailwind CSS utility classes.
2. Ensure full accessibility (ARIA labels on icon-only buttons, proper `alt` tags on vinyl covers).
3. Always check if a relevant type definition exists in `src/types/` before introducing new data shapes.
4. Add unit test skeletons in `tests/` for newly created utility helper functions.

