import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, PlusCircle } from "lucide-react";
import WantlistActions from "./WantlistActions";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export const dynamic = "force-dynamic";

export default async function WantlistPage() {
  const session = await auth();

  const items = await prisma.wantlist.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Wantlist</h1>
          <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/wantlist/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold uppercase tracking-widest text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <PlusCircle size={14} />
            Add
          </Link>
          <div className="hidden md:block">
            <DesktopUserMenu />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-dim">
          <Heart size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nothing on your wantlist yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-surface rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold tracking-wide truncate">{item.title}</p>
                <p className="text-[11px] text-dim uppercase tracking-wider truncate mt-0.5">{item.artist}{item.year ? ` · ${item.year}` : ""}{item.label ? ` · ${item.label}` : ""}</p>
                {item.notes && <p className="text-xs text-faint font-light mt-1 truncate">{item.notes}</p>}
              </div>
              <WantlistActions id={item.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
