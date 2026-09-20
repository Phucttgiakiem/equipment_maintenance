"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import {
  CloseIcon,
  GridIcon,
  MenuIcon,
  TagIcon,
  UsersIcon,
  WrenchIcon,
  type IconProps,
} from "@/components/ui/icons";

type NavItem = { href: string; label: string; icon: (props: IconProps) => ReactNode };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: GridIcon },
  { href: "/equipment", label: "Equipment", icon: WrenchIcon },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/categories", label: "Categories", icon: TagIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={`flex h-10 items-center gap-2.5 rounded-control px-3 text-sm font-medium transition-colors md:justify-center md:px-0 lg:justify-start lg:px-3 ${
        active ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-accent" : ""}`} />
      <span className="md:hidden lg:inline">{item.label}</span>
    </Link>
  );
}

function DrawerLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex h-12 items-center gap-3 rounded-control px-3 text-[15px] font-medium ${
        active ? "bg-surface-2 text-ink" : "text-muted"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-accent" : ""}`} />
      {item.label}
    </Link>
  );
}

function Logo() {
  return <span aria-hidden="true" className="h-[26px] w-[26px] flex-shrink-0 rounded-control bg-accent" />;
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <div className="flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-border bg-surface py-0 pr-3 pl-2 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-border"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold text-ink">Maintenance</span>
        </div>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-semibold text-ink"
        >
          {initials(user.name)}
        </span>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[300px] flex-col gap-1 border-r border-border bg-surface p-4 shadow-dialog">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-[16px] font-semibold text-ink">Maintenance</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center rounded-lg"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {NAV_ITEMS.map((item) => (
              <DrawerLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            ))}

            {isAdmin ? (
              <>
                <div className="px-3 pb-1 pt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                  Admin
                </div>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <DrawerLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                ))}
              </>
            ) : null}

            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs capitalize text-muted">{user.role}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/account/password"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-11 flex-1 items-center justify-center rounded-control border border-border text-sm font-medium text-ink"
                >
                  Password
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Primary"
        className="hidden flex-col gap-1 border-r border-border bg-surface p-3 md:flex md:w-[72px] md:items-center md:py-5 lg:w-[232px] lg:items-stretch lg:p-4"
      >
        <div className="mb-5 flex items-center gap-2.5 px-1">
          <Logo />
          <span className="hidden text-[15px] font-semibold text-ink lg:inline">Maintenance</span>
        </div>

        <div className="flex w-full flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {isAdmin ? (
          <>
            <div aria-hidden="true" className="my-2 h-px w-7 bg-border lg:hidden" />
            <div className="hidden px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-muted lg:block">
              Admin
            </div>
            <div className="flex w-full flex-col gap-1">
              {ADMIN_NAV_ITEMS.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        ) : null}

        <div className="flex-1" />

        <div className="hidden flex-col items-center border-t border-border pt-3.5 md:flex lg:hidden">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-semibold text-ink"
          >
            {initials(user.name)}
          </span>
        </div>

        <div className="hidden flex-col gap-3 border-t border-border pt-3.5 lg:flex">
          <div>
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="text-xs capitalize text-muted">{user.role}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/account/password"
              className="text-[13px] font-medium text-accent hover:underline"
            >
              Password
            </Link>
            <LogoutButton variant="link" />
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex min-w-0 flex-1 flex-col bg-canvas">
        {children}
      </main>
    </div>
  );
}
