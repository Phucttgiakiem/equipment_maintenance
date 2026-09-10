import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maintenance Management System",
  description: "Equipment and maintenance tracking",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {session?.user ? (
          <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
            <nav className="flex items-center gap-6">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Maintenance Management
              </span>
              <Link
                href="/equipment"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Equipment
              </Link>
            </nav>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                {session.user.name} ({session.user.role})
              </span>
              <LogoutButton />
            </div>
          </header>
        ) : null}
        {children}
      </body>
    </html>
  );
}
