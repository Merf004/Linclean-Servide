import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RevenueChart from "@/components/RevenueChart";
import StatusBadge, { STATUTS } from "@/components/StatusBadge";

function startOf(unit: "day" | "week" | "month", from = new Date()) {
  const d = new Date(from);
  if (unit === "day") d.setHours(0, 0, 0, 0);
  if (unit === "week") {
    const day = (d.getDay() + 6) % 7; // lundi = 0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
  }
  if (unit === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default async function DashboardPage() {
  const supabase = createClient();

  const since = new Date();
  since.setDate(since.getDate() - 35); // marge pour semaine/mois + graphique

  const { data: commandes } = await supabase
    .from("commandes")
    .select("id, prix_service, prix_livraison, poids_kg, statut, date_collecte, quartier_id, quartiers(nom)")
    .gte("date_collecte", since.toISOString());

  const rows = commandes ?? [];
  const total = (r: any) => Number(r.prix_service ?? 0) + Number(r.prix_livraison ?? 0);

  const todayStart = startOf("day");
  const weekStart = startOf("week");
  const monthStart = startOf("month");

  const inRange = (r: any, start: Date) => new Date(r.date_collecte) >= start;

  const commandesAujourdhui = rows.filter((r) => inRange(r, todayStart));
  const commandesEnCours = rows.filter((r) => r.statut !== "livre");

  const caJour = commandesAujourdhui.reduce((s, r) => s + total(r), 0);
  const caSemaine = rows.filter((r) => inRange(r, weekStart)).reduce((s, r) => s + total(r), 0);
  const caMois = rows.filter((r) => inRange(r, monthStart)).reduce((s, r) => s + total(r), 0);

  const kgSemaine = rows
    .filter((r) => inRange(r, weekStart))
    .reduce((s, r) => s + Number(r.poids_kg ?? 0), 0);
  const kgMois = rows
    .filter((r) => inRange(r, monthStart))
    .reduce((s, r) => s + Number(r.poids_kg ?? 0), 0);

  // Quartier le plus actif (ce mois)
  const quartierCounts = new Map<string, number>();
  rows.filter((r) => inRange(r, monthStart)).forEach((r: any) => {
    const nom = r.quartiers?.nom ?? "Non renseigné";
    quartierCounts.set(nom, (quartierCounts.get(nom) ?? 0) + 1);
  });
  const quartierActif =
    [...quartierCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Répartition par statut
  const statutCounts: Record<string, number> = {};
  rows.forEach((r) => (statutCounts[r.statut] = (statutCounts[r.statut] ?? 0) + 1));

  // Graphique : CA des 7 derniers jours
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const value = rows
      .filter((r) => {
        const d = new Date(r.date_collecte);
        return d >= day && d < nextDay;
      })
      .reduce((s, r) => s + total(r), 0);
    return { label: JOURS[day.getDay()], value };
  });

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " F";

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-text-primary">Tableau de bord</h1>
        <Link
          href="/commandes/nouvelle"
          className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-medium flex items-center gap-1.5"
        >
          + Nouvelle commande
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StatCard label="Commandes aujourd'hui" value={String(commandesAujourdhui.length)} sub={`${commandesEnCours.length} en cours`} />
        <StatCard label="CA aujourd'hui" value={fmt(caJour)} accent sub="FCFA" />
        <StatCard label="CA ce mois" value={fmt(caMois)} accent sub="FCFA" />
        <StatCard label="Kg traités ce mois" value={`${kgMois.toFixed(1)} kg`} sub={quartierActif} />
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-medium text-text-primary">Chiffre d'affaires — 7 derniers jours</div>
          <div className="text-[11px] text-text-muted">Semaine : {fmt(caSemaine)}</div>
        </div>
        <RevenueChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-3">Répartition des statuts</div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(STATUTS).map(([key, s]) => {
              const Icon = s.icon;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-light text-primary">
                    <Icon size={12} strokeWidth={2.2} />
                    {s.label}
                  </span>
                  <span className="text-[13px] font-medium text-text-primary">{statutCounts[key] ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-3">Activité par quartier (ce mois)</div>
          <div className="flex flex-col gap-2.5">
            {[...quartierCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([nom, count]) => (
                <div key={nom} className="flex items-center justify-between text-[13px]">
                  <span className="text-text-secondary">{nom}</span>
                  <span className="font-medium text-text-primary">{count} commande{count > 1 ? "s" : ""}</span>
                </div>
              ))}
            {quartierCounts.size === 0 && (
              <div className="text-[12px] text-text-muted">Aucune commande ce mois-ci.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="text-[11px] text-text-muted mb-1.5">{label}</div>
      <div className={`text-xl font-medium ${accent ? "text-primary" : "text-text-primary"}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
