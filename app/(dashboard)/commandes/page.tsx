import Link from "next/link";
import { Plus, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";

const STATUT_FILTERS = [
  { value: "", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "collecte", label: "Collecté" },
  { value: "en_traitement", label: "En traitement" },
  { value: "pret", label: "Prêt" },
  { value: "livre", label: "Livré" },
];

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: { statut?: string; date?: string; impayees?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("commandes")
    .select("id, numero_commande, client_nom, service, statut, paye, prix_service, prix_livraison, date_collecte, quartiers(nom)")
    .order("date_collecte", { ascending: false });

  if (searchParams.statut) query = query.eq("statut", searchParams.statut);
  if (searchParams.date) {
    const day = new Date(searchParams.date);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    query = query.gte("date_collecte", day.toISOString()).lt("date_collecte", next.toISOString());
  }
  if (searchParams.impayees === "1") query = query.eq("paye", false);

  const { data: commandes } = await query;

  const buildHref = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    const merged = { statut: searchParams.statut, date: searchParams.date, impayees: searchParams.impayees, ...params };
    Object.entries(merged).forEach(([k, v]) => v && usp.set(k, v));
    const qs = usp.toString();
    return qs ? `/commandes?${qs}` : "/commandes";
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-text-primary">Commandes</h1>
        <Link
          href="/commandes/nouvelle"
          className="bg-primary text-white rounded-lg px-4 py-2 text-[13px] font-medium flex items-center gap-1.5"
        >
          <Plus size={15} /> Nouvelle commande
        </Link>
      </div>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {STATUT_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={buildHref({ statut: f.value || undefined })}
                className={`text-[11px] px-2.5 py-1 rounded-md border ${
                  (searchParams.statut ?? "") === f.value
                    ? "bg-primary-light text-primary border-primary-soft"
                    : "bg-surface-1 text-text-secondary border-border"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <form action="/commandes" className="flex items-center gap-2">
              {searchParams.statut && <input type="hidden" name="statut" value={searchParams.statut} />}
              <input
                type="date"
                name="date"
                defaultValue={searchParams.date}
                className="text-[11px] border border-border rounded-md px-2 py-1 bg-surface-1 text-text-secondary"
              />
            </form>
            <Link
              href={buildHref({ impayees: searchParams.impayees === "1" ? undefined : "1" })}
              className={`text-[11px] px-2.5 py-1 rounded-md border ${
                searchParams.impayees === "1"
                  ? "bg-primary-light text-primary border-primary-soft"
                  : "bg-surface-1 text-text-secondary border-border"
              }`}
            >
              Non payées
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[90px_1fr_140px_130px_90px_90px] gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-text-muted bg-surface-1">
          <span>N° commande</span>
          <span>Client</span>
          <span>Service</span>
          <span>Statut</span>
          <span>Prix total</span>
          <span>Paiement</span>
        </div>

        {(commandes ?? []).map((c: any) => (
          <Link
            key={c.id}
            href={`/commandes/${c.id}`}
            className="grid grid-cols-[90px_1fr_140px_130px_90px_90px] gap-2 px-5 py-2.5 items-center text-[12px] border-b border-border last:border-b-0 hover:bg-surface-1"
          >
            <span className="text-primary font-medium text-[11px]">{c.numero_commande}</span>
            <div>
              <div className="font-medium text-text-primary">{c.client_nom}</div>
              <div className="text-text-secondary text-[11px]">{c.quartiers?.nom ?? "—"}</div>
            </div>
            <span className="text-text-secondary text-[11px]">
              {c.service === "lavage_repassage" ? "Lavage + Repassage" : "Lavage"}
            </span>
            <StatusBadge statut={c.statut} />
            <span className="font-medium text-text-primary">
              {(Number(c.prix_service) + Number(c.prix_livraison)).toLocaleString("fr-FR")} F
            </span>
            <span className={`text-[11px] flex items-center gap-1 ${c.paye ? "text-[#3B6D11]" : "text-[#854F0B]"}`}>
              {c.paye ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {c.paye ? "Payé" : "Non payé"}
            </span>
          </Link>
        ))}

        {(!commandes || commandes.length === 0) && (
          <div className="px-5 py-8 text-center text-[12px] text-text-muted">Aucune commande trouvée.</div>
        )}
      </div>
    </>
  );
}
