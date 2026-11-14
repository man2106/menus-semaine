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
