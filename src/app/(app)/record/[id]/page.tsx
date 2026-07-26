import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coverUrl } from "@/lib/s3";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Edit, Disc3 } from "lucide-react";
import DeleteRecordButton from "./DeleteRecordButton";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const record = await prisma.record.findFirst({
    where: { id, userId: session!.user!.id },
    include: { tracks: { orderBy: { position: "asc" } } },
  });

  if (!record) notFound();
  const spotifyQuery = encodeURIComponent(`${record.artist} ${record.title}`.trim());
  const spotifySearchUrl = `https://open.spotify.com/search/${spotifyQuery}`;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/collection" className="text-zinc-400 hover:text-zinc-100 shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{record.artist}</p>
        </div>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Cover */}
        <div className="w-full sm:w-64 shrink-0">
          <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative">
            {record.coverImage ? (
              <Image src={coverUrl(record.coverImage)} alt={record.title} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 size={64} className="text-zinc-600" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-wide mb-1">{record.title}</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mb-4">{record.artist}</p>

          {record.rating && (
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < record.rating! ? "fill-amber-400 text-amber-400" : "text-zinc-600"}
                />
              ))}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
            {record.year && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Year</dt><dd className="text-sm">{record.year}</dd></>}
            {record.label && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Label</dt><dd className="text-sm">{record.label}</dd></>}
            {record.catalogNumber && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Cat. No.</dt><dd className="text-sm font-mono">{record.catalogNumber}</dd></>}
            {record.format && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Format</dt><dd className="text-sm">{record.format}</dd></>}
            {record.country && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Country</dt><dd className="text-sm">{record.country}</dd></>}
            {record.mediaCondition && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Media</dt><dd className="text-sm">{record.mediaCondition}</dd></>}
            {record.sleeveCondition && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Sleeve</dt><dd className="text-sm">{record.sleeveCondition}</dd></>}
            {record.purchasePrice && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Paid</dt><dd className="text-sm">€{record.purchasePrice.toFixed(2)}</dd></>}
          </dl>

          {record.genre.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {[...record.genre, ...record.style].map((tag) => (
                <span key={tag} className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {record.notes && <p className="text-sm text-zinc-400 mb-6">{record.notes}</p>}

          <div className="flex gap-3">
            <Link
              href={`/record/${record.id}/edit`}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              <Edit size={13} />
              Edit
            </Link>
            <Link
              href={spotifySearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Show on Spotify"
              className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current text-[#1DB954]">
                <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.2 17.3a.75.75 0 0 1-1.03.25 10.2 10.2 0 0 0-5.16-1.27c-1.67 0-3.07.3-4.3.9a.75.75 0 1 1-.66-1.35c1.45-.7 3.06-1.05 4.96-1.05 2.1 0 4.05.48 5.91 1.54.35.2.47.66.28 1Zm1.02-2.55a.94.94 0 0 1-1.28.32c-1.71-1.05-4.3-1.66-6.62-1.66-1.93 0-3.61.33-4.99.99a.94.94 0 1 1-.8-1.7c1.65-.77 3.59-1.17 5.79-1.17 2.64 0 5.56.69 7.6 1.94.45.28.6.86.3 1.28Zm.12-2.63c-2.04-1.21-5.4-1.98-8.18-1.98-2.23 0-4.44.46-6.03 1.26a1.12 1.12 0 1 1-1-2c1.9-.95 4.42-1.47 7.06-1.47 3.1 0 6.82.83 9.3 2.3a1.12 1.12 0 1 1-1.15 1.9Z" />
              </svg>
            </Link>
            <DeleteRecordButton id={record.id} />
          </div>
        </div>
      </div>

      {/* Tracklist */}
      {record.tracks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Tracklist</h3>
          <div className="bg-zinc-900 rounded-lg divide-y divide-zinc-800">
            {record.tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-zinc-600 text-[11px] font-semibold w-8 text-right shrink-0 tracking-wide">{track.position}</span>
                <span className="flex-1 text-sm">{track.title}</span>
                {track.duration && <span className="text-zinc-500 text-[11px] font-light">{track.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
