"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/commandes", label: "Commandes", icon: Package },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
              active
                ? "bg-primary-light text-primary font-medium"
                : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"
            }`}
          >
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}