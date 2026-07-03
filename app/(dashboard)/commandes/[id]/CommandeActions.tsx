"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUTS } from "@/components/StatusBadge";

export default function CommandeActions({ commande, articles }: { commande: any; articles: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [statut, setStatut] = useState(commande.statut);
  const [paye, setPaye] = useState(commande.paye);
  const [loading, setLoading] = useState(false);

  async function updateStatut(next: string) {
    setLoading(true);
    setStatut(next);
    await supabase.from("commandes").update({ statut: next }).eq("id", commande.id);
    setLoading(false);
    router.refresh();
  }

  async function togglePaye() {
    setLoading(true);
    const next = !paye;
    setPaye(next);
    await supabase.from("commandes").update({ paye: next }).eq("id", commande.id);
    setLoading(false);
    router.refresh();
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const total = Number(commande.prix_service) + Number(commande.prix_livraison);

    doc.setFontSize(16);
    doc.text("Linclean Service", 14, 18);
    doc.setFontSize(10);
    doc.text("Fiche de commande", 14, 25);

    doc.setFontSize(12);
    doc.text(`N° commande : ${commande.numero_commande}`, 14, 38);
    doc.text(`Statut : ${STATUTS[commande.statut]?.label ?? commande.statut}`, 14, 45);

    doc.text(`Client : ${commande.client_nom}`, 14, 56);
    doc.text(`Contact : ${commande.client_contact}`, 14, 63);
    doc.text(`Quartier : ${commande.quartiers?.nom ?? "—"}`, 14, 70);
    doc.text(
      `Service : ${commande.service === "lavage_repassage" ? "Lavage + Repassage" : "Lavage seul"}`,
      14,
      77
    );

    doc.text("Contenu du sac :", 14, 90);
    let y = 97;
    articles.forEach((a) => {
      doc.text(`- ${a.designation} x${a.quantite}`, 18, y);
      y += 6;
    });

    y += 4;
    doc.text(`Prix du service : ${Number(commande.prix_service).toLocaleString("fr-FR")} F`, 14, y);
    y += 7;
    doc.text(`Ramassage + livraison : ${Number(commande.prix_livraison).toLocaleString("fr-FR")} F`, 14, y);
    y += 7;
    doc.setFontSize(13);
    doc.text(`Total : ${total.toLocaleString("fr-FR")} F`, 14, y);
    y += 7;
    doc.setFontSize(12);
    doc.text(`Paiement : ${commande.paye ? "Payé" : "Non payé"}`, 14, y);

    y += 10;
    doc.setFontSize(9);
    doc.text(`Collecté le ${new Date(commande.date_collecte).toLocaleString("fr-FR")}`, 14, y);
    if (commande.date_livraison) {
      y += 6;
      doc.text(`Livré le ${new Date(commande.date_livraison).toLocaleString("fr-FR")}`, 14, y);
    }

    doc.save(`${commande.numero_commande}.pdf`);
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="text-[12px] font-medium text-text-secondary mb-1.5">Statut de la commande</div>
        <select
          value={statut}
          disabled={loading}
          onChange={(e) => updateStatut(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-surface-0 text-text-primary"
        >
          {Object.entries(STATUTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-text-secondary">Paiement</span>
        <button
          onClick={togglePaye}
          disabled={loading}
          className={`text-[12px] px-3 py-1.5 rounded-lg font-medium ${
            paye ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#FAEEDA] text-[#854F0B]"
          }`}
        >
          {paye ? "✓ Payé" : "⏱ Non payé — marquer payé"}
        </button>
      </div>

      {commande.date_livraison && (
        <div className="text-[11px] text-text-muted">
          Livré le {new Date(commande.date_livraison).toLocaleString("fr-FR")}
        </div>
      )}

      <button
        onClick={downloadPdf}
        className="border border-border rounded-lg py-2 text-[13px] font-medium text-text-primary hover:bg-surface-1"
      >
        📄 Télécharger la fiche PDF
      </button>
    </div>
  );
}
