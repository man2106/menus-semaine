-- =====================================================================
-- Menus de la semaine : base Supabase
-- À exécuter une fois dans Supabase > SQL Editor.
-- Les codes d'accès ne figurent PAS ici : ils sont ajoutés à part
-- (voir la fin du script fourni au propriétaire).
-- =====================================================================

-- Documents partagés (menus, famille, goûts, validations, recettes)
create table if not exists public.docs (
  path        text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- Appareils autorisés : chaque personne qui a saisi le code
create table if not exists public.acces (
  uid        uuid primary key,
  nom        text,
  role       text not null default 'membre' check (role in ('membre','proprio')),
  joined_at  timestamptz not null default now()
);

-- Codes d'accès (illisibles depuis l'application)
create table if not exists public.secrets (
  id            int primary key default 1 check (id = 1),
  code_famille  text not null,
  code_proprio  text not null
);

alter table public.docs    enable row level security;
alter table public.acces   enable row level security;
alter table public.secrets enable row level security;

-- ---------- Fonctions d'accès ----------
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.acces where uid = auth.uid());
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.acces where uid = auth.uid() and role = 'proprio');
$$;

-- Documents réservés au propriétaire
create or replace function public.owner_path(p text) returns boolean
language sql immutable as $$
  select p = 'famille/liste' or p like 'validations/%';
$$;

-- Essais de code ratés (limite contre les essais au hasard)
create table if not exists public.essais (quand timestamptz not null default now());
alter table public.essais enable row level security;

-- Rejoindre la famille avec un code (renvoie null si le code est faux)
create or replace function public.rejoindre(code text, nom text default null) returns text
language plpgsql security definer set search_path = public as $$
declare s public.secrets; r text;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if (select count(*) from public.essais where quand > now() - interval '15 minutes') >= 30 then
    raise exception 'Trop d''essais, réessayez dans un quart d''heure';
  end if;
  select * into s from public.secrets where id = 1;
  if s is null then raise exception 'Codes non configurés'; end if;
  if rejoindre.code = s.code_proprio then r := 'proprio';
  elsif rejoindre.code = s.code_famille then r := 'membre';
  else
    insert into public.essais default values;
    delete from public.essais where quand < now() - interval '1 day';
    return null;
  end if;
  insert into public.acces(uid, nom, role) values (auth.uid(), nullif(trim(rejoindre.nom), ''), r)
  on conflict (uid) do update
    set role = case when public.acces.role = 'proprio' then 'proprio' else excluded.role end,
        nom  = coalesce(excluded.nom, public.acces.nom);
  return (select role from public.acces where uid = auth.uid());
end $$;

-- Choisir son prénom
create or replace function public.definir_nom(nom text) returns void
language sql security definer set search_path = public as $$
  update public.acces set nom = nullif(trim($1), '') where uid = auth.uid();
$$;

-- Mon rôle et mon prénom
create or replace function public.mon_acces() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('role', role, 'nom', nom) from public.acces where uid = auth.uid();
$$;

-- Le propriétaire change le code famille (les appareils déjà connectés restent autorisés)
create or replace function public.changer_code_famille(nouveau text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Réservé au propriétaire'; end if;
  if length(trim(nouveau)) < 6 then raise exception 'Code trop court (6 caractères minimum)'; end if;
  update public.secrets set code_famille = trim(nouveau) where id = 1;
end $$;

-- Le propriétaire lit le code famille actuel (pour le lien d'invitation)
create or replace function public.code_famille() returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Réservé au propriétaire'; end if;
  return (select code_famille from public.secrets where id = 1);
end $$;

-- Le propriétaire retire l'accès d'un appareil
create or replace function public.retirer_acces(cible uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Réservé au propriétaire'; end if;
  delete from public.acces where uid = cible and role <> 'proprio';
end $$;

-- ---------- Règles d'accès ----------
drop policy if exists docs_lire     on public.docs;
drop policy if exists docs_creer    on public.docs;
drop policy if exists docs_modifier on public.docs;
drop policy if exists docs_effacer  on public.docs;
create policy docs_lire     on public.docs for select to authenticated using (public.is_member());
create policy docs_creer    on public.docs for insert to authenticated
  with check (public.is_member() and (public.is_owner() or not public.owner_path(path)));
create policy docs_modifier on public.docs for update to authenticated
  using (public.is_member() and (public.is_owner() or not public.owner_path(path)))
  with check (public.is_member() and (public.is_owner() or not public.owner_path(path)));
create policy docs_effacer  on public.docs for delete to authenticated using (public.is_owner());

drop policy if exists acces_lire on public.acces;
create policy acces_lire on public.acces for select to authenticated using (public.is_member());

-- ---------- Droits ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.docs to authenticated;
grant select on public.acces to authenticated;
revoke all on public.secrets from anon, authenticated;
revoke all on public.essais from anon, authenticated;
grant execute on function public.is_member(), public.is_owner(), public.owner_path(text),
  public.rejoindre(text, text), public.definir_nom(text), public.mon_acces(),
  public.changer_code_famille(text), public.code_famille(), public.retirer_acces(uuid) to authenticated;

-- ---------- Temps réel ----------
alter table public.docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
-- Dernière connexion de chaque appareil (à exécuter une fois dans SQL Editor)
alter table public.acces add column if not exists vu_le timestamptz;

create or replace function public.signaler_visite() returns void
language sql security definer set search_path = public as $$
  update public.acces set vu_le = now() where uid = auth.uid();
$$;

grant execute on function public.signaler_visite() to authenticated;

-- Renforcement de la base (à exécuter une fois dans Supabase, SQL Editor ; peut être relancé sans risque)

-- 1. Seules les rubriques de l'application sont acceptées, avec des chemins courts et propres
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage)(/[A-Za-z0-9_.-]{1,100}){1,2}$');

-- 2. Un document ne peut pas dépasser 400 Ko (une photo de recette comprise)
alter table public.docs drop constraint if exists docs_taille_max;
alter table public.docs add constraint docs_taille_max check (pg_column_size(data) <= 400000);

-- 3. L'auteur et la date de chaque modification sont fixés par le serveur, pas par l'appareil
create or replace function public.docs_auteur() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists docs_auteur on public.docs;
create trigger docs_auteur before insert or update on public.docs
  for each row execute function public.docs_auteur();

-- 4. Prénoms courts et sans balises, quelle que soit la façon dont ils sont enregistrés
create or replace function public.acces_nom_propre() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nom is not null then
    new.nom := nullif(left(trim(regexp_replace(new.nom, '[<>&"''`]', '', 'g')), 30), '');
  end if;
  return new;
end $$;
drop trigger if exists acces_nom_propre on public.acces;
create trigger acces_nom_propre before insert or update on public.acces
  for each row execute function public.acces_nom_propre();
update public.acces set nom = nom where nom is not null;

-- 5. Les comptes anonymes qui n'ont jamais rejoint la famille ne voient rien (rappel : déjà le cas) ;
--    on retire aussi les droits inutiles sur la table des essais de code.
revoke all on public.essais from anon, authenticated;
-- Photos de tickets de caisse (à exécuter une fois dans Supabase, SQL Editor ; peut être relancé sans risque)

-- 1. La rubrique « tickets » est acceptée dans la base
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage|suggestions|tickets)(/[A-Za-z0-9_.-]{1,100}){1,2}$');

-- 2. La mise à jour automatique lit les photos de tickets en attente (même clé que pour les propositions)
create or replace function public.robot_tickets(cle text) returns setof json
language plpgsql stable security definer set search_path = public as $$
begin
  if cle is null or cle <> (select cle_robot from public.secrets where id = 1) then raise exception 'Clé refusée'; end if;
  return query select json_build_object('chemin', d.path, 'donnees', d.data)
    from public.docs d where d.path like 'tickets/%' and coalesce(d.data->>'statut','attente') = 'attente'
    order by d.updated_at limit 20;
end $$;

-- 3. Elle y inscrit le résultat de la lecture (total, magasin, nombre d'articles…) et peut retirer la photo une fois lue
create or replace function public.robot_ticket_resultat(cle text, chemin text, statut text, resultat jsonb, garder_photo boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if cle is null or cle <> (select cle_robot from public.secrets where id = 1) then raise exception 'Clé refusée'; end if;
  if chemin not like 'tickets/%' or statut not in ('analyse','illisible','attente') then raise exception 'Demande invalide'; end if;
  update public.docs set data = (case when garder_photo then data else data - 'photo' end)
      || jsonb_build_object('statut', statut, 'resultat', coalesce(resultat, '{}'::jsonb), 'traite', now())
    where path = chemin;
end $$;

revoke all on function public.robot_tickets(text) from public;
revoke all on function public.robot_ticket_resultat(text, text, text, jsonb, boolean) from public;
grant execute on function public.robot_tickets(text) to anon, authenticated;
grant execute on function public.robot_ticket_resultat(text, text, text, jsonb, boolean) to anon, authenticated;

-- ===== Contrôle de sécurité (14/11/2026) =====
-- 2. Chemins de documents : chaque partie doit commencer par une lettre, un chiffre, « _ » ou « - » (plus de « .. »)
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage|suggestions|tickets)(/[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}){1,2}$');

-- 3. Un nouveau code famille doit faire au moins 10 caractères (plus difficile à deviner)
create or replace function public.changer_code_famille(nouveau text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Réservé au propriétaire'; end if;
  if length(trim(nouveau)) < 10 then raise exception 'Code trop court (10 caractères minimum)'; end if;
  update public.secrets set code_famille = trim(nouveau) where id = 1;
end $$;

-- 4. Ménage : comptes anonymes de plus de 7 jours qui n'ont jamais rejoint la famille (appareils qui ont seulement ouvert la page)
delete from auth.users u
 where u.is_anonymous
   and u.created_at < now() - interval '7 days'
   and not exists (select 1 from public.acces a where a.uid = u.id);
