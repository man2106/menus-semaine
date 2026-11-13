#!/bin/sh
# Augmente le numéro de version (scripts et cache hors ligne) pour que chaque appareil charge tout de suite le nouveau code.
cd "$(dirname "$0")/.." || exit 1
v=$(grep -o 'menus-v[0-9]*' sw.js | head -1 | tr -dc 0-9); n=$((v+1))
sed -i "s/menus-v$v/menus-v$n/; s/?v=$v\"/?v=$n\"/g" sw.js
sed -i "s/?v=$v\"/?v=$n\"/g" index.html
echo "Version $n"
