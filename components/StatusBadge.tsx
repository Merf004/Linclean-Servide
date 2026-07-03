import { Clock, PackageOpen, Loader2, CheckCircle2, PackageCheck, type LucideIcon } from "lucide-react";

const STATUTS: Record<string, { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  en_attente: { label: "En attente", icon: Clock, bg: "#FAEEDA", fg: "#854F0B" },
  collecte: { label: "Collecté", icon: PackageOpen, bg: "#E6F1FB", fg: "#185FA5" },
  en_traitement: { label: "En traitement", icon: Loader2, bg: "#E6F1FB", fg: "#185FA5" },
  pret: { label: "Prêt", icon: CheckCircle2, bg: "#EAF3DE", fg: "#3B6D11" },
  livre: { label: "Livré", icon: PackageCheck, bg: "#F1EFE8", fg: "#5F5E5A" },
};

export default function StatusBadge({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? STATUTS.en_attente;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      <Icon size={12} strokeWidth={2.2} />
      {s.label}
    </span>
  );
}

export { STATUTS };