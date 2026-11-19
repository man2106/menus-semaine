# Menus de la semaine

Les menus du soir de la famille : propositions rapides et petit budget, liste des courses par magasin,
promos des magasins proches, qui cuisine, présences et validation par chacun.

Site : https://man2106.github.io/menus-semaine/

- `index.html` : l'application
- `js/demarrage.js` : charge `donnees/recettes-base.json`, puis les scripts de l'application dans l'ordre (liste dans `data-scripts` de `index.html`) :
  `donnees.js`, `menus.js`, `courses.js`, `promos.js`, `vues.js`, `fenetres.js`, `pdf.js`, `famille.js`, `app.js` (scripts classiques, variables globales partagées)
- `js/partage.js` : connexion à la base partagée (Supabase) avec le code d'invitation de la famille
- `supabase/schema.sql` : structure de la base et règles d'accès (sans les codes)
