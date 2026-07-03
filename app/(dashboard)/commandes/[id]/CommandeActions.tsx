"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STATUTS } from "@/components/StatusBadge";

function formatFCFA(n: number) {
  const rounded = Math.round(n);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
}

async function loadImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Logo introuvable :", url, res.status);
      return null;
    }
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const match = dataUrl.match(/^data:image\/(\w+);base64,/);
    const format = match ? match[1].toUpperCase() : "PNG";
    return { data: dataUrl, format: format === "JPG" ? "JPEG" : format };
  } catch (e) {
    console.error("Erreur de chargement du logo :", e);
    return null;
  }
}

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

    const PRIMARY: [number, number, number] = [24, 95, 165]; // #185FA5
    const DARK: [number, number, number] = [26, 29, 33];
    const MUTED: [number, number, number] = [110, 116, 122];
    const LIGHT_BG: [number, number, number] = [247, 248, 250];
    const pageWidth = 210;
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    const statutInfo = STATUTS[commande.statut] ?? STATUTS.en_attente;
    const total = Number(commande.prix_service) + Number(commande.prix_livraison);

    // ---------- En-tête ----------
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, 36, "F");

    const logo = await loadImageAsBase64("/logo.png");
    if (logo) {
      try {
        doc.addImage(logo.data, logo.format, marginX, 7, 22, 22);
      } catch (e) {
        console.error("Impossible d'insérer le logo dans le PDF :", e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("LINCLEAN SERVICE", logo ? marginX + 28 : marginX, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Fiche de commande", logo ? marginX + 28 : marginX, 25);

    // Badge numéro de commande (haut droit)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - marginX - 42, 10, 42, 16, 3, 3, "F");
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(commande.numero_commande, pageWidth - marginX - 21, 20, { align: "center" });

    let y = 50;

    // ---------- Badge statut + paiement ----------
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.roundedRect(marginX, y - 6, 46, 9, 2, 2, "S");
    doc.text(statutInfo.label.toUpperCase(), marginX + 23, y, { align: "center" });

    const payLabel = commande.paye ? "PAYÉ" : "NON PAYÉ";
    const payColor: [number, number, number] = commande.paye ? [59, 109, 17] : [133, 79, 11];
    doc.setTextColor(...payColor);
    doc.roundedRect(marginX + 50, y - 6, 34, 9, 2, 2, "S");
    doc.text(payLabel, marginX + 67, y, { align: "center" });

    y += 16;

    // ---------- Informations client ----------
    const sectionTitle = (label: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text(label, marginX, y);
      doc.setDrawColor(...PRIMARY);
      doc.setLineWidth(0.6);
      doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
      y += 9;
    };

    const infoRow = (label: string, value: string, shaded: boolean) => {
      if (shaded) {
        doc.setFillColor(...LIGHT_BG);
        doc.rect(marginX, y - 5, contentWidth, 8, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text(label, marginX + 3, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(value, pageWidth - marginX - 3, y, { align: "right" });
      y += 8;
    };

    sectionTitle("Informations client");
    infoRow("Nom du client", commande.client_nom, true);
    infoRow("Contact", commande.client_contact, false);
    infoRow("Quartier", commande.quartiers?.nom ?? "—", true);
    infoRow(
      "Service",
      commande.service === "lavage_repassage" ? "Lavage + Repassage" : "Lavage seul",
      false
    );

    y += 6;

    // ---------- Contenu du sac ----------
    sectionTitle("Contenu du sac");

    if (articles.length > 0) {
      doc.setFillColor(...PRIMARY);
      doc.rect(marginX, y - 5, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ARTICLE", marginX + 3, y);
      doc.text("QUANTITÉ", pageWidth - marginX - 3, y, { align: "right" });
      y += 8;

      articles.forEach((a, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(...LIGHT_BG);
          doc.rect(marginX, y - 5, contentWidth, 8, "F");
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...DARK);
        doc.text(a.designation, marginX + 3, y);
        doc.text(`x${a.quantite}`, pageWidth - marginX - 3, y, { align: "right" });
        y += 8;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text("Aucun article renseigné.", marginX, y);
      y += 8;
    }

    y += 8;

    // ---------- Facturation ----------
    sectionTitle("Facturation");
    infoRow("Prix du service", formatFCFA(Number(commande.prix_service)), true);
    if (commande.prix_kg && commande.poids_kg) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `(${commande.poids_kg} kg x ${formatFCFA(Number(commande.prix_kg))}/kg)`,
        marginX + 3,
        y - 1
      );
      y += 5;
    }
    infoRow("Ramassage + livraison", formatFCFA(Number(commande.prix_livraison)), false);

    y += 4;
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(marginX, y - 6, contentWidth, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", marginX + 5, y + 2);
    doc.setFontSize(14);
    doc.text(formatFCFA(total), pageWidth - marginX - 5, y + 2, { align: "right" });

    y += 24;

    // ---------- Dates ----------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Collecté le ${new Date(commande.date_collecte).toLocaleString("fr-FR")}`, marginX, y);
    if (commande.date_livraison) {
      y += 6;
      doc.text(`Livré le ${new Date(commande.date_livraison).toLocaleString("fr-FR")}`, marginX, y);
    }

    // ---------- Pied de page ----------
    const footerY = 280;
    doc.setDrawColor(230, 232, 235);
    doc.setLineWidth(0.4);
    doc.line(marginX, footerY - 8, pageWidth - marginX, footerY - 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Merci de votre confiance — Linclean Service", pageWidth / 2, footerY, { align: "center" });

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
          className={`text-[12px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
            paye ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#FAEEDA] text-[#854F0B]"
          }`}
        >
          {paye ? <CheckCircle2 size={14} /> : <Clock size={14} />}
          {paye ? "Payé" : "Non payé — marquer payé"}
        </button>
      </div>

      {commande.date_livraison && (
        <div className="text-[11px] text-text-muted">
          Livré le {new Date(commande.date_livraison).toLocaleString("fr-FR")}
        </div>
      )}

      <button
        onClick={downloadPdf}
        className="border border-border rounded-lg py-2 text-[13px] font-medium text-text-primary hover:bg-surface-1 flex items-center justify-center gap-2"
      >
        <FileText size={15} /> Télécharger la fiche PDF
      </button>
    </div>
  );
}