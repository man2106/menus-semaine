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
