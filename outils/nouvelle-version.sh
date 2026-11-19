#!/bin/sh
# Augmente le numéro de version (scripts, cache hors ligne et version affichée) pour que chaque appareil charge tout de suite le nouveau code.
cd "$(dirname "$0")/.." || exit 1
v=$(grep -o 'menus-v[0-9]*' sw.js | head -1 | tr -dc 0-9); n=$((v+1))
sed -i "s/menus-v$v/menus-v$n/; s/?v=$v\"/?v=$n\"/g" sw.js
sed -i "s/\(\.js?v=\)[0-9]*\"/\1$n\"/g" index.html
# Version affichée + date et heure de la mise à jour (heure de Bruxelles)
d=$(TZ=Europe/Brussels date '+%d/%m/%Y à %H:%M')
sed -i "s|<p class=\"appver\"[^>]*>[^<]*</p>|<p class=\"appver\" data-appver=\"$n\" data-appdate=\"$d\">Version $n · mise à jour le $d</p>|" index.html
echo "Version $n"
# Contrôle : chaque script de js/ doit être dans le cache hors ligne (sw.js) et chargé par index.html
# (partage.js et demarrage.js par leur balise <script>, les autres par l'attribut data-scripts de demarrage.js).
for f in js/*.js; do
  grep -q "\"$f?v=$n\"" sw.js || echo "ATTENTION : $f manque dans la liste FICHIERS de sw.js"
  case "$f" in
    js/partage.js|js/demarrage.js) grep -q "src=\"$f?v=$n\"" index.html || echo "ATTENTION : $f n'a pas de balise <script> dans index.html" ;;
    *) grep -q "data-scripts=\"[^\"]*$f[ \"]" index.html || echo "ATTENTION : $f manque dans data-scripts de index.html" ;;
  esac
done
