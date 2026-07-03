const STATUTS: Record<string, { label: string; icon: string; bg: string; fg: string }> = {
  en_attente: { label: "En attente", icon: "⏱️", bg: "#FAEEDA", fg: "#854F0B" },
  collecte: { label: "Collecté", icon: "🧺", bg: "#E6F1FB", fg: "#185FA5" },
  en_traitement: { label: "En traitement", icon: "🧼", bg: "#E6F1FB", fg: "#185FA5" },
  pret: { label: "Prêt", icon: "✅", bg: "#EAF3DE", fg: "#3B6D11" },
  livre: { label: "Livré", icon: "📦", bg: "#F1EFE8", fg: "#5F5E5A" },
};

export default function StatusBadge({ statut }: { statut: string }) {
  const s = STATUTS[statut] ?? STATUTS.en_attente;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

export { STATUTS };
