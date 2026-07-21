import Link from "next/link";
import Image from "next/image";
import { Disc3 } from "lucide-react";
import { coverUrl } from "@/lib/s3";

type RecentRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverImage: string | null;
  createdAt: Date;
};

export default function RecentAdditions({ records }: { records: RecentRecord[] }) {
  if (records.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
        Recently Added
      </h2>
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <Link
            key={record.id}
            href={`/record/${record.id}`}
            className="flex items-center gap-4 bg-zinc-900 rounded-lg px-4 py-3 hover:bg-zinc-800 transition-colors"
          >
            <div className="w-12 h-12 bg-zinc-800 rounded-md overflow-hidden relative shrink-0">
              {record.coverImage ? (
                <Image
                  src={coverUrl(record.coverImage)}
                  alt={record.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 size={24} className="text-zinc-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate tracking-wide">{record.title}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider truncate">
                {record.artist}
              </p>
            </div>
            {record.year && (
              <span className="text-[11px] text-zinc-600 font-light shrink-0">{record.year}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
