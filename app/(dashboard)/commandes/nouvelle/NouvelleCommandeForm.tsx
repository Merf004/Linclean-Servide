"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Quartier = { id: string; nom: string };
type Article = { designation: string; quantite: number };

export default function NouvelleCommandeForm({ quartiers }: { quartiers: Quartier[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [clientNom, setClientNom] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [quartierId, setQuartierId] = useState("");
  const [nouveauQuartier, setNouveauQuartier] = useState("");
  const [service, setService] = useState<"lavage" | "lavage_repassage">("lavage");
  const [articles, setArticles] = useState<Article[]>([{ designation: "", quantite: 1 }]);
  const [prixService, setPrixService] = useState("");
  const [prixLivraison, setPrixLivraison] = useState("");
  const [poidsKg, setPoidsKg] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateArticle(i: number, field: keyof Article, value: string | number) {
    setArticles((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalQuartierId = quartierId;

      if (!finalQuartierId && nouveauQuartier.trim()) {
        const { data: q, error: qErr } = await supabase
          .from("quartiers")
          .insert({ nom: nouveauQuartier.trim() })
          .select("id")
          .single();
        if (qErr) throw qErr;
        finalQuartierId = q.id;
      }

      let photoUrl: string | null = null;
      if (photo) {
        const path = `${Date.now()}-${photo.name}`;
        const { error: upErr } = await supabase.storage.from("photos-commandes").upload(path, photo);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("photos-commandes").getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: commande, error: cErr } = await supabase
        .from("commandes")
        .insert({
          client_nom: clientNom,
          client_contact: clientContact,
          quartier_id: finalQuartierId || null,
          service,
          prix_service: Number(prixService) || 0,
          prix_livraison: Number(prixLivraison) || 0,
          poids_kg: poidsKg ? Number(poidsKg) : null,
          photo_url: photoUrl,
          created_by: user?.id,
        })
        .select("id")
        .single();

      if (cErr) throw cErr;

      const validArticles = articles.filter((a) => a.designation.trim());
      if (validArticles.length > 0) {
        const { error: artErr } = await supabase.from("commande_articles").insert(
          validArticles.map((a) => ({
            commande_id: commande.id,
            designation: a.designation.trim(),
            quantite: a.quantite,
          }))
        );
        if (artErr) throw artErr;
      }

      router.push(`/commandes/${commande.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-2 border border-border rounded-xl p-6 flex flex-col gap-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom du client">
          <input required value={clientNom} onChange={(e) => setClientNom(e.target.value)} className="input" />
        </Field>
        <Field label="Contact (téléphone)">
          <input required value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Quartier">
          <select
            value={quartierId}
            onChange={(e) => setQuartierId(e.target.value)}
            className="input"
          >
            <option value="">— Choisir un quartier —</option>
            {quartiers.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nom}
              </option>
            ))}
          </select>
          {!quartierId && (
            <input
              placeholder="Ou nouveau quartier..."
              value={nouveauQuartier}
              onChange={(e) => setNouveauQuartier(e.target.value)}
              className="input mt-2"
            />
          )}
        </Field>

        <Field label="Service">
          <select value={service} onChange={(e) => setService(e.target.value as any)} className="input">
            <option value="lavage">Lavage seul</option>
            <option value="lavage_repassage">Lavage + Repassage</option>
          </select>
        </Field>
      </div>

      <Field label="Contenu du sac">
        <div className="flex flex-col gap-2">
          {articles.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="ex: Pantalon"
                value={a.designation}
                onChange={(e) => updateArticle(i, "designation", e.target.value)}
                className="input flex-1"
              />
              <input
                type="number"
                min={1}
                value={a.quantite}
                onChange={(e) => updateArticle(i, "quantite", Number(e.target.value))}
                className="input w-20"
              />
              <button
                type="button"
                onClick={() => setArticles((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-text-muted px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setArticles((prev) => [...prev, { designation: "", quantite: 1 }])}
            className="text-[12px] text-primary text-left"
          >
            + Ajouter un article
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Prix du service (FCFA)">
          <input type="number" required value={prixService} onChange={(e) => setPrixService(e.target.value)} className="input" />
        </Field>
        <Field label="Ramassage + livraison (FCFA)">
          <input type="number" value={prixLivraison} onChange={(e) => setPrixLivraison(e.target.value)} className="input" />
        </Field>
        <Field label="Poids (kg)">
          <input type="number" step="0.1" value={poidsKg} onChange={(e) => setPoidsKg(e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="Photo du linge à la collecte">
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-[12px]" />
      </Field>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white rounded-lg py-2.5 text-[13px] font-medium disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer la commande"}
      </button>

      <style jsx global>{`
        .input {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          background: var(--surface-0);
          color: var(--text-primary);
          outline: none;
          width: 100%;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #b5d4f4;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}
