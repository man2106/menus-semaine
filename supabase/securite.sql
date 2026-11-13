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
