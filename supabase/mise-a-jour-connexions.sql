-- Dernière connexion de chaque appareil (à exécuter une fois dans SQL Editor)
alter table public.acces add column if not exists vu_le timestamptz;

create or replace function public.signaler_visite() returns void
language sql security definer set search_path = public as $$
  update public.acces set vu_le = now() where uid = auth.uid();
$$;

grant execute on function public.signaler_visite() to authenticated;
