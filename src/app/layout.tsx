import type { Metadata, Viewport } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vinyl Collection",
  description: "My personal vinyl record collection",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const themePreference = session?.user?.themePreference ?? "system";

  return (
    <html lang="en" data-theme={themePreference} className={`${josefinSans.variable} h-full`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
