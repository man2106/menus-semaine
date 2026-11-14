-- Contrôle de sécurité du 14/11/2026 (à exécuter une fois dans Supabase, SQL Editor ; peut être relancé sans risque)

-- 1. Retirer les documents et les accès de test créés pendant le contrôle
delete from public.docs where path in ('famille/../x', 'retours/test-auteur', 'retours/test-taille');
delete from public.acces where role = 'membre' and (nom like 'Claude%' or nom like 'img src%');

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
