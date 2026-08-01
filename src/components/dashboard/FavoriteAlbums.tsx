import Link from "next/link";
import Image from "next/image";
import { Disc3, Star } from "lucide-react";
import { coverUrl } from "@/lib/s3";

type FavoriteRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverImage: string | null;
};

export default function FavoriteAlbums({ records }: { records: FavoriteRecord[] }) {
  if (records.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-dim mb-4 flex items-center gap-2">
        <Star size={12} className="fill-accent text-accent" />
        Favorites
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {records.map((record) => (
          <Link key={record.id} href={`/record/${record.id}`} className="block group">
            <div className="aspect-square bg-card rounded-lg overflow-hidden mb-2 relative">
              {record.coverImage ? (
                <Image
                  src={coverUrl(record.coverImage)}
                  alt={record.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 size={40} className="text-faint" />
                </div>
              )}
            </div>
            <p className="text-sm font-semibold leading-tight truncate tracking-wide">{record.title}</p>
            <p className="text-[11px] text-dim uppercase tracking-wider truncate">{record.artist}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
