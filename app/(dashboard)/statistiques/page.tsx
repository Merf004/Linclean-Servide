import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import RevenueChart from "@/components/RevenueChart";
import RankingList from "@/components/RankingList";
import StatusBadge, { STATUTS } from "@/components/StatusBadge";

const PERIODES = [
  { value: "jour", label: "Jour" },
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
  { value: "trimestre", label: "Trimestre" },
  { value: "annee", label: "Année" },
];

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getPeriodRange(periode: string) {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date;

  switch (periode) {
    case "jour": {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      prevEnd = new Date(start);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      break;
    }
    case "semaine": {
      const day = (now.getDay() + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      prevEnd = new Date(start);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      break;
    }
    case "trimestre": {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 1);
      prevStart = new Date(now.getFullYear(), q * 3 - 3, 1);
      prevEnd = new Date(start);
      break;
    }
    case "annee": {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(start);
      break;
    }
    default: {
      // mois
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(start);
    }
  }

  return { start, end, prevStart, prevEnd };
}

function buildBuckets(periode: string, start: Date, end: Date) {
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (periode === "jour") {
    for (let h = 0; h < 24; h++) {
      const s = new Date(start);
      s.setHours(h, 0, 0, 0);
      const e = new Date(s);
      e.setHours(h + 1);
      buckets.push({ label: `${h}h`, start: s, end: e });
    }
  } else if (periode === "semaine" || periode === "mois") {
    const cur = new Date(start);
    while (cur < end) {
      const s = new Date(cur);
      const e = new Date(cur);
      e.setDate(e.getDate() + 1);
      buckets.push({
        label: s.toLocaleDateString(
          "fr-FR",
          periode === "semaine" ? { weekday: "short" } : { day: "2-digit", month: "2-digit" }
        ),
        start: s,
        end: e,
      });
      cur.setDate(cur.getDate() + 1);
    }
  } else if (periode === "trimestre") {
    const cur = new Date(start);
    let i = 1;
    while (cur < end) {
      const s = new Date(cur);
      const e = new Date(cur);
      e.setDate(e.getDate() + 7);
      buckets.push({ label: `S${i}`, start: s, end: e > end ? end : e });
      cur.setDate(cur.getDate() + 7);
      i++;
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const s = new Date(start.getFullYear(), m, 1);
      const e = new Date(start.getFullYear(), m + 1, 1);
      buckets.push({ label: s.toLocaleDateString("fr-FR", { month: "short" }), start: s, end: e });
    }
  }

  return buckets;
}

function computeDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: { periode?: string };
}) {
  const periode = searchParams.periode ?? "mois";
  const supabase = createClient();

  const { start, end, prevStart, prevEnd } = getPeriodRange(periode);

  // Fenêtre de 2 ans : large assez pour couvrir toutes les périodes + les stats globales
  const since = new Date();
  since.setFullYear(since.getFullYear() - 2);

  const { data: all } = await supabase
    .from("commandes")
    .select(
      "id, prix_service, prix_livraison, poids_kg, statut, paye, service, date_collecte, date_livraison, quartiers(nom)"
    )
    .gte("date_collecte", since.toISOString());

  const rows = all ?? [];
  const total = (r: any) => Number(r.prix_service ?? 0) + Number(r.prix_livraison ?? 0);
  const inRange = (r: any, s: Date, e: Date) => {
    const d = new Date(r.date_collecte);
    return d >= s && d < e;
  };

  const current = rows.filter((r) => inRange(r, start, end));
  const previous = rows.filter((r) => inRange(r, prevStart, prevEnd));

  const caCurrent = current.reduce((s, r) => s + total(r), 0);
  const caPrevious = previous.reduce((s, r) => s + total(r), 0);
  const kgCurrent = current.reduce((s, r) => s + Number(r.poids_kg ?? 0), 0);
  const kgPrevious = previous.reduce((s, r) => s + Number(r.poids_kg ?? 0), 0);
  const impayesCurrent = current.filter((r) => !r.paye);
  const montantImpaye = impayesCurrent.reduce((s, r) => s + total(r), 0);
  const panierMoyen = current.length > 0 ? caCurrent / current.length : 0;
  const tauxPaiement =
    current.length > 0 ? ((current.length - impayesCurrent.length) / current.length) * 100 : 0;

  // Évolution du CA
  const buckets = buildBuckets(periode, start, end);
  const chartData = buckets.map((b) => ({
    label: b.label,
    value: rows.filter((r) => inRange(r, b.start, b.end)).reduce((s, r) => s + total(r), 0),
  }));

  // Classement quartiers (période courante)
  const quartierMap = new Map<string, { ca: number; count: number }>();
  current.forEach((r: any) => {
    const nom = r.quartiers?.nom ?? "Non renseigné";
    const entry = quartierMap.get(nom) ?? { ca: 0, count: 0 };
    entry.ca += total(r);
    entry.count += 1;
    quartierMap.set(nom, entry);
  });
  const quartiersRanking = [...quartierMap.entries()]
    .map(([label, v]) => ({ label, value: v.ca, sub: `${v.count} commande${v.count > 1 ? "s" : ""}` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Répartition des services (période courante)
  const serviceMap = new Map<string, { ca: number; count: number }>();
  current.forEach((r) => {
    const label = r.service === "lavage_repassage" ? "Lavage + Repassage" : "Lavage seul";
    const entry = serviceMap.get(label) ?? { ca: 0, count: 0 };
    entry.ca += total(r);
    entry.count += 1;
    serviceMap.set(label, entry);
  });
  const servicesRanking = [...serviceMap.entries()]
    .map(([label, v]) => ({ label, value: v.count, sub: `${v.ca.toLocaleString("fr-FR")} F` }))
    .sort((a, b) => b.value - a.value);

  // Jour de la semaine le plus actif (sur toute la fenêtre de 2 ans)
  const weekdayMap = new Map<number, number>();
  rows.forEach((r) => {
    const d = new Date(r.date_collecte).getDay();
    weekdayMap.set(d, (weekdayMap.get(d) ?? 0) + 1);
  });
  const weekdayRanking = JOURS.map((label, i) => ({ label, value: weekdayMap.get(i) ?? 0 })).sort(
    (a, b) => b.value - a.value
  );

  // Répartition des statuts (toutes commandes chargées)
  const statutCounts: Record<string, number> = {};
  rows.forEach((r) => (statutCounts[r.statut] = (statutCounts[r.statut] ?? 0) + 1));

  // Délai moyen de traitement (commandes livrées)
  const livrees = rows.filter((r) => r.statut === "livre" && r.date_livraison);
  const delaiMoyenHeures =
    livrees.length > 0
      ? livrees.reduce((s, r) => {
          const diff = new Date(r.date_livraison).getTime() - new Date(r.date_collecte).getTime();
          return s + diff / (1000 * 60 * 60);
        }, 0) / livrees.length
      : 0;

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " F";
  const periodeLabel = PERIODES.find((p) => p.value === periode)?.label ?? "Mois";

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-medium text-text-primary">Statistiques</h1>
        <div className="flex gap-1.5">
          {PERIODES.map((p) => (
            <Link
              key={p.value}
              href={`/statistiques?periode=${p.value}`}
              className={`text-[12px] px-3 py-1.5 rounded-lg border ${
                periode === p.value
                  ? "bg-primary-light text-primary border-primary-soft font-medium"
                  : "bg-surface-2 text-text-secondary border-border"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <KpiCard
          label={`CA — ${periodeLabel.toLowerCase()}`}
          value={fmt(caCurrent)}
          delta={computeDelta(caCurrent, caPrevious)}
          accent
        />
        <KpiCard label="Commandes" value={String(current.length)} delta={computeDelta(current.length, previous.length)} />
        <KpiCard label="Panier moyen" value={fmt(panierMoyen)} />
        <KpiCard
          label="Kg traités"
          value={`${kgCurrent.toFixed(1)} kg`}
          delta={computeDelta(kgCurrent, kgPrevious)}
        />
        <KpiCard
          label="Taux de paiement"
          value={`${tauxPaiement.toFixed(0)} %`}
          sub={montantImpaye > 0 ? `${fmt(montantImpaye)} impayés` : undefined}
        />
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-5">
        <div className="text-[13px] font-medium text-text-primary mb-4">
          Évolution du chiffre d'affaires — {periodeLabel.toLowerCase()}
        </div>
        <RevenueChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-4">Classement des quartiers (CA)</div>
          <RankingList items={quartiersRanking} formatValue={(v) => `${v.toLocaleString("fr-FR")} F`} />
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-4">Répartition des services</div>
          <RankingList items={servicesRanking} formatValue={(v) => `${v} commande${v > 1 ? "s" : ""}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-4">Jour le plus actif</div>
          <RankingList items={weekdayRanking} formatValue={(v) => `${v} commande${v > 1 ? "s" : ""}`} />
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <div className="text-[13px] font-medium text-text-primary mb-4">Répartition des statuts</div>
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
          <div className="text-[13px] font-medium text-text-primary mb-4">Délai moyen de traitement</div>
          <div className="text-2xl font-medium text-text-primary">
            {delaiMoyenHeures >= 24 ? `${(delaiMoyenHeures / 24).toFixed(1)} j` : `${delaiMoyenHeures.toFixed(1)} h`}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Entre la collecte et la livraison, sur {livrees.length} commande{livrees.length > 1 ? "s" : ""} livrée
            {livrees.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="text-[11px] text-text-muted mb-1.5">{label}</div>
      <div className={`text-xl font-medium ${accent ? "text-primary" : "text-text-primary"}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-[11px] mt-1 ${delta >= 0 ? "text-[#3B6D11]" : "text-[#854F0B]"}`}>
          {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {delta === 0 ? "stable" : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}% vs période préc.`}
        </div>
      )}
    </div>
  );
}