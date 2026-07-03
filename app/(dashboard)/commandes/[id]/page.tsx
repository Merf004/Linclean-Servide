import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommandeActions from "./CommandeActions";
import StatusBadge from "@/components/StatusBadge";

export default async function CommandeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: commande } = await supabase
    .from("commandes")
    .select("*, quartiers(nom)")
    .eq("id", params.id)
    .single();

  if (!commande) notFound();

  const { data: articles } = await supabase
    .from("commande_articles")
    .select("*")
    .eq("commande_id", params.id);

  const prixTotal = Number(commande.prix_service) + Number(commande.prix_livraison);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">{commande.numero_commande}</h1>
          <p className="text-[12px] text-text-muted">
            Collecté le {new Date(commande.date_collecte).toLocaleString("fr-FR")}
          </p>
        </div>
        <StatusBadge statut={commande.statut} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="text-[13px] font-medium text-text-primary mb-3">Informations client</div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <Info label="Nom" value={commande.client_nom} />
              <Info label="Contact" value={commande.client_contact} />
              <Info label="Quartier" value={commande.quartiers?.nom ?? "—"} />
              <Info
                label="Service"
                value={commande.service === "lavage_repassage" ? "Lavage + Repassage" : "Lavage seul"}
              />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="text-[13px] font-medium text-text-primary mb-3">Contenu du sac</div>
            {articles && articles.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {articles.map((a) => (
                  <li key={a.id} className="flex justify-between text-[13px] text-text-secondary">
                    <span>{a.designation}</span>
                    <span className="text-text-primary font-medium">×{a.quantite}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-text-muted">Aucun article renseigné.</p>
            )}
          </div>

          {commande.photo_url && (
            <div className="bg-surface-2 border border-border rounded-xl p-5">
              <div className="text-[13px] font-medium text-text-primary mb-3">Photo à la collecte</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={commande.photo_url} alt="Photo du linge" className="rounded-lg max-h-80 object-cover" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="text-[13px] font-medium text-text-primary mb-3">Facturation</div>
            <Info
              label="Prix du service"
              value={`${Number(commande.prix_service).toLocaleString("fr-FR")} F`}
            />
            {commande.prix_kg && commande.poids_kg && (
              <Info
                label="Détail"
                value={`${commande.poids_kg} kg × ${Number(commande.prix_kg).toLocaleString("fr-FR")} F/kg`}
              />
            )}
            <Info label="Ramassage + livraison" value={`${Number(commande.prix_livraison).toLocaleString("fr-FR")} F`} />
            <div className="border-t border-border my-2" />
            <Info label="Total" value={`${prixTotal.toLocaleString("fr-FR")} F`} bold />
            {commande.poids_kg && <Info label="Poids" value={`${commande.poids_kg} kg`} />}
          </div>

          <CommandeActions commande={commande} articles={articles ?? []} />
        </div>
      </div>
    </>
  );
}

function Info({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[13px] py-0.5">
      <span className="text-text-muted">{label}</span>
      <span className={bold ? "font-semibold text-text-primary" : "font-medium text-text-primary"}>{value}</span>
    </div>
  );
}
