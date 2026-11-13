-- Propositions de recettes par la famille (à exécuter une fois dans Supabase, SQL Editor)

-- 1. La rubrique « suggestions » est acceptée dans la base
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage|suggestions)(/[A-Za-z0-9_.-]{1,100}){1,2}$');

-- 2. Une clé réservée à la mise à jour automatique (elle ne donne accès qu'aux propositions)
alter table public.secrets add column if not exists cle_robot text;
update public.secrets set cle_robot = '__CLE_ROBOT__' where id = 1;

-- 3. Lire les propositions en attente
create or replace function public.robot_suggestions(cle text) returns setof json
language plpgsql stable security definer set search_path = public as $$
begin
  if cle is null or cle <> (select cle_robot from public.secrets where id = 1) then raise exception 'Clé refusée'; end if;
  return query select json_build_object('chemin', d.path, 'donnees', d.data)
    from public.docs d where d.path like 'suggestions/%' and coalesce(d.data->>'statut','attente') = 'attente'
    order by d.updated_at limit 30;
end $$;

-- 4. Indiquer le résultat : ajoutee (avec l'id de la recette) ou refusee (avec une explication)
create or replace function public.robot_marquer(cle text, chemin text, statut text, recette text default null, note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if cle is null or cle <> (select cle_robot from public.secrets where id = 1) then raise exception 'Clé refusée'; end if;
  if chemin not like 'suggestions/%' or statut not in ('ajoutee','refusee','attente') then raise exception 'Demande invalide'; end if;
  update public.docs set data = data || jsonb_build_object('statut', statut, 'recette', recette, 'note', left(note, 300), 'traite', now())
    where path = chemin;
end $$;

revoke all on function public.robot_suggestions(text) from public;
revoke all on function public.robot_marquer(text, text, text, text, text) from public;
grant execute on function public.robot_suggestions(text) to anon, authenticated;
grant execute on function public.robot_marquer(text, text, text, text, text) to anon, authenticated;
