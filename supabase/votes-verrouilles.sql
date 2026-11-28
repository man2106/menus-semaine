-- =====================================================================
-- Votes verrouillés : un vote enregistré ne peut plus être changé
-- (à exécuter À LA MAIN, une seule fois, par le propriétaire)
--
-- Ce fichier n'est jamais lancé automatiquement.
--
-- Comment l'exécuter :
--   1. Ouvrir le projet sur supabase.com, puis « SQL Editor » (menu de gauche).
--   2. Cliquer « New query », copier-coller TOUT ce fichier, puis « Run ».
--   3. Vérifier qu'il n'y a pas de message d'erreur en rouge.
--   4. Faire une sauvegarde avant (Plus > Réglages > Télécharger une sauvegarde) par prudence.
-- Il peut être relancé sans risque.
--
-- À exécuter AVANT (ou en même temps que) la mise en ligne de la nouvelle version de l'application :
-- elle écrit les votes dans deux nouvelles rubriques, « avis » et « envies », que ce script autorise.
-- Sans lui, l'application refuse d'enregistrer les « J'aime / Pas pour moi » et les envies du sondage
-- (message « Le serveur a refusé le choix »). Les avis sur les repas (rubrique « retours ») marchent déjà.
--
-- Ce que fait ce fichier :
--   1. Accepte les nouvelles rubriques « avis » (un document par personne et par plat : avis/<plat>_<prénom>)
--      et « envies » (envies/<plat>_<prénom>), en gardant toutes les rubriques déjà utilisées.
--   2. Chacun ne peut créer un vote que sous son propre prénom (le propriétaire peut le faire pour un autre,
--      par exemple pour un enfant sans téléphone). Même règle que pour les avis sur les repas.
--   3. Verrou : un vote existant (retours/…, avis/…, envies/…) ne peut plus être modifié par un membre.
--      Seul le propriétaire peut le corriger ou l'effacer (bouton « Réinitialiser » / « annuler » de l'application).
--   4. Les anciens votes (champ « avis » de famille/gouts, champ « envies » de sondage/<prénom>) ne peuvent plus
--      être retirés ni changés par un membre, mais on peut toujours y ajouter. L'application les lit toujours
--      et les réunit avec les nouveaux : aucun ancien vote n'est perdu.
-- =====================================================================

-- 0. Prénom de la personne connectée sur cet appareil (déjà créé par retours-par-personne.sql ; refait ici pour que ce fichier se suffise)
create or replace function public.mon_nom() returns text
language sql stable security definer set search_path = public as $$
  select nom from public.acces where uid = auth.uid();
$$;
grant execute on function public.mon_nom() to authenticated;

-- 1. Rubriques acceptées dans la base (toutes celles déjà utilisées, plus « avis » et « envies »)
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage|suggestions|tickets|platsphotos|avis|envies)(/[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}){1,2}$') not valid;  -- not valid : les documents déjà présents ne sont pas revérifiés

-- 2. Un vote ne peut être créé que sous son propre prénom, sauf par le propriétaire
drop policy if exists docs_creer on public.docs;
create policy docs_creer on public.docs for insert to authenticated
  with check (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path !~ '^(retours|avis|envies)/' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  );

drop policy if exists docs_modifier on public.docs;
create policy docs_modifier on public.docs for update to authenticated
  using (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path !~ '^(retours|avis|envies)/' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  )
  with check (
    public.is_member() and (public.is_owner() or not public.owner_path(path))
    and (path !~ '^(retours|avis|envies)/' or public.is_owner() or trim(data->>'nom') = public.mon_nom())
  );

-- 3. Le verrou : se déclenche avant chaque modification ou suppression d'un document
create or replace function public.docs_verrou_votes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Le propriétaire, l'éditeur SQL de Supabase et les clés de service (pas d'utilisateur connecté) ne sont pas bloqués
  if auth.uid() is null or public.is_owner() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- Un vote existant ne se modifie pas et ne s'efface pas
  if old.path ~ '^(retours|avis|envies)/' then
    raise exception 'Ce vote est déjà enregistré : il ne peut plus être modifié.' using errcode = '42501';
  end if;

  -- Anciens votes rangés dans un document partagé : on peut en ajouter, pas en retirer ni en changer
  if tg_op = 'UPDATE' then
    if old.path like 'sondage/%'
       and not (coalesce(new.data->'envies', '{}'::jsonb) @> coalesce(old.data->'envies', '{}'::jsonb)) then
      raise exception 'Vos réponses au sondage sont déjà enregistrées : elles ne peuvent plus être modifiées.' using errcode = '42501';
    end if;
    if old.path = 'famille/gouts'
       and not (coalesce(new.data->'avis', '{}'::jsonb) @> coalesce(old.data->'avis', '{}'::jsonb)) then
      raise exception 'Les avis « J''aime / Pas pour moi » déjà enregistrés ne peuvent plus être modifiés.' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists docs_verrou_votes on public.docs;
create trigger docs_verrou_votes before update or delete on public.docs
  for each row execute function public.docs_verrou_votes();

-- 4. Contrôle (à lancer à part si vous voulez vérifier) : liste des votes enregistrés par rubrique
--    select split_part(path, '/', 1) as rubrique, count(*) from public.docs
--     where path ~ '^(retours|avis|envies)/' group by 1;
