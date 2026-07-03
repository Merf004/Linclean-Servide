-- ============================================================
-- Linclean Service - Schéma de base de données Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extension pour les UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Table : quartiers
-- ------------------------------------------------------------
create table if not exists quartiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  created_at timestamptz not null default now()
);

insert into quartiers (nom) values
  ('Mélen'), ('Obili'), ('Damas'), ('Nsimeyong'), ('Biyem-Assi'), ('Emana')
on conflict (nom) do nothing;

-- ------------------------------------------------------------
-- Enum : statut de commande
-- ------------------------------------------------------------
do $$ begin
  create type statut_commande as enum ('en_attente', 'collecte', 'en_traitement', 'pret', 'livre');
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- Enum : type de service
-- ------------------------------------------------------------
do $$ begin
  create type type_service as enum ('lavage', 'lavage_repassage');
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- Séquence pour numéro de commande auto (CMD-001, CMD-002...)
-- ------------------------------------------------------------
create sequence if not exists commande_numero_seq start 1;

create or replace function generate_numero_commande()
returns trigger as $$
begin
  new.numero_commande := 'CMD-' || lpad(nextval('commande_numero_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Table : commandes
-- ------------------------------------------------------------
create table if not exists commandes (
  id uuid primary key default gen_random_uuid(),
  numero_commande text unique,
  client_nom text not null,
  client_contact text not null,
  quartier_id uuid references quartiers(id),
  service type_service not null,
  prix_service numeric(10,2) not null default 0,
  prix_livraison numeric(10,2) not null default 0,
  poids_kg numeric(6,2),
  prix_kg numeric(10,2),
  photo_url text,
  statut statut_commande not null default 'en_attente',
  paye boolean not null default false,
  date_collecte timestamptz not null default now(),
  date_livraison timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_numero_commande on commandes;
create trigger trg_numero_commande
  before insert on commandes
  for each row
  when (new.numero_commande is null)
  execute function generate_numero_commande();

-- Auto-remplir date_livraison quand le statut passe à 'livre'
create or replace function set_date_livraison()
returns trigger as $$
begin
  if new.statut = 'livre' and old.statut is distinct from 'livre' then
    new.date_livraison := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_date_livraison on commandes;
create trigger trg_date_livraison
  before update on commandes
  for each row
  execute function set_date_livraison();

-- ------------------------------------------------------------
-- Table : articles d'une commande (contenu du sac)
-- ------------------------------------------------------------
create table if not exists commande_articles (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes(id) on delete cascade,
  designation text not null,   -- ex: "Pantalon", "T-shirt"
  quantite integer not null default 1
);

-- ------------------------------------------------------------
-- Prix total calculé (vue pratique)
-- ------------------------------------------------------------
create or replace view commandes_detail as
select
  c.*,
  q.nom as quartier_nom,
  (c.prix_service + c.prix_livraison) as prix_total
from commandes c
left join quartiers q on q.id = c.quartier_id;

-- ------------------------------------------------------------
-- Row Level Security : seuls les utilisateurs authentifiés
-- (les 2 admins) peuvent lire/écrire
-- ------------------------------------------------------------
alter table quartiers enable row level security;
alter table commandes enable row level security;
alter table commande_articles enable row level security;

drop policy if exists "auth read quartiers" on quartiers;
create policy "auth read quartiers" on quartiers for select using (auth.role() = 'authenticated');
drop policy if exists "auth write quartiers" on quartiers;
create policy "auth write quartiers" on quartiers for insert with check (auth.role() = 'authenticated');

drop policy if exists "auth all commandes" on commandes;
create policy "auth all commandes" on commandes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth all commande_articles" on commande_articles;
create policy "auth all commande_articles" on commande_articles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Storage : bucket pour les photos de linge
-- (à créer aussi manuellement si besoin : Storage > New bucket "photos-commandes", public)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos-commandes', 'photos-commandes', true)
on conflict (id) do nothing;

drop policy if exists "auth upload photos" on storage.objects;
create policy "auth upload photos" on storage.objects
  for insert with check (bucket_id = 'photos-commandes' and auth.role() = 'authenticated');

drop policy if exists "public read photos" on storage.objects;
create policy "public read photos" on storage.objects
  for select using (bucket_id = 'photos-commandes');

-- ============================================================
-- Fin du schéma. Pense à créer tes 2 comptes admin dans :
-- Supabase Dashboard > Authentication > Users > Add user
-- ============================================================
