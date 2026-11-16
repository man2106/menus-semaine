-- Retours sur les repas : chacun ne peut noter que pour lui-même (le propriétaire peut noter pour tous).
-- À exécuter une fois dans Supabase, SQL Editor ; peut être relancé sans risque.

-- 1. Prénom de la personne connectée sur cet appareil (lu dans la table des accès)
create or replace function public.mon_nom() returns text
language sql stable security definer set search_path = public as $$
  select nom from public.acces where uid = auth.uid();
$$;
grant execute on function public.mon_nom() to authenticated;

-- 2. Un avis « retours/… » ne peut être écrit que par son auteur (le prénom doit être le sien), sauf le propriétaire
drop policy if exists docs_creer on public.docs;
create policy docs_creer on public.docs for insert to authenticated
  with check (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path not like 'retours/%' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  );

drop policy if exists docs_modifier on public.docs;
create policy docs_modifier on public.docs for update to authenticated
  using (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path not like 'retours/%' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  )
  with check (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path not like 'retours/%' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  );
