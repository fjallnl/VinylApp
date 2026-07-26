import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecordForm from "@/components/RecordForm";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const record = await prisma.record.findFirst({
    where: { id, userId: session!.user!.id },
    include: { tracks: { orderBy: { position: "asc" } } },
  });

  if (!record) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Edit Record</h1>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>
      <RecordForm record={record} />
    </div>
  );
}
