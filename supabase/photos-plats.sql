-- =====================================================================
-- « Ma photo du plat » : partager les photos de plats avec toute la famille
-- À exécuter UNE fois à la main : Supabase > SQL Editor > coller tout ce texte > Run.
-- On peut le relancer sans risque.
--
-- Sans ce script, l'application marche quand même : la photo reste sur le téléphone
-- de la personne qui l'a prise (message « Photo gardée sur ce téléphone »).
-- Avec ce script, la photo est vue par toute la famille, sur tous les téléphones.
--
-- Comment ça marche : comme pour les photos de tickets, la photo (réduite, environ 50 à 100 Ko)
-- est rangée dans la table « docs », rubrique « platsphotos », un document par recette.
-- Les droits existants (code famille, propriétaire, taille maximale de 400 Ko par document) s'appliquent déjà.
-- Pas besoin de « Storage » : il n'y a pas de bucket dans ce projet, et rien à créer de plus.
-- =====================================================================

-- La rubrique « platsphotos » est acceptée dans la base (en plus de toutes les autres déjà acceptées)
alter table public.docs drop constraint if exists docs_chemin_valide;
alter table public.docs add constraint docs_chemin_valide
  check (length(path) <= 160 and path ~ '^(famille|semaines|validations|recettes|retours|sondage|suggestions|tickets|platsphotos)(/[A-Za-z0-9_.-]{1,100}){1,2}$');
