import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 pt-16 md:pt-0">
        {children}
        <footer className="px-4 md:px-8 py-6 text-center text-xs uppercase tracking-widest text-zinc-500">
          © 2026 by Fjall
        </footer>
      </main>
    </div>
  );
}
