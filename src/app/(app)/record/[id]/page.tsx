import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coverUrl } from "@/lib/s3";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Edit, Disc3, ExternalLink } from "lucide-react";
import DeleteRecordButton from "./DeleteRecordButton";
import FavoriteToggleButton from "./FavoriteToggleButton";
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
  const discogsSearchQuery = encodeURIComponent((record.catalogNumber || `${record.artist} ${record.title}`).trim());
  const discogsUrl = record.discogsId
    ? `https://www.discogs.com/release/${encodeURIComponent(record.discogsId)}`
    : `https://www.discogs.com/search/?type=release&q=${discogsSearchQuery}`;

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

          <dl className="grid grid-cols-2 max-[455px]:grid-cols-1 gap-x-4 gap-y-3 mb-6">
            {record.year && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Year</dt><dd className="text-sm break-words">{record.year}</dd></>}
            {record.label && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Label</dt><dd className="text-sm break-words">{record.label}</dd></>}
            {record.catalogNumber && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Cat. No.</dt><dd className="text-sm font-mono break-all">{record.catalogNumber}</dd></>}
            {record.format && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Format</dt><dd className="text-sm break-words">{record.format}</dd></>}
            {record.country && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Country</dt><dd className="text-sm break-words">{record.country}</dd></>}
            {record.mediaCondition && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Media</dt><dd className="text-sm break-words">{record.mediaCondition}</dd></>}
            {record.sleeveCondition && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Sleeve</dt><dd className="text-sm break-words">{record.sleeveCondition}</dd></>}
            {record.purchasePrice && <><dt className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Paid</dt><dd className="text-sm break-words">€{record.purchasePrice.toFixed(2)}</dd></>}
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

          <div className="flex gap-3 flex-wrap">
            <FavoriteToggleButton recordId={record.id} initialFavorite={record.favorite} />
            <Link
              href={`/record/${record.id}/edit`}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 max-[455px]:px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              <Edit size={13} />
              Edit
            </Link>
            <DeleteRecordButton id={record.id} />
            <Link
              href={discogsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Show on Discogs"
              className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={16} aria-hidden="true" className="text-amber-400" />
            </Link>
            <Link
              href={spotifySearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Show on Spotify"
              className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Disc3 size={16} aria-hidden="true" className="text-[#1DB954]" />
            </Link>
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
                <span className="flex-1 min-w-0 text-sm break-words">{track.title}</span>
                {track.duration && <span className="text-zinc-500 text-[11px] font-light">{track.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
