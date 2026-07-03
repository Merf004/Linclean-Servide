"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardShell({
  children,
  initials,
  email,
}: {
  children: React.ReactNode;
  initials: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface-1">
      <div className="md:hidden fixed inset-x-0 top-0 z-40 border-b border-border bg-surface-2/95 backdrop-blur-sm px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Linclean Service" width={44} height={44} className="rounded-lg" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Linclean Service</div>
              <div className="text-[11px] text-text-muted">Administration</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-0 text-text-primary transition hover:bg-surface-1"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <aside className="hidden md:flex w-[220px] shrink-0 bg-surface-2 border-r border-border flex-col p-4 gap-0.5">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <Image src="/logo.png" alt="Linclean Service" width={86} height={86} className="rounded-[10px]" />
        </div>

        <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-2 pt-3 pb-1">Menu</div>
        <NavLinks />

        <div className="mt-auto border-t border-border pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-medium text-primary">
                {initials}
              </div>
              <div>
                <div className="text-xs font-medium text-text-primary">Admin</div>
                <div className="text-[10px] text-text-muted truncate max-w-[100px]">{email}</div>
              </div>
            </div>
            <DarkModeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto bg-surface-2 border-r border-border p-4 md:hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Linclean Service" width={38} height={38} className="rounded-lg" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">Menu</div>
                  <div className="text-[11px] text-text-muted">Navigation</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-0 text-text-primary transition hover:bg-surface-1"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-2 pt-3 pb-1">Navigation</div>
            <NavLinks onNavigate={() => setOpen(false)} />

            <div className="mt-auto border-t border-border pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-medium text-primary">
                    {initials}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-text-primary">Admin</div>
                    <div className="text-[10px] text-text-muted truncate max-w-[100px]">{email}</div>
                  </div>
                </div>
                <DarkModeToggle />
              </div>
              <LogoutButton />
            </div>
          </div>
        </>
      ) : null}

      <main className="flex-1 overflow-y-auto p-6 pt-24 md:pt-6 flex flex-col gap-5">{children}</main>
    </div>
  );
}
