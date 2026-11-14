# Données mises à jour automatiquement

Deux fichiers sont lus par l'application à chaque ouverture. Une tâche planifiée les met à jour le lundi et le mercredi matin, jours de sortie des folders en Belgique.

- `donnees/promos.json` : promotions en cours dans les supermarchés.
- `donnees/recettes.json` : recettes ajoutées à la bibliothèque (en plus de celles écrites dans `index.html`).

Ne jamais modifier `index.html`, `js/`, `supabase/` ni les autres fichiers pendant la mise à jour automatique.

## Outils

- `node outils/inventaire.js` : liste les recettes existantes, les ingrédients connus (avec leur prix de référence) et les codes des enseignes.
- `node outils/verifier.js` : vérifie les deux fichiers. À lancer avant chaque publication ; ne rien publier s'il signale un problème.

## promos.json

```json
{
  "releve": "16 novembre 2026",
  "date": "2026-11-16",
  "region": "Givry, Quévy, Binche, Mons (15 km)",
  "promos": [
    {"mag": "lidl", "produit": "Haché préparé porc et bœuf", "prix": 2.49, "avant": 3.79, "du": "2026-11-16", "au": "2026-11-21", "ing": "Haché porc-bœuf"}
  ]
}
```

- `mag` : code d'enseigne (voir l'inventaire : inter, lidl, delhaize, aldi, carrefour, colruyt, okay, bioplanet, spar, louisdelhaize, ah, jumbo, match, cora, eurospar).
- `prix` : prix promo en euros, pour le conditionnement indiqué dans `produit` ; `avant` : prix normal, ou `null` s'il n'est pas connu.
- `du` / `au` : validité (AAAA-MM-JJ). Ne garder que les promos encore valables ou qui commencent dans les 7 jours.
- `ing` : nom EXACT d'un ingrédient de l'inventaire (c'est ce qui relie la promo aux recettes).
- Remplacer toute la liste à chaque passage (les promos expirées disparaissent).

## recettes.json

```json
{
  "maj": "2026-11-16",
  "prix": {"Butternut": [2.0, "kg"]},
  "recettes": [
    {"id": "butternutgratin", "nom": "Gratin express de butternut", "acc": "Salade", "t": 30,
     "b": "eco", "p": "vege", "f": "legumes", "c": "francaise",
     "astuce": "Une phrase utile.",
     "ing": [["Butternut", 1500, "g", "fl"], ["Crème fraîche", 20, "cl", "cre"]],
     "etapes": ["Étape 1.", "Étape 2.", "Étape 3."],
     "source": {"titre": "Nom du site", "url": "https://..."},
     "ajoute": "2026-11-16"}
  ]
}
```

- Toujours AJOUTER à la liste existante, ne jamais retirer une recette.
- 5 personnes, 30 minutes maximum, ingrédients faciles à trouver en Belgique, de préférence de saison.
- `id` : minuscules et chiffres, unique (ni dans l'inventaire ni déjà dans le fichier).
- `b` (budget, prix par personne en gamme économique) : `eco` sous 2 €, `moyen` de 2 à 3 €, `plaisir` au-dessus ou plat « de fête ».
- `p` : veau, boeuf, porc, volaille, poisson, oeufs, vege. `f` : legumes, lentilles, galette, pates, riz, pdt, pain, tarte, semoule.
- `c` : belge, francaise, italienne, grecque, espagnole, asiatique, indienne, orientale, mexicaine, americaine.
- `ing` : `[nom, quantité pour 5, unité, rayon]` ; unités `g`, `cl`, `""` (pièce) ou un mot (boîte, pot, sachet…) ; rayons `fl` fruits-légumes, `bou` boucherie, `cre` crèmerie, `bl` boulangerie, `epi` épicerie, `boi` boissons, `sur` surgelés. Réutiliser le nom exact d'un ingrédient de l'inventaire quand il existe ; sinon ajouter son prix de référence dans `prix` (`[prix, "kg" | "L" | "u"]`). Sel, poivre, huile, ail, épices courantes : ne pas les lister.
- `etapes` : 3 à 8 phrases courtes, rédigées avec nos propres mots (ne pas recopier le texte du site source).
- `source` : la page web qui a inspiré l'idée.

## Propositions de la famille

Les membres proposent des recettes dans l'onglet Envies (un lien, une envie décrite, ou la photo d'une recette).

- `CLE_ROBOT=… node outils/suggestions.js lister` : écrit les propositions en attente dans `suggestions-a-traiter/` (une fiche `.json` par proposition, et la photo en `.jpg` s'il y en a une). Ce dossier n'est jamais publié.
- Pour chaque proposition : lire la page du lien, ou regarder la photo, ou chercher sur le web une recette qui répond à l'envie. En faire une recette au format de `recettes.json` (5 personnes, 30 minutes maximum si possible ; ajouter `"propose_par": "<prénom>"`). Si ce n'est pas faisable (trop long, introuvable, doublon d'une recette existante), la refuser avec une explication courte et bienveillante.
- Après la publication : `node outils/suggestions.js marquer <chemin> ajoutee <id>` ou `marquer <chemin> refusee "<explication>"`.

## Tickets de caisse et base des prix réels

Les membres envoient la photo de leurs tickets depuis l'onglet Courses.

- `CLE_ROBOT=… node outils/tickets.js lister` : écrit les tickets en attente dans `tickets-a-traiter/` (photo `.jpg` + fiche `.json` avec la semaine, le magasin choisi et la date d'envoi). Ce dossier n'est jamais publié.
- Pour chaque photo : lire le ticket (magasin, date, total, chaque ligne : produit, quantité, prix). Pour chaque ligne qui correspond à un ingrédient de l'inventaire, ajouter un relevé dans `donnees/prix.json` :

```json
{"ing": "Haché porc-bœuf", "produit": "Haché porc/bœuf 500 g", "mag": "delhaize", "prix": 4.29, "quantite": 0.5, "unite": "kg", "prixUnitaire": 8.58, "date": "2026-11-14"}
```

  `unite` est l'unité du prix de référence de l'ingrédient dans l'inventaire (kg, L ou u) ; `prixUnitaire` = prix ramené à cette unité. Toujours ajouter, ne jamais effacer d'anciens relevés.
- Puis : `node outils/tickets.js resultat <chemin> analyse '{"total":87.45,"magasin":"Delhaize Ghlin","date":"2026-11-14","articles":32,"reconnus":18}'` (la photo est alors retirée de la base), ou `resultat <chemin> illisible '{"note":"Photo floue : merci d'en reprendre une"}'`.
- Ne jamais recopier les informations de paiement (numéro de carte, code, terminal) ni le nom du caissier.

## Inspiration des nouvelles recettes

Source principale : Marmiton (marmiton.org), recettes bien notées, rapides et de saison. Chercher avec la recherche web (par exemple « marmiton recette rapide poireaux ») et ouvrir les liens des résultats. Rédiger les étapes avec nos propres mots et mettre la page Marmiton en `source`.

## Fiches produits (donnees/produits.json)

Chaque produit des recettes et de la liste de courses a une fiche, ouverte en touchant sa vignette dans la liste.

```json
{"n": "Carottes", "ray": "fl", "desc": "Carottes de pleine terre, pour la soupe, le stoemp…", "format": "Sachet de 1 kg ou botte",
 "conserver": "Au frigo, sans les fanes : 2 à 3 semaines", "saison": [1, 12], "ref": [1.2, "kg"],
 "photo": "photos/produits/carottes.jpg", "credit": "https://commons.wikimedia.org/wiki/File:Carrots.jpg",
 "magasins": [{"mag": "colruyt", "prix": 1.39, "format": "1 kg", "unitaire": [1.39, "kg"], "date": "2026-11-16", "source": "https://..."}]}
```

- `n` : nom EXACT du produit (le même que dans l'inventaire ou le catalogue). Ne jamais supprimer une fiche.
- `desc` : 1 ou 2 phrases utiles (ce que c'est, comment le choisir), rédigées avec nos propres mots.
- `ref` : prix de référence marque de distributeur, seulement pour un produit qui n'a pas déjà un prix dans l'inventaire.
- `saison` : mois de début et de fin (fruits et légumes).
- `photo` : uniquement des photos libres de droits de Wikimedia Commons, réduites à 400 px de large et moins de 120 Ko, enregistrées dans `photos/produits/` ; `credit` = la page du fichier sur Commons. Jamais de photo copiée d'un site d'enseigne (droits d'auteur). Téléchargement : `https://upload.wikimedia.org/wikipedia/commons/thumb/<a>/<ab>/<Fichier>/330px-<Fichier>` où `<ab>` sont les 2 premiers caractères du MD5 du nom de fichier (avec des `_` à la place des espaces).
- `magasins` : prix réellement relevés (page produit d'une enseigne, comparateur, article de presse), avec la date et le lien source. Ne jamais inventer ni estimer un prix ici ; garder au plus 20 relevés par produit, les plus récents.
