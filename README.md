# Linclean Service — Espace administrateur

App de gestion des commandes pour le pressing Linclean Service (Next.js 14 + Supabase).

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Une fois créé, ouvre **SQL Editor** → **New query**, colle tout le contenu de `supabase/schema.sql`, puis **Run**
3. Va dans **Project Settings > API** et récupère :
   - `Project URL`
   - `anon public` key
4. Crée tes 2 comptes admin : **Authentication > Users > Add user** (email + mot de passe pour chacun)
5. Vérifie que le bucket `photos-commandes` existe bien dans **Storage** (créé automatiquement par le script SQL, sinon crée-le manuellement en public)

## 2. Configurer le projet en local

```bash
# Copier le fichier d'environnement
cp .env.local.example .env.local
```

Remplis `.env.local` avec ton URL et ta clé Supabase récupérées à l'étape précédente.

Ajoute ton vrai logo dans `public/logo.png` (format carré recommandé, ex: 256x256px).

## 3. Installer et lancer

```bash
npm install
npm run dev
```

L'app est disponible sur [http://localhost:3000](http://localhost:3000) — tu seras redirigé vers `/login`.

## 4. Déployer

Le plus simple : déployer sur [Vercel](https://vercel.com) (gratuit pour ce type de projet).
1. Pousse le projet sur GitHub
2. Importe le repo dans Vercel
3. Ajoute les mêmes variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans les Settings du projet Vercel
4. Déploie

## Structure du projet

```
app/
  login/                    Page de connexion
  (dashboard)/
    layout.tsx               Sidebar + navigation + dark mode
    dashboard/                Tableau de bord (stats, graphique, statuts, quartiers)
    commandes/
      page.tsx                 Liste des commandes + filtres
      nouvelle/                 Formulaire de création de commande
      [id]/                      Détail commande + statut + paiement + export PDF
lib/supabase/                Clients Supabase (browser / server / middleware)
components/                  Composants réutilisables (badges, nav, graphique...)
supabase/schema.sql          Schéma complet à exécuter dans Supabase
```

## Fonctionnalités couvertes

- ✅ Connexion réservée aux 2 admins (Supabase Auth)
- ✅ Dashboard : commandes du jour, en cours, CA jour/semaine/mois, graphique 7 jours, statuts, quartier actif, kg traités
- ✅ Création de commande : numéro auto (CMD-001...), quartier (liste + ajout), service, articles du sac, photo, prix manuels, date/heure auto
- ✅ Liste des commandes avec filtres (statut, date, non payées)
- ✅ Détail commande : mise à jour du statut, date de livraison auto, paiement, export PDF

## Pistes d'évolution (non incluses dans cette v1)

- Statistiques avancées sur une page dédiée (actuellement sur le dashboard)
- Recherche texte libre dans les commandes
- Notifications SMS au client
