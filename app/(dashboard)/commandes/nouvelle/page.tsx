import { createClient } from "@/lib/supabase/server";
import NouvelleCommandeForm from "./NouvelleCommandeForm";

export default async function NouvelleCommandePage() {
  const supabase = createClient();
  const { data: quartiers } = await supabase.from("quartiers").select("id, nom").order("nom");

  return (
    <>
      <h1 className="text-lg font-medium text-text-primary">Nouvelle commande</h1>
      <NouvelleCommandeForm quartiers={quartiers ?? []} />
    </>
  );
}
