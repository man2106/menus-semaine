-- =====================================================================
-- Sécurité des codes d'invitation (à exécuter À LA MAIN, une seule fois)
--
-- Ce fichier n'est jamais lancé automatiquement.
--
-- Comment l'exécuter :
--   1. Ouvrir le projet sur supabase.com, puis « SQL Editor » (menu de gauche).
--   2. Cliquer « New query », copier-coller TOUT ce fichier, puis « Run ».
--   3. Vérifier qu'il n'y a pas de message d'erreur en rouge.
--   4. Tester dans l'application : un appareil neuf doit pouvoir rejoindre
--      avec le bon code, et un mauvais code doit être refusé.
-- Il peut être relancé sans risque (les codes déjà transformés ne sont pas retouchés).
-- Avant de commencer, faire une sauvegarde (Database > Backups) par prudence.
--
-- Ce que fait ce fichier :
--   a) Limite les essais de code : 10 essais ratés par personne (auth.uid())
--      en 15 minutes, et 100 essais ratés au total en 15 minutes.
--      La limite par personne seule ne suffit pas : quelqu'un peut créer
--      plusieurs comptes anonymes, d'où la limite globale en plus.
--   b) Garde les codes sous forme de hash (bcrypt, via pgcrypto) et compare
--      les hash. Les codes en clair actuels sont convertis, puis effacés
--      pour le code propriétaire.
--
-- À savoir :
--   - L'application (js/partage.js) ne change pas : mêmes fonctions
--     rejoindre(code, nom), changer_code_famille(nouveau), code_famille().
--   - Le lien d'invitation affiché au propriétaire contient le code famille.
--     Pour que ce lien continue de marcher, le code famille reste AUSSI
--     en clair dans la colonne secrets.code_famille (table illisible depuis
--     l'application). Pour le supprimer vraiment, voir l'étape 6 en bas :
--     le propriétaire devra alors noter le code lui-même, et le lien
--     d'invitation affichera un code vide.
--   - Le code propriétaire n'est jamais relu par l'application : il n'est
--     plus stocké en clair du tout après ce script.
-- =====================================================================

-- 1. Outil de hash (déjà présent sur Supabase, on s'assure juste qu'il est actif)
create extension if not exists pgcrypto with schema extensions;

-- 2. Colonnes des hash ; le code propriétaire en clair n'est plus obligatoire
alter table public.secrets add column if not exists code_famille_hash text;
alter table public.secrets add column if not exists code_proprio_hash text;
alter table public.secrets alter column code_proprio drop not null;

-- 3. Conversion des codes actuels (seulement ceux qui n'ont pas encore de hash)
update public.secrets
   set code_famille_hash = extensions.crypt(code_famille, extensions.gen_salt('bf', 10))
 where id = 1 and code_famille_hash is null and code_famille is not null;
update public.secrets
   set code_proprio_hash = extensions.crypt(code_proprio, extensions.gen_salt('bf', 10))
 where id = 1 and code_proprio_hash is null and code_proprio is not null;
-- Le code propriétaire en clair est effacé (le hash suffit pour comparer)
update public.secrets set code_proprio = null where id = 1 and code_proprio_hash is not null;

-- 4. Essais ratés : on retient qui a essayé
alter table public.essais add column if not exists uid uuid default auth.uid();
create index if not exists essais_uid_quand on public.essais (uid, quand);

-- 5. Fonctions (mêmes noms et mêmes paramètres qu'avant)
create or replace function public.rejoindre(code text, nom text default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare s public.secrets; r text;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  -- Limite par personne : 10 essais ratés en 15 minutes
  if (select count(*) from public.essais where uid = auth.uid() and quand > now() - interval '15 minutes') >= 10 then
    raise exception 'Trop d''essais, réessayez dans un quart d''heure';
  end if;
  -- Limite globale (plus haute) : 100 essais ratés en 15 minutes, toutes personnes confondues
  if (select count(*) from public.essais where quand > now() - interval '15 minutes') >= 100 then
    raise exception 'Trop d''essais, réessayez dans un quart d''heure';
  end if;
  select * into s from public.secrets where id = 1;
  if s is null or s.code_proprio_hash is null or s.code_famille_hash is null then raise exception 'Codes non configurés'; end if;
  if rejoindre.code is not null and s.code_proprio_hash = extensions.crypt(rejoindre.code, s.code_proprio_hash) then r := 'proprio';
  elsif rejoindre.code is not null and s.code_famille_hash = extensions.crypt(rejoindre.code, s.code_famille_hash) then r := 'membre';
  else
    insert into public.essais(uid) values (auth.uid());
    delete from public.essais where quand < now() - interval '1 day';
    return null;
  end if;
  insert into public.acces(uid, nom, role) values (auth.uid(), nullif(trim(rejoindre.nom), ''), r)
  on conflict (uid) do update
    set role = case when public.acces.role = 'proprio' then 'proprio' else excluded.role end,
        nom  = coalesce(excluded.nom, public.acces.nom);
  return (select role from public.acces where uid = auth.uid());
end $$;

-- Le propriétaire change le code famille : le hash est mis à jour en même temps
-- (sans cela, l'ancien code resterait le seul valable).
create or replace function public.changer_code_famille(nouveau text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_owner() then raise exception 'Réservé au propriétaire'; end if;
  if length(trim(nouveau)) < 10 then raise exception 'Code trop court (10 caractères minimum)'; end if;
  update public.secrets
     set code_famille = trim(nouveau),
         code_famille_hash = extensions.crypt(trim(nouveau), extensions.gen_salt('bf', 10))
   where id = 1;
end $$;

-- code_famille() ne change pas : elle relit la copie en clair (pour le lien d'invitation).
-- Si cette copie a été supprimée (étape 6), elle renvoie null.

-- Droits : inchangés (les fonctions gardent leurs droits existants)
revoke all on public.essais from anon, authenticated;

-- 6. OPTIONNEL : ne plus garder le code famille en clair.
--    À lancer seulement si vous acceptez que le lien d'invitation de l'application soit vide
--    (le propriétaire envoie alors le code lui-même). Décommentez ces deux lignes :
-- alter table public.secrets alter column code_famille drop not null;
-- update public.secrets set code_famille = null where id = 1;
