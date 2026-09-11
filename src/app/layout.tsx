import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { NavLink } from "@/components/nav-link";

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-zinc-50 dark:focus:text-zinc-900"
        >
          Skip to main content
        </a>
        {session?.user ? (
          <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
            <nav aria-label="Primary" className="flex items-center gap-6">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Maintenance Management
              </span>
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/equipment">Equipment</NavLink>
            </nav>
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                {session.user.name} ({session.user.role})
              </span>
              <LogoutButton />
            </div>
          </header>
        ) : null}
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
