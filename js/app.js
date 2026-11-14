// Image introuvable : on la masque (remplace les anciens attributs onerror, interdits par la politique de sécurité)
window.addEventListener("error",e=>{ const t=e.target; if(t&&t.tagName==="IMG"){ if(t.dataset.cacheParent) t.parentNode.hidden=true; else t.style.visibility="hidden"; } },true);

// Nettoie un texte venu de la base partagée ou d'un fichier : jamais de balise ni de caractère dangereux à l'affichage
function propre(v,max){ return typeof v==="string" ? v.replace(/[<>&"'`]/g,"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,max||200) : ""; }
const RAYONS = {bou:"Boucherie & charcuterie", cre:"Crèmerie", fl:"Fruits & légumes", bl:"Boulangerie", epi:"Épicerie", sur:"Surgelés", boi:"Boissons", dro:"Droguerie & hygiène"};
const ORDRE = ["fl","bou","cre","bl","epi","boi","sur","dro"];
// Quantités pour 5 personnes : [nom, quantité, unité, rayon]
const RECETTES = [
 {id:"carbo",nom:"Pâtes carbonara",acc:"Salade verte",t:20,astuce:"Prenez un grand paquet de lardons : la moitié sert pour la quiche.",ing:[["Spaghetti",600,"g","epi"],["Lardons",200,"g","bou"],["Œufs",4,"","cre"],["Crème fraîche",20,"cl","cre"],["Fromage râpé",100,"g","cre"],["Laitue",1,"","fl"]]},
 {id:"omelette",nom:"Omelette aux pommes de terre",acc:"Salade verte",t:25,astuce:"Les œufs sont la protéine la moins chère de la semaine.",ing:[["Œufs",10,"","cre"],["Pommes de terre",1000,"g","fl"],["Oignons",2,"","fl"],["Lait",10,"cl","cre"],["Laitue",1,"","fl"]]},
 {id:"wraps",nom:"Wraps au poulet et poivrons",acc:"Carottes râpées et tomates",t:20,astuce:"Chacun compose son wrap : tout le monde met la main à la pâte.",ing:[["Blancs de poulet",600,"g","bou"],["Tortillas",10,"","epi"],["Poivrons",2,"","fl"],["Carottes",500,"g","fl"],["Tomates",4,"","fl"]]},
 {id:"cantonais",nom:"Riz cantonais",acc:"Jambon, petits pois et œufs",t:20,astuce:"Cuisez le riz en double la veille : il saute mieux froid.",ing:[["Riz",400,"g","epi"],["Jambon cuit",150,"g","bou"],["Petits pois",300,"g","sur"],["Œufs",4,"","cre"],["Oignons",1,"","fl"]]},
 {id:"croque",nom:"Croque-monsieur",acc:"Soupe de tomates",t:20,astuce:"Le reste de jambon du riz cantonais suffit.",ing:[["Pain de mie",20,"tranche","bl"],["Jambon cuit",250,"g","bou"],["Fromage râpé",150,"g","cre"],["Beurre",50,"g","cre"],["Soupe de tomates",100,"cl","epi"]]},
 {id:"chili",nom:"Chili con carne",acc:"Riz",t:30,astuce:"Doublez la quantité et congelez une portion pour un soir pressé.",ing:[["Haché porc-bœuf",600,"g","bou"],["Haricots rouges",2,"boîte","epi"],["Tomates concassées",2,"boîte","epi"],["Oignons",2,"","fl"],["Poivrons",1,"","fl"],["Épices pour chili",1,"sachet","epi"],["Riz",400,"g","epi"]]},
 {id:"quiche",nom:"Quiche lorraine",acc:"Salade verte",t:30,astuce:"10 minutes de préparation, le four fait le reste.",ing:[["Pâte brisée",2,"rouleau","cre"],["Lardons",200,"g","bou"],["Œufs",6,"","cre"],["Crème fraîche",20,"cl","cre"],["Lait",20,"cl","cre"],["Fromage râpé",100,"g","cre"],["Laitue",1,"","fl"]]},
 {id:"stoemp",nom:"Stoemp aux carottes et saucisses",acc:"Moutarde",t:30,astuce:"Un classique belge qui nourrit toute la tablée pour quelques euros.",ing:[["Saucisses",10,"","bou"],["Pommes de terre",1200,"g","fl"],["Carottes",800,"g","fl"],["Oignons",1,"","fl"],["Beurre",50,"g","cre"]]},
 {id:"thon",nom:"Pâtes au thon et tomate",acc:"Fromage râpé",t:20,astuce:"Tout vient du placard : idéal en fin de semaine.",ing:[["Penne",600,"g","epi"],["Thon au naturel",3,"boîte","epi"],["Tomates concassées",2,"boîte","epi"],["Oignons",1,"","fl"],["Fromage râpé",80,"g","cre"]]},
 {id:"boulettes",nom:"Boulettes sauce tomate",acc:"Riz",t:30,astuce:"Formez les boulettes avec les enfants pendant que le riz cuit.",ing:[["Haché porc-bœuf",750,"g","bou"],["Tomates concassées",2,"boîte","epi"],["Oignons",1,"","fl"],["Œufs",1,"","cre"],["Riz",400,"g","epi"]]},
 {id:"pizza",nom:"Pizza maison",acc:"Salade verte",t:25,astuce:"La pâte toute prête évite la levée.",ing:[["Pâte à pizza",2,"rouleau","cre"],["Coulis de tomate",50,"cl","epi"],["Jambon cuit",200,"g","bou"],["Mozzarella",2,"boule","cre"],["Champignons",250,"g","fl"],["Laitue",1,"","fl"]]},
 {id:"poisson",nom:"Poisson pané et purée",acc:"Haricots verts",t:25,astuce:"Les surgelés gardent le budget bas et se cuisent sans décongeler.",ing:[["Poisson pané",15,"","sur"],["Pommes de terre",1200,"g","fl"],["Lait",20,"cl","cre"],["Beurre",50,"g","cre"],["Haricots verts",600,"g","sur"]]},
 {id:"soupe",nom:"Soupe de légumes et tartines",acc:"Tartines au fromage",t:30,astuce:"Faites-en plus : la soupe se garde trois jours au frigo.",ing:[["Poireaux",3,"","fl"],["Carottes",500,"g","fl"],["Pommes de terre",500,"g","fl"],["Oignons",1,"","fl"],["Baguettes",2,"","bl"],["Fromage en tranches",300,"g","cre"]]},
 {id:"curry",nom:"Curry de pois chiches",acc:"Riz",t:25,astuce:"Un soir sans viande, rassasiant et très économique.",ing:[["Pois chiches",3,"boîte","epi"],["Lait de coco",2,"boîte","epi"],["Tomates concassées",1,"boîte","epi"],["Oignons",1,"","fl"],["Épinards",450,"g","sur"],["Pâte de curry",1,"pot","epi"],["Riz",400,"g","epi"]]},
 {id:"dahl",nom:"Dahl de lentilles corail",acc:"Riz et yaourt",t:25,b:"eco",p:"vege",f:"riz",astuce:"Les lentilles corail cuisent en 15 minutes, sans trempage.",ing:[["Lentilles corail", 400, "g", "epi"], ["Lait de coco", 1, "boîte", "epi"], ["Tomates concassées", 1, "boîte", "epi"], ["Oignons", 2, "", "fl"], ["Pâte de curry", 1, "pot", "epi"], ["Riz", 400, "g", "epi"]]},
 {id:"gratinpates",nom:"Gratin de pâtes au jambon",acc:"Salade verte",t:30,b:"eco",p:"porc",f:"pates",astuce:"Préparez-le la veille : il n'y a plus qu'à le passer au four.",ing:[["Macaroni", 600, "g", "epi"], ["Jambon cuit", 200, "g", "bou"], ["Crème fraîche", 25, "cl", "cre"], ["Lait", 20, "cl", "cre"], ["Fromage râpé", 150, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"bolo",nom:"Spaghetti bolognaise",acc:"Fromage râpé",t:30,b:"eco",p:"boeuf",f:"pates",astuce:"Doublez la sauce et congelez-en la moitié pour une lasagne plus tard.",ing:[["Spaghetti", 600, "g", "epi"], ["Haché porc-bœuf", 500, "g", "bou"], ["Tomates concassées", 2, "boîte", "epi"], ["Carottes", 200, "g", "fl"], ["Oignons", 1, "", "fl"], ["Fromage râpé", 80, "g", "cre"]]},
 {id:"boudin",nom:"Boudin, compote et purée",acc:"Chou rouge ou salade",t:25,b:"eco",p:"porc",f:"pdt",astuce:"Le grand classique belge du soir, à petit prix.",ing:[["Boudin", 10, "", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Compote de pommes", 1, "pot", "epi"], ["Lait", 20, "cl", "cre"], ["Beurre", 50, "g", "cre"]]},
 {id:"quesadillas",nom:"Quesadillas haricots et fromage",acc:"Tomates et maïs",t:20,b:"eco",p:"vege",f:"pain",astuce:"Coupées en triangles, elles se mangent avec les doigts.",ing:[["Tortillas", 10, "", "epi"], ["Haricots rouges", 2, "boîte", "epi"], ["Maïs", 1, "boîte", "epi"], ["Fromage râpé", 250, "g", "cre"], ["Poivrons", 1, "", "fl"], ["Tomates", 4, "", "fl"]]},
 {id:"pesto",nom:"Pâtes au pesto et haricots verts",acc:"Tomates cerises",t:15,b:"eco",p:"vege",f:"pates",astuce:"Le plat le plus rapide de la liste : 15 minutes montre en main.",ing:[["Penne", 600, "g", "epi"], ["Pesto", 2, "pot", "epi"], ["Haricots verts", 400, "g", "sur"], ["Tomates cerises", 250, "g", "fl"], ["Fromage râpé", 60, "g", "cre"]]},
 {id:"shakshuka",nom:"Œufs pochés à la tomate (shakshuka)",acc:"Pain grillé",t:25,b:"eco",p:"oeufs",f:"pain",astuce:"Les œufs cuisent directement dans la sauce : une seule poêle à laver.",ing:[["Œufs", 10, "", "cre"], ["Tomates concassées", 2, "boîte", "epi"], ["Poivrons", 2, "", "fl"], ["Oignons", 2, "", "fl"], ["Baguettes", 2, "", "bl"]]},
 {id:"gnocchis",nom:"Gnocchis poêlés tomate et mozzarella",acc:"Salade verte",t:15,b:"eco",p:"vege",f:"pates",astuce:"Poêlés sans cuisson à l'eau, les gnocchis restent croustillants.",ing:[["Gnocchis", 1500, "g", "cre"], ["Coulis de tomate", 50, "cl", "epi"], ["Mozzarella", 2, "boule", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"hotdog",nom:"Hot-dogs maison",acc:"Carottes râpées",t:15,b:"eco",p:"porc",f:"pain",astuce:"Les enfants garnissent eux-mêmes : succès garanti.",ing:[["Saucisses de Francfort", 10, "", "bou"], ["Pains à hot-dog", 10, "", "bl"], ["Oignons", 2, "", "fl"], ["Carottes", 500, "g", "fl"], ["Fromage râpé", 80, "g", "cre"]]},
 {id:"parmentier",nom:"Hachis parmentier express",acc:"Salade verte",t:30,b:"eco",p:"boeuf",f:"pdt",astuce:"La purée maison se fait pendant que la viande cuit.",ing:[["Haché porc-bœuf", 500, "g", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Oignons", 1, "", "fl"], ["Lait", 20, "cl", "cre"], ["Beurre", 40, "g", "cre"], ["Fromage râpé", 80, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"couscous",nom:"Couscous express aux merguez",acc:"Harissa à part",t:30,b:"moyen",p:"boeuf",f:"semoule",astuce:"La semoule gonfle en 5 minutes hors du feu.",ing:[["Semoule", 500, "g", "epi"], ["Merguez", 10, "", "bou"], ["Pois chiches", 1, "boîte", "epi"], ["Courgettes", 2, "", "fl"], ["Carottes", 300, "g", "fl"], ["Tomates concassées", 1, "boîte", "epi"], ["Épices à couscous", 1, "sachet", "epi"]]},
 {id:"pouletcurry",nom:"Poulet au curry et courgettes",acc:"Riz",t:25,b:"moyen",p:"volaille",f:"riz",astuce:"Version douce pour les enfants : ajoutez la crème avant de goûter.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Courgettes", 2, "", "fl"], ["Oignons", 1, "", "fl"], ["Crème fraîche", 20, "cl", "cre"], ["Pâte de curry", 1, "pot", "epi"], ["Riz", 400, "g", "epi"]]},
 {id:"nouilles",nom:"Nouilles sautées au poulet",acc:"Sauce soja",t:20,b:"moyen",p:"volaille",f:"pates",astuce:"Tout est coupé avant d'allumer le feu : la cuisson prend 8 minutes.",ing:[["Nouilles chinoises", 500, "g", "epi"], ["Blancs de poulet", 500, "g", "bou"], ["Poivrons", 2, "", "fl"], ["Carottes", 300, "g", "fl"], ["Oignons", 1, "", "fl"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"cordonbleu",nom:"Cordons bleus et pommes de terre sautées",acc:"Haricots verts",t:25,b:"moyen",p:"volaille",f:"pdt",astuce:"Les pommes de terre précuites en sachet font gagner 10 minutes.",ing:[["Cordons bleus", 5, "", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Haricots verts", 600, "g", "sur"], ["Beurre", 30, "g", "cre"]]},
 {id:"cotesporc",nom:"Côtes de porc, compote et pommes de terre",acc:"Salade verte",t:25,b:"moyen",p:"porc",f:"pdt",astuce:"Une compote de pommes réchauffée accompagne très bien le porc.",ing:[["Côtes de porc", 750, "g", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Compote de pommes", 1, "pot", "epi"], ["Beurre", 30, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"escalopes",nom:"Escalopes de poulet panées et pâtes tomate",acc:"Salade verte",t:30,b:"moyen",p:"volaille",f:"pates",astuce:"Aplatissez les escalopes : elles cuisent deux fois plus vite.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Chapelure", 1, "paquet", "epi"], ["Œufs", 2, "", "cre"], ["Spaghetti", 500, "g", "epi"], ["Coulis de tomate", 50, "cl", "epi"], ["Laitue", 1, "", "fl"]]},
 {id:"pita",nom:"Pitas au poulet et tzatziki",acc:"Tomates et concombre",t:20,b:"moyen",p:"volaille",f:"pain",astuce:"Le tzatziki maison : yaourt, concombre râpé, sel, un peu d'ail.",ing:[["Blancs de poulet", 600, "g", "bou"], ["Pains pita", 10, "", "bl"], ["Yaourt grec", 500, "g", "cre"], ["Concombre", 1, "", "fl"], ["Tomates", 4, "", "fl"], ["Oignons", 1, "", "fl"]]},
 {id:"volauvent",nom:"Vol-au-vent express",acc:"Frites au four",t:30,b:"moyen",p:"volaille",f:"pain",astuce:"Le plat du dimanche belge en version rapide de semaine.",ing:[["Blancs de poulet", 600, "g", "bou"], ["Champignons", 250, "g", "fl"], ["Bouchées feuilletées", 10, "", "bl"], ["Crème fraîche", 25, "cl", "cre"], ["Bouillon de volaille", 2, "cube", "epi"], ["Frites au four", 1500, "g", "sur"]]},
 {id:"wok",nom:"Wok de bœuf aux légumes",acc:"Riz",t:20,b:"moyen",p:"boeuf",f:"riz",astuce:"Coupez la viande très fine : elle cuit en 2 minutes et reste tendre.",ing:[["Lanières de bœuf", 500, "g", "bou"], ["Brocoli", 500, "g", "sur"], ["Poivrons", 2, "", "fl"], ["Oignons", 1, "", "fl"], ["Sauce soja", 1, "flacon", "epi"], ["Riz", 400, "g", "epi"]]},
 {id:"burger",nom:"Burgers maison et frites",acc:"Salade et tomates",t:25,b:"plaisir",p:"boeuf",f:"pain",astuce:"Les frites au four cuisent pendant que vous montez les burgers.",ing:[["Steaks hachés pur bœuf", 5, "", "bou"], ["Pains burger", 5, "", "bl"], ["Cheddar en tranches", 5, "", "cre"], ["Tomates", 3, "", "fl"], ["Laitue", 1, "", "fl"], ["Oignons", 1, "", "fl"], ["Frites au four", 1500, "g", "sur"]]},
 {id:"steakfrites",nom:"Steak, frites, salade",acc:"Sauce au poivre ou béarnaise",t:25,b:"plaisir",p:"boeuf",f:"pdt",astuce:"Sortez les steaks du frigo 15 minutes avant : ils cuisent plus régulièrement.",ing:[["Steaks de bœuf", 750, "g", "bou"], ["Frites au four", 1500, "g", "sur"], ["Laitue", 1, "", "fl"], ["Tomates", 3, "", "fl"], ["Beurre", 40, "g", "cre"]]},
 {id:"saumon",nom:"Saumon, riz et brocoli",acc:"Citron",t:20,b:"plaisir",p:"poisson",f:"riz",astuce:"Le saumon cuit au four sans surveillance, 12 minutes.",ing:[["Pavés de saumon", 5, "", "sur"], ["Riz", 400, "g", "epi"], ["Brocoli", 600, "g", "sur"], ["Citrons", 1, "", "fl"], ["Crème fraîche", 15, "cl", "cre"]]},
 {id:"scampis",nom:"Scampis à l'ail et tagliatelles",acc:"Salade verte",t:20,b:"plaisir",p:"poisson",f:"pates",astuce:"Les scampis surgelés décongèlent en 10 minutes sous l'eau froide.",ing:[["Scampis", 600, "g", "sur"], ["Tagliatelles", 500, "g", "epi"], ["Crème fraîche", 25, "cl", "cre"], ["Persil", 1, "botte", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"tagsaumon",nom:"Tagliatelles au saumon fumé",acc:"Salade verte",t:15,b:"plaisir",p:"poisson",f:"pates",astuce:"Ajoutez le saumon hors du feu : il reste tendre.",ing:[["Tagliatelles", 600, "g", "epi"], ["Saumon fumé", 200, "g", "cre"], ["Crème fraîche", 25, "cl", "cre"], ["Citrons", 1, "", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"fajitas",nom:"Fajitas au bœuf",acc:"Guacamole",t:20,b:"plaisir",p:"boeuf",f:"pain",astuce:"Tout se pose au milieu de la table : chacun compose.",ing:[["Lanières de bœuf", 600, "g", "bou"], ["Tortillas", 10, "", "epi"], ["Poivrons", 3, "", "fl"], ["Oignons", 2, "", "fl"], ["Avocats", 2, "", "fl"], ["Crème fraîche", 15, "cl", "cre"], ["Fromage râpé", 100, "g", "cre"]]},
 {id:"moules",nom:"Moules marinières et frites",acc:"Mayonnaise",t:25,b:"plaisir",p:"poisson",f:"pdt",astuce:"De septembre à avril, c'est la saison des moules de Zélande.",ing:[["Moules", 3000, "g", "bou"], ["Céleri", 1, "", "fl"], ["Oignons", 2, "", "fl"], ["Persil", 1, "botte", "fl"], ["Frites au four", 1500, "g", "sur"], ["Beurre", 30, "g", "cre"]]},
 {id:"cabillaud",nom:"Cabillaud à la crème de poireaux",acc:"Riz",t:25,b:"plaisir",p:"poisson",f:"riz",astuce:"Le poisson cuit sur les poireaux, dans la même poêle.",ing:[["Dos de cabillaud", 750, "g", "sur"], ["Poireaux", 3, "", "fl"], ["Crème fraîche", 20, "cl", "cre"], ["Beurre", 30, "g", "cre"], ["Riz", 400, "g", "epi"]]},
 {id:"pouletcompote",nom:"Aiguillettes de poulet, compote et frites",acc:"Compote de pommes",t:25,b:"moyen",p:"volaille",f:"pdt",c:"belge",astuce:"Le deuxième plat préféré des Belges, en version rapide de semaine.",ing:[["Aiguillettes de poulet", 750, "g", "bou"], ["Frites au four", 1500, "g", "sur"], ["Compote de pommes", 1, "pot", "epi"], ["Beurre", 30, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"liegeoise",nom:"Salade liégeoise tiède",acc:"Pain",t:25,b:"eco",p:"porc",f:"pdt",c:"belge",astuce:"Haricots, lardons et pommes de terre : le plat complet liégeois.",ing:[["Pommes de terre", 1200, "g", "fl"], ["Haricots verts", 800, "g", "sur"], ["Lardons", 250, "g", "bou"], ["Oignons", 2, "", "fl"], ["Vinaigre", 1, "flacon", "epi"], ["Œufs", 5, "", "cre"]]},
 {id:"boulets",nom:"Boulets sauce lapin express",acc:"Frites au four",t:30,b:"moyen",p:"boeuf",f:"pdt",c:"belge",astuce:"La sauce au sirop de Liège fait toute la différence.",ing:[["Haché porc-bœuf", 800, "g", "bou"], ["Oignons", 3, "", "fl"], ["Sirop de Liège", 1, "pot", "epi"], ["Bouillon de bœuf", 2, "cube", "epi"], ["Œufs", 1, "", "cre"], ["Chapelure", 1, "paquet", "epi"], ["Frites au four", 1500, "g", "sur"]]},
 {id:"waterzooi",nom:"Waterzooi de poulet express",acc:"Pain ou pommes de terre",t:30,b:"moyen",p:"volaille",f:"pdt",c:"belge",astuce:"Le plat gantois, prêt en une demi-heure avec des blancs de poulet.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Poireaux", 2, "", "fl"], ["Carottes", 400, "g", "fl"], ["Pommes de terre", 800, "g", "fl"], ["Crème fraîche", 25, "cl", "cre"], ["Bouillon de volaille", 2, "cube", "epi"], ["Œufs", 1, "", "cre"]]},
 {id:"carbonnades",nom:"Carbonnades express à l'autocuiseur",acc:"Frites au four",t:30,b:"plaisir",p:"boeuf",f:"pdt",c:"belge",astuce:"À l'autocuiseur, 20 minutes suffisent. Sans autocuiseur, gardez-les pour le week-end.",ing:[["Bœuf à carbonnades", 900, "g", "bou"], ["Oignons", 3, "", "fl"], ["Bière brune", 33, "cl", "boi"], ["Pain d'épices", 3, "tranche", "bl"], ["Moutarde", 1, "pot", "epi"], ["Frites au four", 1500, "g", "sur"]]},
 {id:"americain",nom:"Américain préparé et frites",acc:"Salade",t:15,b:"plaisir",p:"boeuf",f:"pdt",c:"belge",astuce:"Achetez l'américain le jour même chez le boucher.",ing:[["Américain préparé", 750, "g", "bou"], ["Frites au four", 1500, "g", "sur"], ["Laitue", 1, "", "fl"], ["Tomates", 3, "", "fl"], ["Oignons", 1, "", "fl"]]},
 {id:"chicons",nom:"Chicons braisés et jambon, purée",acc:"Purée",t:30,b:"eco",p:"porc",f:"pdt",c:"belge",astuce:"Version rapide des chicons au gratin : sans béchamel ni four.",ing:[["Chicons", 1000, "g", "fl"], ["Jambon cuit", 250, "g", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Lait", 20, "cl", "cre"], ["Beurre", 50, "g", "cre"], ["Fromage râpé", 80, "g", "cre"]]},
 {id:"risotto",nom:"Risotto aux champignons",acc:"Salade de roquette",t:30,b:"moyen",p:"vege",f:"riz",c:"italienne",astuce:"Le secret : remuer souvent et ajouter le bouillon petit à petit.",ing:[["Riz à risotto", 450, "g", "epi"], ["Champignons", 500, "g", "fl"], ["Oignons", 1, "", "fl"], ["Bouillon de légumes", 2, "cube", "epi"], ["Parmesan", 100, "g", "cre"], ["Beurre", 40, "g", "cre"]]},
 {id:"arrabbiata",nom:"Penne all'arrabbiata et mozzarella",acc:"Salade verte",t:20,b:"eco",p:"vege",f:"pates",c:"italienne",astuce:"Piment à part pour les enfants.",ing:[["Penne", 600, "g", "epi"], ["Tomates concassées", 2, "boîte", "epi"], ["Mozzarella", 2, "boule", "cre"], ["Oignons", 1, "", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"pennepoulet",nom:"Penne au poulet, crème et pesto",acc:"Tomates cerises",t:20,b:"moyen",p:"volaille",f:"pates",c:"italienne",astuce:"Un seul pot de pesto suffit pour donner du goût à toute la sauce.",ing:[["Penne", 600, "g", "epi"], ["Blancs de poulet", 500, "g", "bou"], ["Crème fraîche", 20, "cl", "cre"], ["Pesto", 1, "pot", "epi"], ["Tomates cerises", 250, "g", "fl"]]},
 {id:"minestrone",nom:"Minestrone et focaccia",acc:"Parmesan",t:30,b:"eco",p:"vege",f:"pain",c:"italienne",astuce:"Une grande soupe-repas : les restes se gardent trois jours.",ing:[["Courgettes", 2, "", "fl"], ["Carottes", 400, "g", "fl"], ["Haricots blancs", 2, "boîte", "epi"], ["Tomates concassées", 1, "boîte", "epi"], ["Coquillettes", 200, "g", "epi"], ["Focaccia", 2, "", "bl"], ["Parmesan", 60, "g", "cre"]]},
 {id:"piadina",nom:"Piadine jambon, mozzarella et roquette",acc:"Tomates",t:15,b:"eco",p:"porc",f:"pain",c:"italienne",astuce:"Remplace très bien les croque-monsieur.",ing:[["Piadine", 10, "", "bl"], ["Jambon cru", 200, "g", "bou"], ["Mozzarella", 2, "boule", "cre"], ["Roquette", 125, "g", "fl"], ["Tomates", 4, "", "fl"]]},
 {id:"souvlaki",nom:"Souvlaki de porc, salade grecque et pita",acc:"Tzatziki",t:25,b:"moyen",p:"porc",f:"pain",c:"grecque",astuce:"Les Grecs mettent de l'origan partout : n'hésitez pas.",ing:[["Filet de porc", 700, "g", "bou"], ["Pains pita", 10, "", "bl"], ["Concombre", 1, "", "fl"], ["Tomates", 4, "", "fl"], ["Feta", 200, "g", "cre"], ["Yaourt grec", 400, "g", "cre"]]},
 {id:"keftedes",nom:"Boulettes grecques (keftedes) et riz",acc:"Tzatziki",t:30,b:"moyen",p:"boeuf",f:"riz",c:"grecque",astuce:"La menthe séchée donne le goût typique des keftedes.",ing:[["Haché porc-bœuf", 700, "g", "bou"], ["Oignons", 1, "", "fl"], ["Œufs", 1, "", "cre"], ["Riz", 400, "g", "epi"], ["Yaourt grec", 400, "g", "cre"], ["Concombre", 1, "", "fl"]]},
 {id:"teriyaki",nom:"Poulet teriyaki et riz",acc:"Haricots verts",t:25,b:"moyen",p:"volaille",f:"riz",c:"asiatique",astuce:"La sauce caramélise en 3 minutes : surveillez-la.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Sauce teriyaki", 1, "flacon", "epi"], ["Riz", 400, "g", "epi"], ["Haricots verts", 500, "g", "sur"], ["Sésame", 1, "sachet", "epi"]]},
 {id:"aigredoux",nom:"Porc aigre-doux à l'ananas",acc:"Riz",t:25,b:"moyen",p:"porc",f:"riz",c:"asiatique",astuce:"Un classique des traiteurs chinois, moins sucré fait maison.",ing:[["Filet de porc", 600, "g", "bou"], ["Ananas en morceaux", 1, "boîte", "epi"], ["Poivrons", 2, "", "fl"], ["Oignons", 1, "", "fl"], ["Ketchup", 1, "flacon", "epi"], ["Sauce soja", 1, "flacon", "epi"], ["Riz", 400, "g", "epi"]]},
 {id:"ramen",nom:"Ramen express au poulet et œuf",acc:"Sauce soja",t:25,b:"moyen",p:"volaille",f:"pates",c:"asiatique",astuce:"Les œufs mollets : 6 minutes 30 dans l'eau bouillante.",ing:[["Nouilles chinoises", 500, "g", "epi"], ["Blancs de poulet", 400, "g", "bou"], ["Œufs", 5, "", "cre"], ["Bouillon de volaille", 3, "cube", "epi"], ["Champignons", 250, "g", "fl"], ["Pousses d'épinards", 200, "g", "fl"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"poke",nom:"Bol de riz au saumon (poke)",acc:"Sauce soja",t:25,b:"plaisir",p:"poisson",f:"riz",c:"asiatique",astuce:"Le saumon cuit à la poêle convient à tout le monde, même aux enfants.",ing:[["Pavés de saumon", 4, "", "sur"], ["Riz", 400, "g", "epi"], ["Avocats", 2, "", "fl"], ["Concombre", 1, "", "fl"], ["Carottes", 300, "g", "fl"], ["Maïs", 1, "boîte", "epi"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"tacos",nom:"Tacos au poulet effiloché",acc:"Guacamole et salade",t:25,b:"moyen",p:"volaille",f:"pain",c:"mexicaine",astuce:"Le poulet poché s'effiloche en deux fourchettes.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Petites tortillas", 15, "", "epi"], ["Tomates", 4, "", "fl"], ["Laitue", 1, "", "fl"], ["Avocats", 2, "", "fl"], ["Fromage râpé", 150, "g", "cre"], ["Épices pour tacos", 1, "sachet", "epi"]]},
 {id:"sincarne",nom:"Chili sin carne",acc:"Riz",t:25,b:"eco",p:"vege",f:"riz",c:"mexicaine",astuce:"Les haricots et le maïs remplacent la viande sans perdre la gourmandise.",ing:[["Haricots rouges", 3, "boîte", "epi"], ["Maïs", 1, "boîte", "epi"], ["Tomates concassées", 2, "boîte", "epi"], ["Poivrons", 2, "", "fl"], ["Oignons", 2, "", "fl"], ["Épices pour chili", 1, "sachet", "epi"], ["Riz", 400, "g", "epi"]]},
 {id:"kefta",nom:"Kefta à la tomate et semoule",acc:"Salade de carottes au cumin",t:30,b:"moyen",p:"boeuf",f:"semoule",c:"orientale",astuce:"Le cumin et la coriandre suffisent à donner le goût marocain.",ing:[["Haché porc-bœuf", 700, "g", "bou"], ["Tomates concassées", 2, "boîte", "epi"], ["Oignons", 1, "", "fl"], ["Semoule", 500, "g", "epi"], ["Carottes", 500, "g", "fl"], ["Épices à couscous", 1, "sachet", "epi"]]},
 {id:"butterchicken",nom:"Butter chicken express",acc:"Riz et naans",t:30,b:"plaisir",p:"volaille",f:"riz",c:"indienne",astuce:"Doux et crémeux : le curry indien que les enfants aiment.",ing:[["Blancs de poulet", 800, "g", "bou"], ["Coulis de tomate", 50, "cl", "epi"], ["Crème fraîche", 25, "cl", "cre"], ["Beurre", 50, "g", "cre"], ["Garam masala", 1, "pot", "epi"], ["Riz", 400, "g", "epi"], ["Naans", 5, "", "bl"]]},
 {id:"galettes",nom:"Galettes de sarrasin complètes",acc:"Salade verte",t:20,b:"eco",p:"oeufs",f:"galette",c:"francaise",astuce:"Œuf, jambon, fromage : la complète bretonne.",ing:[["Galettes de sarrasin", 10, "", "cre"], ["Œufs", 10, "", "cre"], ["Jambon cuit", 250, "g", "bou"], ["Fromage râpé", 200, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"tartiflette",nom:"Tartiflette express",acc:"Salade verte",t:30,b:"plaisir",p:"porc",f:"pdt",c:"francaise",astuce:"Les pommes de terre précuites font gagner 20 minutes.",ing:[["Pommes de terre", 1500, "g", "fl"], ["Lardons", 250, "g", "bou"], ["Oignons", 2, "", "fl"], ["Reblochon", 1, "", "cre"], ["Crème fraîche", 15, "cl", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"oeufsbrouilles",nom:"Œufs brouillés, saumon fumé et toasts",acc:"Salade",t:15,b:"moyen",p:"oeufs",f:"pain",c:"francaise",astuce:"Feu doux et beurre : des œufs crémeux sans grumeaux.",ing:[["Œufs", 12, "", "cre"], ["Saumon fumé", 150, "g", "cre"], ["Pain de campagne", 1, "", "bl"], ["Beurre", 40, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"burgerpoisson",nom:"Burgers de poisson et coleslaw",acc:"Coleslaw",t:25,b:"moyen",p:"poisson",f:"pain",c:"americaine",astuce:"Le coleslaw se prépare en 5 minutes avec du chou déjà râpé.",ing:[["Filets de poisson panés", 5, "", "sur"], ["Pains burger", 5, "", "bl"], ["Chou blanc râpé", 400, "g", "fl"], ["Carottes", 300, "g", "fl"], ["Mayonnaise", 1, "pot", "epi"], ["Laitue", 1, "", "fl"]]},
 {id:"galettespdt",nom:"Galettes de pommes de terre et saumon",acc:"Crème et ciboulette",t:30,b:"plaisir",p:"poisson",f:"pdt",c:"francaise",astuce:"Pressez bien les pommes de terre râpées : elles dorent mieux.",ing:[["Pommes de terre", 1200, "g", "fl"], ["Œufs", 3, "", "cre"], ["Saumon fumé", 200, "g", "cre"], ["Crème fraîche", 20, "cl", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"tofu",nom:"Sauté de tofu et légumes, nouilles",acc:"Sauce soja",t:20,b:"eco",p:"vege",f:"pates",c:"asiatique",astuce:"Séchez bien le tofu avant de le poêler : il devient croustillant.",ing:[["Tofu", 400, "g", "cre"], ["Nouilles chinoises", 500, "g", "epi"], ["Brocoli", 500, "g", "sur"], ["Carottes", 300, "g", "fl"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"pizzapain",nom:"Pizzas sur pain pita",acc:"Salade",t:20,b:"eco",p:"porc",f:"pain",c:"italienne",astuce:"Les enfants garnissent eux-mêmes leur pizza.",ing:[["Pains pita", 10, "", "bl"], ["Coulis de tomate", 30, "cl", "epi"], ["Jambon cuit", 200, "g", "bou"], ["Mozzarella", 2, "boule", "cre"], ["Champignons", 200, "g", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"orzo",nom:"Orzo crémeux aux légumes et poulet",acc:"Parmesan",t:25,b:"moyen",p:"volaille",f:"pates",c:"grecque",astuce:"L'orzo cuit directement dans la sauce, comme un risotto rapide.",ing:[["Orzo", 500, "g", "epi"], ["Blancs de poulet", 500, "g", "bou"], ["Courgettes", 2, "", "fl"], ["Tomates cerises", 250, "g", "fl"], ["Bouillon de volaille", 2, "cube", "epi"], ["Parmesan", 60, "g", "cre"]]},
 {id:"veloutepotiron",nom:"Velouté de potiron et croques au fromage",acc:"Graines de courge",t:30,b:"eco",p:"vege",f:"pain",c:"francaise",astuce:"Le potiron n'a pas besoin d'être épluché s'il s'agit d'un potimarron.",ing:[["Potiron", 1500, "g", "fl"], ["Oignons", 1, "", "fl"], ["Bouillon de légumes", 2, "cube", "epi"], ["Crème fraîche", 15, "cl", "cre"], ["Pain de mie", 10, "tranche", "bl"], ["Fromage en tranches", 200, "g", "cre"]]},
 {id:"chouxbxl",nom:"Poêlée de choux de Bruxelles, lardons et pommes de terre",acc:"Moutarde",t:30,b:"eco",p:"porc",f:"pdt",c:"belge",astuce:"Coupez les choux en deux : ils cuisent plus vite et perdent leur amertume.",ing:[["Choux de Bruxelles", 800, "g", "fl"], ["Pommes de terre", 1200, "g", "fl"], ["Lardons", 250, "g", "bou"], ["Oignons", 1, "", "fl"], ["Beurre", 30, "g", "cre"]]},
 {id:"stoemppoireaux",nom:"Stoemp aux poireaux et œufs au plat",acc:"Salade",t:30,b:"eco",p:"oeufs",f:"pdt",c:"belge",astuce:"Une version sans viande du stoemp, tout aussi réconfortante.",ing:[["Pommes de terre", 1200, "g", "fl"], ["Poireaux", 3, "", "fl"], ["Œufs", 10, "", "cre"], ["Lait", 20, "cl", "cre"], ["Beurre", 50, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"potee",nom:"Potée de chou vert et saucisses",acc:"Moutarde",t:30,b:"moyen",p:"porc",f:"pdt",c:"belge",astuce:"Le chou de Milan est en pleine saison de novembre à mars.",ing:[["Chou de Milan", 1, "", "fl"], ["Saucisses fumées", 10, "", "bou"], ["Pommes de terre", 1000, "g", "fl"], ["Carottes", 400, "g", "fl"], ["Bouillon de légumes", 2, "cube", "epi"]]},
 {id:"celeri",nom:"Saucisses, purée de céleri-rave et oignons",acc:"Compote",t:30,b:"eco",p:"porc",f:"pdt",c:"belge",astuce:"Moitié pommes de terre, moitié céleri : une purée plus légère et parfumée.",ing:[["Saucisses", 10, "", "bou"], ["Céleri-rave", 1, "", "fl"], ["Pommes de terre", 700, "g", "fl"], ["Oignons", 3, "", "fl"], ["Lait", 20, "cl", "cre"], ["Beurre", 40, "g", "cre"]]},
 {id:"patespotiron",nom:"Pâtes crémeuses au potiron et parmesan",acc:"Roquette",t:25,b:"eco",p:"vege",f:"pates",c:"italienne",astuce:"Le potiron fondu fait une sauce onctueuse sans beaucoup de crème.",ing:[["Penne", 600, "g", "epi"], ["Potiron", 800, "g", "fl"], ["Oignons", 1, "", "fl"], ["Crème fraîche", 15, "cl", "cre"], ["Parmesan", 80, "g", "cre"], ["Roquette", 125, "g", "fl"]]},
 {id:"wrapspatate",nom:"Wraps de patate douce et haricots noirs",acc:"Crème et salade",t:25,b:"eco",p:"vege",f:"pain",c:"mexicaine",astuce:"La patate douce en petits dés cuit en 12 minutes à la poêle.",ing:[["Patates douces", 800, "g", "fl"], ["Haricots noirs", 2, "boîte", "epi"], ["Tortillas", 10, "", "epi"], ["Fromage râpé", 150, "g", "cre"], ["Laitue", 1, "", "fl"], ["Épices pour tacos", 1, "sachet", "epi"]]},
 {id:"frittata",nom:"Frittata aux épinards et feta",acc:"Pain et salade",t:20,b:"eco",p:"oeufs",f:"pain",c:"italienne",astuce:"Elle finit de cuire sous le grill du four : pas besoin de la retourner.",ing:[["Œufs", 10, "", "cre"], ["Épinards", 450, "g", "sur"], ["Feta", 200, "g", "cre"], ["Oignons", 1, "", "fl"], ["Baguettes", 2, "", "bl"]]},
 {id:"patespoireaux",nom:"Pâtes aux poireaux et lardons",acc:"Fromage râpé",t:25,b:"eco",p:"porc",f:"pates",c:"francaise",astuce:"Les poireaux fondus à couvert deviennent doux et sucrés.",ing:[["Tagliatelles", 600, "g", "epi"], ["Poireaux", 3, "", "fl"], ["Lardons", 200, "g", "bou"], ["Crème fraîche", 20, "cl", "cre"], ["Fromage râpé", 80, "g", "cre"]]},
 {id:"tortellini",nom:"Tortellini tomate et épinards",acc:"Parmesan",t:15,b:"eco",p:"vege",f:"pates",c:"italienne",astuce:"Les tortellini frais cuisent en 3 minutes.",ing:[["Tortellini", 1000, "g", "cre"], ["Coulis de tomate", 50, "cl", "epi"], ["Épinards", 300, "g", "sur"], ["Parmesan", 60, "g", "cre"]]},
 {id:"flammekueche",nom:"Flammekueche express",acc:"Salade verte",t:25,b:"eco",p:"porc",f:"tarte",c:"francaise",astuce:"Sur pâte à pizza fine, elle cuit en 12 minutes.",ing:[["Pâte à pizza", 2, "rouleau", "cre"], ["Crème fraîche", 25, "cl", "cre"], ["Lardons", 200, "g", "bou"], ["Oignons", 3, "", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"falafels",nom:"Falafels, houmous et pitas",acc:"Crudités",t:20,b:"moyen",p:"vege",f:"pain",c:"orientale",astuce:"Les falafels surgelés passent 10 minutes au four.",ing:[["Falafels", 25, "", "sur"], ["Houmous", 2, "pot", "cre"], ["Pains pita", 10, "", "bl"], ["Tomates", 4, "", "fl"], ["Concombre", 1, "", "fl"], ["Yaourt grec", 250, "g", "cre"]]},
 {id:"couscouslegumes",nom:"Couscous aux légumes et pois chiches",acc:"Raisins secs",t:30,b:"eco",p:"vege",f:"semoule",c:"orientale",astuce:"Le navet et la carotte d'hiver donnent du goût au bouillon.",ing:[["Semoule", 500, "g", "epi"], ["Pois chiches", 2, "boîte", "epi"], ["Carottes", 400, "g", "fl"], ["Navets", 3, "", "fl"], ["Courgettes", 2, "", "fl"], ["Tomates concassées", 1, "boîte", "epi"], ["Épices à couscous", 1, "sachet", "epi"]]},
 {id:"croutechampi",nom:"Croûtes aux champignons",acc:"Salade de blé",t:25,b:"eco",p:"vege",f:"pain",c:"francaise",astuce:"Mélangez champignons de Paris et pleurotes pour plus de goût.",ing:[["Champignons", 800, "g", "fl"], ["Pain de campagne", 1, "", "bl"], ["Crème fraîche", 20, "cl", "cre"], ["Oignons", 1, "", "fl"], ["Fromage râpé", 100, "g", "cre"], ["Mâche", 150, "g", "fl"]]},
 {id:"lentilles",nom:"Lentilles aux saucisses fumées",acc:"Moutarde",t:30,b:"eco",p:"porc",f:"lentilles",c:"francaise",astuce:"Les lentilles vertes cuisent en 25 minutes, sans trempage.",ing:[["Lentilles vertes", 500, "g", "epi"], ["Saucisses fumées", 10, "", "bou"], ["Carottes", 300, "g", "fl"], ["Oignons", 1, "", "fl"], ["Bouillon de légumes", 2, "cube", "epi"]]},
 {id:"chourouge",nom:"Chou rouge aux pommes, saucisses et pommes de terre",acc:"Compote",t:25,b:"moyen",p:"porc",f:"pdt",c:"belge",astuce:"Le chou rouge déjà cuisiné en bocal ne demande que d'être réchauffé.",ing:[["Chou rouge cuisiné", 2, "bocal", "epi"], ["Saucisses", 10, "", "bou"], ["Pommes de terre", 1200, "g", "fl"], ["Pommes", 2, "", "fl"], ["Beurre", 30, "g", "cre"]]},
 {id:"maquereau",nom:"Maquereau, haricots verts et semoule",acc:"Citron",t:20,b:"eco",p:"poisson",f:"semoule",c:"francaise",astuce:"Le maquereau en conserve est riche en oméga-3 et très bon marché.",ing:[["Maquereau en conserve", 4, "boîte", "epi"], ["Haricots verts", 600, "g", "sur"], ["Semoule", 400, "g", "epi"], ["Citrons", 1, "", "fl"], ["Persil", 1, "botte", "fl"]]},
 {id:"lasagnepoele",nom:"Lasagnes à la poêle",acc:"Salade verte",t:30,b:"eco",p:"boeuf",f:"pates",c:"italienne",astuce:"Les feuilles de lasagne cassées cuisent directement dans la sauce.",ing:[["Haché porc-bœuf", 500, "g", "bou"], ["Feuilles de lasagne", 400, "g", "epi"], ["Coulis de tomate", 70, "cl", "epi"], ["Mozzarella", 2, "boule", "cre"], ["Oignons", 1, "", "fl"], ["Laitue", 1, "", "fl"]]},
 {id:"patesgrecques",nom:"Pâtes à la grecque, feta et tomates",acc:"Olives",t:20,b:"eco",p:"vege",f:"pates",c:"grecque",astuce:"Ajoutez la feta en fin de cuisson pour qu'elle reste en morceaux.",ing:[["Penne", 600, "g", "epi"], ["Tomates cerises", 500, "g", "fl"], ["Feta", 200, "g", "cre"], ["Concombre", 1, "", "fl"], ["Olives", 1, "bocal", "epi"]]},
 {id:"quichepoireaux",nom:"Quiche aux poireaux",acc:"Salade verte",t:30,b:"eco",p:"oeufs",f:"tarte",c:"francaise",astuce:"Faites fondre les poireaux la veille pour gagner 10 minutes.",ing:[["Pâte brisée", 2, "rouleau", "cre"], ["Poireaux", 3, "", "fl"], ["Œufs", 6, "", "cre"], ["Crème fraîche", 20, "cl", "cre"], ["Fromage râpé", 100, "g", "cre"], ["Laitue", 1, "", "fl"]]},
 {id:"tajine",nom:"Tajine express de poulet, carottes et pruneaux",acc:"Semoule",t:30,b:"moyen",p:"volaille",f:"semoule",c:"orientale",astuce:"Les pruneaux adoucissent le plat : les enfants adorent.",ing:[["Cuisses de poulet désossées", 800, "g", "bou"], ["Carottes", 600, "g", "fl"], ["Oignons", 2, "", "fl"], ["Pruneaux", 150, "g", "epi"], ["Semoule", 500, "g", "epi"], ["Épices à couscous", 1, "sachet", "epi"]]},
 {id:"pouletchampi",nom:"Poulet aux champignons et tagliatelles",acc:"Salade",t:25,b:"moyen",p:"volaille",f:"pates",c:"francaise",astuce:"Un trait de moutarde dans la crème relève toute la sauce.",ing:[["Blancs de poulet", 700, "g", "bou"], ["Champignons", 400, "g", "fl"], ["Crème fraîche", 25, "cl", "cre"], ["Tagliatelles", 500, "g", "epi"], ["Moutarde", 1, "pot", "epi"]]},
 {id:"dindepoireaux",nom:"Émincé de dinde aux poireaux et riz",acc:"Curry doux",t:25,b:"moyen",p:"volaille",f:"riz",c:"francaise",astuce:"La dinde est souvent moins chère que le poulet.",ing:[["Escalopes de dinde", 700, "g", "bou"], ["Poireaux", 3, "", "fl"], ["Crème fraîche", 20, "cl", "cre"], ["Riz", 400, "g", "epi"]]},
 {id:"colin",nom:"Colin, poireaux à la crème et riz",acc:"Citron",t:25,b:"moyen",p:"poisson",f:"riz",c:"francaise",astuce:"Le poisson cuit à la vapeur, posé sur les poireaux.",ing:[["Filets de colin", 750, "g", "sur"], ["Poireaux", 3, "", "fl"], ["Crème fraîche", 20, "cl", "cre"], ["Riz", 400, "g", "epi"], ["Citrons", 1, "", "fl"]]},
 {id:"gyozas",nom:"Gyozas et légumes sautés",acc:"Sauce soja",t:20,b:"moyen",p:"porc",f:"pates",c:"asiatique",astuce:"Les gyozas surgelés grillent puis cuisent à la vapeur dans la même poêle.",ing:[["Gyozas", 40, "", "sur"], ["Brocoli", 500, "g", "sur"], ["Carottes", 300, "g", "fl"], ["Nouilles chinoises", 300, "g", "epi"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"padthai",nom:"Pad thaï au poulet",acc:"Cacahuètes et citron vert",t:25,b:"moyen",p:"volaille",f:"pates",c:"asiatique",astuce:"Tout est prêt avant d'allumer le feu : la cuisson prend 8 minutes.",ing:[["Nouilles de riz", 400, "g", "epi"], ["Blancs de poulet", 500, "g", "bou"], ["Œufs", 3, "", "cre"], ["Germes de soja", 200, "g", "fl"], ["Cacahuètes", 100, "g", "epi"], ["Sauce soja", 1, "flacon", "epi"], ["Citrons verts", 2, "", "fl"]]},
 {id:"bibimbap",nom:"Bibimbap au bœuf haché",acc:"Œuf au plat",t:25,b:"moyen",p:"boeuf",f:"riz",c:"asiatique",astuce:"Chacun compose son bol : riz, viande, légumes et un œuf.",ing:[["Haché pur bœuf", 500, "g", "bou"], ["Riz", 400, "g", "epi"], ["Œufs", 5, "", "cre"], ["Carottes", 300, "g", "fl"], ["Pousses d'épinards", 200, "g", "fl"], ["Concombre", 1, "", "fl"], ["Sauce soja", 1, "flacon", "epi"]]},
 {id:"saltimbocca",nom:"Saltimbocca de dinde et pâtes au citron",acc:"Roquette",t:25,b:"moyen",p:"volaille",f:"pates",c:"italienne",astuce:"Le jambon cru et la sauge parfument la dinde.",ing:[["Escalopes de dinde", 700, "g", "bou"], ["Jambon cru", 150, "g", "bou"], ["Spaghetti", 500, "g", "epi"], ["Citrons", 1, "", "fl"], ["Parmesan", 60, "g", "cre"], ["Roquette", 125, "g", "fl"]]},
 {id:"enchiladas",nom:"Enchiladas au poulet",acc:"Salade",t:30,b:"moyen",p:"volaille",f:"pain",c:"mexicaine",astuce:"Le poulet cuit du jour précédent fait gagner 10 minutes.",ing:[["Blancs de poulet", 600, "g", "bou"], ["Tortillas", 10, "", "epi"], ["Coulis de tomate", 50, "cl", "epi"], ["Haricots rouges", 1, "boîte", "epi"], ["Fromage râpé", 200, "g", "cre"], ["Épices pour tacos", 1, "sachet", "epi"]]},
 {id:"burritobowl",nom:"Burrito bowl au bœuf",acc:"Guacamole",t:25,b:"moyen",p:"boeuf",f:"riz",c:"mexicaine",astuce:"Version en bol du burrito : plus simple à servir aux enfants.",ing:[["Haché pur bœuf", 500, "g", "bou"], ["Riz", 400, "g", "epi"], ["Haricots noirs", 1, "boîte", "epi"], ["Maïs", 1, "boîte", "epi"], ["Avocats", 2, "", "fl"], ["Tomates", 3, "", "fl"], ["Épices pour tacos", 1, "sachet", "epi"]]},
 {id:"risottopoireaux",nom:"Risotto aux poireaux et lardons",acc:"Parmesan",t:30,b:"eco",p:"porc",f:"riz",c:"italienne",astuce:"Poireau et lard : un risotto d'hiver.",ing:[["Riz à risotto", 450, "g", "epi"], ["Poireaux", 2, "", "fl"], ["Lardons", 200, "g", "bou"], ["Bouillon de volaille", 2, "cube", "epi"], ["Parmesan", 80, "g", "cre"]]},
 {id:"canard",nom:"Filet de canard et potimarron rôti",acc:"Salade de mâche",t:30,b:"plaisir",p:"volaille",f:"legumes",c:"francaise",astuce:"Cuisez le canard côté peau sans matière grasse : il cuit dans sa graisse.",ing:[["Filets de canard", 3, "", "bou"], ["Potimarron", 1500, "g", "fl"], ["Pommes de terre", 600, "g", "fl"], ["Mâche", 150, "g", "fl"], ["Miel", 1, "pot", "epi"]]},
 {id:"milanaise",nom:"Escalopes milanaises et spaghetti",acc:"Sauce tomate",t:25,b:"plaisir",p:"veau",f:"pates",c:"italienne",astuce:"Panure au parmesan pour un croustillant parfait.",ing:[["Escalopes de veau", 700, "g", "bou"], ["Chapelure", 1, "paquet", "epi"], ["Parmesan", 80, "g", "cre"], ["Œufs", 2, "", "cre"], ["Spaghetti", 500, "g", "epi"], ["Coulis de tomate", 50, "cl", "epi"]]},
 {id:"croquettes",nom:"Croquettes de crevettes et salade",acc:"Citron et persil frit",t:20,b:"plaisir",p:"poisson",f:"pain",c:"belge",astuce:"Achetées chez le traiteur ou surgelées : 12 minutes au four ou 3 à la friteuse.",ing:[["Croquettes de crevettes", 10, "", "sur"], ["Laitue", 1, "", "fl"], ["Tomates", 4, "", "fl"], ["Citrons", 2, "", "fl"], ["Pain de campagne", 1, "", "bl"]]},
 {id:"saumonteriyaki",nom:"Saumon teriyaki et nouilles sautées",acc:"Sésame",t:20,b:"plaisir",p:"poisson",f:"pates",c:"asiatique",astuce:"La sauce teriyaki laque le saumon en 2 minutes.",ing:[["Pavés de saumon", 5, "", "sur"], ["Nouilles chinoises", 400, "g", "epi"], ["Sauce teriyaki", 1, "flacon", "epi"], ["Brocoli", 500, "g", "sur"], ["Sésame", 1, "sachet", "epi"]]},
 {id:"raclette",nom:"Raclette du soir",acc:"Cornichons et salade",t:25,b:"plaisir",p:"porc",f:"pdt",c:"francaise",astuce:"Sans appareil : le fromage fond au four sur les pommes de terre.",ing:[["Pommes de terre", 1500, "g", "fl"], ["Fromage à raclette", 800, "g", "cre"], ["Charcuterie assortie", 400, "g", "bou"], ["Cornichons", 1, "bocal", "epi"], ["Laitue", 1, "", "fl"]]},
 {id:"thonsteak",nom:"Steak de thon, riz et haricots verts",acc:"Sauce soja et citron",t:20,b:"plaisir",p:"poisson",f:"riz",c:"francaise",astuce:"Le thon se mange rosé : 2 minutes par face suffisent.",ing:[["Steaks de thon", 5, "", "sur"], ["Riz", 400, "g", "epi"], ["Haricots verts", 600, "g", "sur"], ["Citrons", 1, "", "fl"]]},
 {id:"gambas",nom:"Gambas à l'ail et riz safrané",acc:"Salade",t:25,b:"plaisir",p:"poisson",f:"riz",c:"espagnole",astuce:"Une pincée de curcuma remplace le safran pour la couleur.",ing:[["Gambas", 800, "g", "sur"], ["Riz", 400, "g", "epi"], ["Poivrons", 2, "", "fl"], ["Persil", 1, "botte", "fl"], ["Citrons", 1, "", "fl"]]},
 {id:"fondue",nom:"Fondue savoyarde express",acc:"Charcuterie et salade",t:25,b:"plaisir",p:"vege",f:"pain",c:"francaise",astuce:"Le mélange de fromages tout prêt fond en 10 minutes.",ing:[["Fromage à fondue", 1000, "g", "cre"], ["Pain de campagne", 2, "", "bl"], ["Laitue", 1, "", "fl"], ["Charcuterie assortie", 300, "g", "bou"]]},
 {id:"waterzooipoisson",nom:"Waterzooi de poisson",acc:"Pommes de terre",t:30,b:"plaisir",p:"poisson",f:"pdt",c:"belge",astuce:"Le waterzooi gantois d'origine était au poisson.",ing:[["Filets de cabillaud", 600, "g", "sur"], ["Saumon frais", 400, "g", "sur"], ["Poireaux", 2, "", "fl"], ["Carottes", 300, "g", "fl"], ["Pommes de terre", 800, "g", "fl"], ["Crème fraîche", 25, "cl", "cre"], ["Bouillon de légumes", 2, "cube", "epi"]]}
];
// Cuisine de chaque recette (bibliothèque) ; les recettes de famille n'en ont pas forcément
const CUISINES={belge:"Belge",francaise:"Française",italienne:"Italienne",grecque:"Grecque",espagnole:"Espagnole",asiatique:"Asiatique",indienne:"Indienne",orientale:"Orientale",mexicaine:"Mexicaine",americaine:"Américaine"};
Object.entries({"carbo": "italienne", "omelette": "espagnole", "wraps": "mexicaine", "cantonais": "asiatique", "croque": "francaise", "chili": "mexicaine", "quiche": "francaise", "stoemp": "belge", "thon": "italienne", "boulettes": "belge", "pizza": "italienne", "poisson": "belge", "soupe": "belge", "curry": "indienne", "dahl": "indienne", "gratinpates": "francaise", "bolo": "italienne", "boudin": "belge", "quesadillas": "mexicaine", "pesto": "italienne", "shakshuka": "orientale", "gnocchis": "italienne", "hotdog": "americaine", "parmentier": "francaise", "couscous": "orientale", "pouletcurry": "indienne", "nouilles": "asiatique", "cordonbleu": "belge", "cotesporc": "belge", "escalopes": "italienne", "pita": "grecque", "volauvent": "belge", "wok": "asiatique", "burger": "americaine", "steakfrites": "belge", "saumon": "francaise", "scampis": "italienne", "tagsaumon": "italienne", "fajitas": "mexicaine", "moules": "belge", "cabillaud": "francaise"}).forEach(([id,c])=>{ const r=RECETTES.find(x=>x.id===id); if(r) r.c=c; });
// Budget (eco, moyen, plaisir), protéine et féculent des recettes de départ, pour varier les menus
Object.entries({"carbo": ["eco", "porc", "pates"], "omelette": ["eco", "oeufs", "pdt"], "wraps": ["moyen", "volaille", "pain"], "cantonais": ["eco", "porc", "riz"], "croque": ["eco", "porc", "pain"], "chili": ["moyen", "boeuf", "riz"], "quiche": ["eco", "porc", "tarte"], "stoemp": ["eco", "porc", "pdt"], "thon": ["eco", "poisson", "pates"], "boulettes": ["moyen", "boeuf", "riz"], "pizza": ["moyen", "porc", "tarte"], "poisson": ["eco", "poisson", "pdt"], "soupe": ["eco", "vege", "pain"], "curry": ["eco", "vege", "riz"]}).forEach(([id,[b,p,f]])=>{ const r=RECETTES.find(x=>x.id===id); if(r){ r.b=b; r.p=p; r.f=f; } });
const BYID = Object.fromEntries(RECETTES.map(r=>[r.id,r]));
const RAYKEYS=["fl","bou","cre","bl","epi","boi","sur"];
// Recette de la famille : quantités ramenées à 5 personnes, photo en data URL facultative
function cleanRecipe(x){
  if(!x||typeof x!=="object"||typeof x.id!=="string"||!/^p[a-z0-9]{3,20}$/.test(x.id)) return null;
  const ing=(Array.isArray(x.ing)?x.ing:[]).filter(i=>Array.isArray(i)&&typeof i[0]==="string"&&i[0].trim()).slice(0,30)
    .map(([n,q,u,ray])=>[propre(n,40),Math.max(0,+q||0),["g","cl",""].includes(u)?u:"",RAYKEYS.includes(ray)?ray:"epi"]).filter(i=>i[0]);
  return {id:x.id,perso:true,nom:propre(x.nom,60)||"Recette",acc:propre(x.acc,60),t:Math.max(5,Math.min(240,+x.t||30)),
    astuce:propre(x.astuce,200),ing,etapes:(Array.isArray(x.etapes)?x.etapes:[]).map(e=>propre(e,400)).filter(Boolean).slice(0,20),
    photo:(typeof x.photo==="string"&&x.photo.startsWith("data:image/jpeg;base64,")&&x.photo.length<200000)?x.photo:null,
    prix:(+x.prix>0&&+x.prix<500)?+x.prix:null, auteur:typeof x.auteur==="string"?propre(x.auteur,60):null};
}
function registerRecipe(x){ const r=cleanRecipe(x); if(!r) return null;
  const i=RECETTES.findIndex(y=>y.id===r.id); if(i>=0) RECETTES[i]=r; else RECETTES.push(r);
  BYID[r.id]=r; ETAPES_PERSO[r.id]=r.etapes; return r; }
const ETAPES_PERSO={};
// Photos libres de droits (Wikimedia Commons) : fichier publié avec la page + page source
const PHOTOS = {
 carbo:"Spaghetti_alla_Carbonara.jpg", omelette:"Tortilla_de_patatas_en_un_plato.jpg", wraps:"Smoked_chicken_and_avocado_wrap.jpg",
 cantonais:"Yeung_Chow_Fried_Rice_in_Hong_Kong_Fast_Food_Shop.JPG", croque:"Croque_Monsieur.JPG", chili:"Chili-con-carne.jpg",
 quiche:"Quiche_lorraine_01.JPG", stoemp:"Boerenkool_met_worst.jpg", thon:"Spaghetti_al_Pomodoro.JPG", boulettes:"Pasta_with_meatballs.jpg",
 pizza:"Pizza_prosciutto_e_funghi,_Edingen.jpg", poisson:"Fish_fingers.jpg", soupe:"Potage_Crécy_soup.jpg", curry:"Chana_masala.jpg"
};
const PLACEHOLDER="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#E2F0E6"/><circle cx="60" cy="47" r="26" fill="#fff" stroke="#2E7A4C" stroke-width="3"/><path d="M28 20v22M33 20v22M28 42c0 5 5 5 5 0M92 20c-6 0-8 10-8 18h8v30" stroke="#2E7A4C" stroke-width="3" fill="none" stroke-linecap="round"/></svg>');
// En attendant une photo : une illustration simple, propre à chaque plat
const EMOJI={veloutepotiron:"🎃",chouxbxl:"🥬",stoemppoireaux:"🥔",potee:"🥬",celeri:"🌭",patespotiron:"🎃",wrapspatate:"🌯",frittata:"🍳",patespoireaux:"🍝",tortellini:"🍝",flammekueche:"🫓",falafels:"🧆",couscouslegumes:"🥘",croutechampi:"🍄",lentilles:"🥣",chourouge:"🍎",maquereau:"🐟",lasagnepoele:"🍝",patesgrecques:"🫒",quichepoireaux:"🥧",tajine:"🥘",pouletchampi:"🍄",dindepoireaux:"🍗",colin:"🐟",gyozas:"🥟",padthai:"🍜",bibimbap:"🍚",saltimbocca:"🍋",enchiladas:"🌯",burritobowl:"🥙",risottopoireaux:"🍚",canard:"🦆",milanaise:"🍝",croquettes:"🦐",saumonteriyaki:"🍣",raclette:"🧀",thonsteak:"🐟",gambas:"🦐",fondue:"🫕",waterzooipoisson:"🍲",burger:"🍔",burgerpoisson:"🍔",hotdog:"🌭",pizzapain:"🍕",tacos:"🌮",fajitas:"🌯",quesadillas:"🌮",ramen:"🍜",nouilles:"🍜",tofu:"🥢",wok:"🥢",teriyaki:"🍗",aigredoux:"🍍",poke:"🍣",
 steakfrites:"🥩",americain:"🥩",carbonnades:"🍲",boulets:"🧆",keftedes:"🧆",kefta:"🧆",waterzooi:"🍲",minestrone:"🥣",moules:"🦪",saumon:"🐟",cabillaud:"🐟",galettespdt:"🥔",
 scampis:"🍤",tagsaumon:"🍝",bolo:"🍝",pesto:"🍝",arrabbiata:"🍝",pennepoulet:"🍝",gratinpates:"🧀",orzo:"🍝",gnocchis:"🍅",risotto:"🍄",dahl:"🍛",butterchicken:"🍛",pouletcurry:"🍛",
 couscous:"🥘",sincarne:"🌶️",shakshuka:"🍳",oeufsbrouilles:"🍳",galettes:"🥞",tartiflette:"🧀",chicons:"🥬",liegeoise:"🥗",boudin:"🍎",parmentier:"🥔",cordonbleu:"🍗",cotesporc:"🍖",
 escalopes:"🍗",pita:"🥙",souvlaki:"🥙",piadina:"🫓",volauvent:"🥧",pouletcompote:"🍗"};
const ILLU={}; const TEINTES=["#E2F0E6","#FBEBD2","#E6ECF7","#F6E3E3","#EDE6F5","#E8F1D8"];
function illustration(id){ if(ILLU[id]) return ILLU[id]; const e=EMOJI[id]||"🍽️", bg=TEINTES[[...id].reduce((s,c)=>s+c.charCodeAt(0),0)%TEINTES.length];
  return ILLU[id]="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="${bg}"/><text x="80" y="64" font-size="60" text-anchor="middle" dominant-baseline="middle">${e}</text></svg>`); }
const photoSrc = id => { const r=BYID[id]; if(r&&r.perso) return r.photo||PLACEHOLDER; return PHOTOS[id]?"photos/"+id+".jpg":illustration(id); };
const photoPage = id => PHOTOS[id]?"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(PHOTOS[id]):null;
// Étapes de préparation
const ETAPES = {
 veloutepotiron:["Coupez le potiron en cubes et l'oignon en morceaux.", "Cuisez-les 20 minutes dans 1,2 L de bouillon.", "Pendant ce temps, faites les croques au fromage à la poêle ou au four.", "Mixez la soupe avec la crème, salez, poivrez."],
 chouxbxl:["Cuisez les pommes de terre en morceaux et les choux coupés en deux 10 minutes à l'eau salée.", "Faites dorer lardons et oignon.", "Ajoutez pommes de terre et choux égouttés, faites rissoler 8 minutes avec le beurre.", "Poivrez et servez avec de la moutarde."],
 stoemppoireaux:["Cuisez pommes de terre et poireaux émincés 20 minutes à l'eau salée.", "Égouttez et écrasez avec le lait chaud, le beurre, la muscade.", "Cuisez les œufs au plat.", "Servez un ou deux œufs sur le stoemp."],
 potee:["Coupez le chou en lanières, les carottes en rondelles et les pommes de terre en morceaux.", "Mettez tout dans une grande casserole avec 1 L de bouillon.", "Ajoutez les saucisses, couvrez et cuisez 25 minutes.", "Servez avec la moutarde."],
 celeri:["Cuisez céleri et pommes de terre en cubes 20 minutes à l'eau salée.", "Faites fondre les oignons émincés 15 minutes à feu doux.", "Cuisez les saucisses à la poêle.", "Écrasez la purée avec le lait et le beurre, servez avec oignons et saucisses."],
 patespotiron:["Cuisez le potiron en petits cubes 12 minutes avec l'oignon et un fond d'eau.", "Écrasez-le avec la crème et la moitié du parmesan.", "Cuisez les pâtes, gardez un peu d'eau de cuisson.", "Mélangez, ajoutez de l'eau de cuisson si besoin, parsemez de parmesan."],
 wrapspatate:["Coupez les patates douces en petits dés, faites-les dorer 12 minutes à la poêle couverte.", "Ajoutez les haricots égouttés et les épices, 3 minutes.", "Réchauffez les tortillas.", "Garnissez avec fromage et salade, roulez."],
 frittata:["Faites revenir l'oignon puis les épinards jusqu'à évaporation de l'eau.", "Versez les œufs battus, émiettez la feta.", "Cuisez 8 minutes à feu doux.", "Passez 3 minutes sous le grill et servez en parts."],
 patespoireaux:["Émincez les poireaux et faites-les fondre 12 minutes à couvert.", "Faites dorer les lardons à part et ajoutez-les.", "Versez la crème, poivrez.", "Mélangez avec les pâtes cuites."],
 tortellini:["Réchauffez le coulis avec les épinards 6 minutes.", "Cuisez les tortellini.", "Mélangez dans la sauce.", "Parsemez de parmesan."],
 flammekueche:["Préchauffez le four à 240 °C.", "Étalez la crème salée et poivrée sur les pâtes.", "Répartissez oignons émincés finement et lardons.", "Enfournez 12 minutes."],
 falafels:["Enfournez les falafels selon le paquet.", "Coupez tomates et concombre.", "Réchauffez les pitas.", "Garnissez de houmous, falafels, crudités et yaourt."],
 couscouslegumes:["Coupez les légumes en gros morceaux.", "Cuisez-les 20 minutes avec tomates, épices, pois chiches et 80 cl d'eau.", "Préparez la semoule à l'eau bouillante salée.", "Servez les légumes et leur bouillon sur la semoule."],
 croutechampi:["Faites revenir l'oignon puis les champignons émincés 10 minutes.", "Ajoutez la crème, salez, poivrez.", "Grillez les tranches de pain, garnissez, parsemez de fromage.", "Passez 3 minutes sous le grill. Servez avec la mâche."],
 lentilles:["Rincez les lentilles.", "Mettez-les avec carottes en rondelles, oignon et 1,2 L de bouillon.", "Ajoutez les saucisses après 10 minutes, cuisez 15 minutes de plus.", "Servez avec de la moutarde."],
 chourouge:["Cuisez les pommes de terre 20 minutes.", "Cuisez les saucisses à la poêle.", "Réchauffez le chou rouge avec les pommes en dés et le beurre 10 minutes.", "Servez tout ensemble."],
 maquereau:["Cuisez les haricots verts 8 minutes.", "Préparez la semoule à l'eau bouillante.", "Réchauffez doucement les filets de maquereau.", "Arrosez de citron et parsemez de persil."],
 lasagnepoele:["Faites dorer le haché avec l'oignon.", "Ajoutez le coulis et 50 cl d'eau, portez à ébullition.", "Ajoutez les feuilles de lasagne cassées, couvrez et cuisez 15 minutes en remuant.", "Couvrez de mozzarella 3 minutes."],
 patesgrecques:["Cuisez les pâtes.", "Faites sauter les tomates cerises 5 minutes avec origan et ail.", "Mélangez les pâtes, les tomates, la feta émiettée et les olives.", "Servez avec le concombre en dés."],
 quichepoireaux:["Préchauffez le four à 210 °C. Faites fondre les poireaux émincés 10 minutes.", "Battez œufs, crème et fromage, ajoutez les poireaux.", "Versez sur les pâtes dans deux moules.", "Enfournez 20 minutes."],
 tajine:["Dorez le poulet en morceaux dans une cocotte.", "Ajoutez oignons, carottes en rondelles, épices, pruneaux et 40 cl d'eau.", "Couvrez et laissez mijoter 20 minutes.", "Servez avec la semoule."],
 pouletchampi:["Dorez le poulet en lanières 6 minutes, réservez.", "Faites revenir les champignons 6 minutes.", "Ajoutez crème, une cuillère de moutarde et le poulet, 3 minutes.", "Servez avec les tagliatelles."],
 dindepoireaux:["Lancez le riz.", "Faites fondre les poireaux émincés 10 minutes.", "Dorez la dinde en lanières 6 minutes à feu vif.", "Mélangez avec la crème et une pincée de curry."],
 colin:["Lancez le riz. Faites fondre les poireaux 10 minutes.", "Ajoutez la crème, posez le poisson dessus.", "Couvrez et cuisez 8 minutes à feu doux.", "Arrosez de citron."],
 gyozas:["Dorez les gyozas 2 minutes, ajoutez un fond d'eau et couvrez 6 minutes.", "Cuisez les nouilles 3 minutes.", "Sautez brocoli et carottes 5 minutes.", "Servez avec la sauce soja."],
 padthai:["Trempez les nouilles 10 minutes dans l'eau chaude.", "Saisissez le poulet en lanières 5 minutes, poussez-le et brouillez les œufs.", "Ajoutez nouilles, germes, 4 cuillères de soja et le jus d'un citron vert.", "Servez avec les cacahuètes concassées."],
 bibimbap:["Lancez le riz.", "Dorez le haché avec 3 cuillères de soja.", "Sautez les carottes râpées et les épinards 3 minutes.", "Composez les bols et ajoutez un œuf au plat."],
 saltimbocca:["Couvrez chaque escalope d'une tranche de jambon cru et d'une feuille de sauge.", "Cuisez 3 minutes de chaque côté.", "Cuisez les spaghetti, mélangez avec zeste de citron, huile et parmesan.", "Servez avec la roquette."],
 enchiladas:["Préchauffez le four à 220 °C. Pochez le poulet 10 minutes, effilochez-le.", "Mélangez poulet, haricots, épices et un peu de coulis.", "Roulez dans les tortillas, couvrez de coulis et de fromage.", "Enfournez 12 minutes."],
 burritobowl:["Lancez le riz.", "Dorez le haché avec les épices et un peu d'eau.", "Réchauffez haricots et maïs.", "Composez les bols avec avocat et tomates."],
 risottopoireaux:["Faites dorer les lardons et les poireaux émincés.", "Ajoutez le riz 2 minutes.", "Versez le bouillon chaud louche par louche pendant 18 minutes.", "Finissez avec le parmesan."],
 canard:["Préchauffez le four à 220 °C. Coupez potimarron et pommes de terre en quartiers, huilez, enfournez 25 minutes.", "Quadrillez la peau du canard, cuisez 8 minutes côté peau puis 4 minutes de l'autre côté.", "Laissez reposer 5 minutes, badigeonnez de miel.", "Tranchez et servez avec les légumes et la mâche."],
 milanaise:["Mélangez chapelure et parmesan.", "Passez les escalopes dans l'œuf puis la chapelure.", "Dorez-les 2 à 3 minutes de chaque côté dans le beurre.", "Servez avec spaghetti et sauce tomate."],
 croquettes:["Cuisez les croquettes selon le paquet.", "Préparez une grande salade.", "Coupez les citrons en quartiers.", "Servez avec le pain."],
 saumonteriyaki:["Cuisez le saumon 4 minutes par face.", "Versez la sauce teriyaki, laissez laquer 2 minutes.", "Cuisez nouilles et brocoli, sautez-les ensemble 2 minutes.", "Parsemez de sésame."],
 raclette:["Cuisez les pommes de terre en robe des champs 20 minutes.", "Allumez l'appareil à raclette, ou préchauffez le grill du four.", "Disposez charcuterie et cornichons.", "Chacun fait fondre son fromage."],
 thonsteak:["Lancez riz et haricots.", "Saisissez le thon 2 minutes de chaque côté.", "Arrosez de citron et de soja.", "Servez aussitôt."],
 gambas:["Cuisez le riz avec une pincée de curcuma ou de safran.", "Faites revenir les poivrons en lanières 6 minutes.", "Saisissez les gambas 3 minutes avec 4 gousses d'ail.", "Parsemez de persil, arrosez de citron."],
 fondue:["Coupez le pain en cubes.", "Faites fondre le fromage à feu doux dans le caquelon frotté d'ail.", "Remuez en huit jusqu'à ce qu'il soit lisse.", "Posez le caquelon sur son réchaud et servez."],
 waterzooipoisson:["Cuisez pommes de terre et légumes en petits morceaux 15 minutes dans 1 L de bouillon.", "Ajoutez le poisson en gros cubes, 6 minutes à frémissement.", "Liez avec la crème.", "Servez en assiettes creuses."],
 pouletcompote:["Enfournez les frites selon le paquet.", "Faites dorer les aiguillettes 8 à 10 minutes dans le beurre, salez, poivrez, un peu de paprika.", "Préparez la salade.", "Servez avec la compote froide ou tiède."],
 liegeoise:["Cuisez les pommes de terre en morceaux et les œufs durs 10 minutes, les haricots 8 minutes.", "Faites dorer les lardons et les oignons émincés.", "Déglacez la poêle avec 4 cuillères de vinaigre.", "Mélangez le tout encore chaud, ajoutez les œufs en quartiers."],
 boulets:["Enfournez les frites. Mélangez haché, œuf, 4 cuillères de chapelure, sel, poivre ; formez 10 boulets.", "Faites-les dorer de tous côtés dans une cocotte.", "Ajoutez les oignons émincés, 40 cl de bouillon, 2 cuillères de sirop de Liège et un trait de vinaigre.", "Couvrez et laissez mijoter 15 minutes."],
 waterzooi:["Coupez légumes et pommes de terre en petits morceaux, le poulet en cubes.", "Cuisez légumes et pommes de terre 15 minutes dans 1 L de bouillon.", "Ajoutez le poulet 8 minutes.", "Hors du feu, liez avec la crème mélangée au jaune d'œuf."],
 carbonnades:["Faites dorer la viande en morceaux dans l'autocuiseur, ajoutez les oignons émincés.", "Versez la bière, posez les tranches de pain d'épices tartinées de moutarde.", "Fermez et cuisez 20 minutes après le sifflement.", "Pendant ce temps, enfournez les frites."],
 americain:["Enfournez les frites selon le paquet.", "Préparez la salade, les tomates et l'oignon haché.", "Servez l'américain bien frais avec les frites.", "Pour les plus jeunes ou une personne enceinte, passez-le 2 minutes à la poêle."],
 chicons:["Cuisez les pommes de terre 20 minutes.", "Coupez les chicons en deux, faites-les braiser 20 minutes au beurre, à couvert, avec une pincée de sucre.", "Ajoutez le jambon en lanières et le fromage les 3 dernières minutes.", "Écrasez les pommes de terre avec le lait et servez."],
 risotto:["Faites fondre l'oignon émincé dans le beurre, ajoutez le riz 2 minutes.", "Versez le bouillon chaud (1,2 L) louche par louche pendant 18 minutes en remuant.", "Faites dorer les champignons à part.", "Ajoutez champignons et parmesan hors du feu."],
 arrabbiata:["Faites revenir l'oignon et 2 gousses d'ail, ajoutez les tomates et laissez réduire 12 minutes.", "Cuisez les penne.", "Mélangez pâtes et sauce, ajoutez la mozzarella en dés.", "Pimentez dans les assiettes des grands."],
 pennepoulet:["Cuisez les penne.", "Faites dorer le poulet en dés 6 minutes.", "Ajoutez la crème et le pesto, laissez chauffer 2 minutes.", "Mélangez avec les pâtes et les tomates coupées."],
 minestrone:["Coupez les légumes en petits dés, faites-les revenir 5 minutes.", "Ajoutez tomates, haricots égouttés et 1,5 L d'eau salée, laissez cuire 15 minutes.", "Ajoutez les coquillettes pour les 8 dernières minutes.", "Servez avec le parmesan et la focaccia réchauffée."],
 piadina:["Garnissez la moitié de chaque piadina de jambon et de mozzarella.", "Repliez et faites dorer 2 minutes de chaque côté dans une poêle sèche.", "Ouvrez et ajoutez la roquette.", "Servez avec les tomates en salade."],
 souvlaki:["Coupez le porc en cubes, mélangez avec huile, origan, sel, citron.", "Piquez sur des brochettes ou poêlez 10 minutes à feu vif.", "Préparez la salade : tomates, concombre, feta, origan.", "Râpez un peu de concombre dans le yaourt pour le tzatziki."],
 keftedes:["Lancez le riz. Mélangez haché, oignon râpé, œuf, menthe, sel, poivre.", "Formez de petites boulettes et dorez-les 12 minutes à la poêle.", "Préparez le tzatziki : yaourt, concombre râpé, sel.", "Servez boulettes, riz et tzatziki."],
 teriyaki:["Lancez le riz et les haricots.", "Dorez le poulet en morceaux 8 minutes.", "Versez la sauce teriyaki, laissez caraméliser 3 minutes.", "Parsemez de sésame."],
 aigredoux:["Lancez le riz. Coupez porc, poivrons et oignon en morceaux.", "Saisissez le porc 5 minutes, ajoutez les légumes 5 minutes.", "Mélangez 4 cuillères de ketchup, 2 de soja, le jus de l'ananas, une cuillère de maïzena.", "Versez sur la viande avec l'ananas, laissez épaissir 2 minutes."],
 ramen:["Portez 2 L de bouillon à frémissement avec 4 cuillères de soja, pochez-y le poulet 10 minutes, puis effilochez-le.", "Cuisez les œufs 6 minutes 30, rafraîchissez-les.", "Ajoutez champignons émincés et nouilles au bouillon 4 minutes, puis les épinards.", "Servez en bols avec le poulet et un demi-œuf."],
 poke:["Cuisez le riz et laissez-le tiédir.", "Poêlez le saumon 4 minutes par face, émiettez-le.", "Coupez avocats, concombre, carottes râpées.", "Composez les bols et arrosez de sauce soja."],
 tacos:["Pochez le poulet 12 minutes dans l'eau salée, effilochez-le.", "Poêlez-le 3 minutes avec les épices et un peu d'eau.", "Coupez tomates et salade, écrasez les avocats.", "Réchauffez les tortillas et garnissez à table."],
 sincarne:["Lancez le riz. Faites revenir oignons et poivrons 5 minutes.", "Ajoutez épices, tomates, haricots et maïs égouttés.", "Laissez mijoter 15 minutes.", "Servez avec le riz et, si vous voulez, de la crème."],
 kefta:["Formez de petites boulettes avec le haché, sel, cumin.", "Dorez-les 5 minutes, ajoutez oignon et tomates, laissez mijoter 15 minutes.", "Préparez la semoule à l'eau bouillante.", "Râpez les carottes avec citron et cumin."],
 butterchicken:["Lancez le riz. Dorez le poulet en cubes dans la moitié du beurre.", "Ajoutez 2 cuillères de garam masala, le coulis, laissez mijoter 10 minutes.", "Ajoutez la crème et le reste du beurre 3 minutes.", "Réchauffez les naans au four."],
 galettes:["Chauffez une galette dans une poêle beurrée.", "Parsemez de fromage et de jambon, cassez un œuf au centre.", "Couvrez 3 minutes, jusqu'à ce que le blanc soit pris.", "Repliez les bords en carré et servez."],
 tartiflette:["Cuisez les pommes de terre en rondelles 12 minutes à l'eau. Préchauffez le grill.", "Dorez lardons et oignons.", "Mélangez dans un plat avec la crème, posez le reblochon coupé en deux.", "Passez 10 minutes sous le grill."],
 oeufsbrouilles:["Battez les œufs avec sel et poivre.", "Cuisez-les à feu doux dans le beurre en remuant sans arrêt 5 minutes.", "Grillez le pain.", "Servez avec le saumon en lanières."],
 burgerpoisson:["Cuisez les filets panés au four selon le paquet.", "Mélangez chou, carottes râpées et 3 cuillères de mayonnaise.", "Toastez les pains.", "Montez les burgers avec salade et poisson."],
 galettespdt:["Râpez les pommes de terre, pressez-les dans un torchon.", "Mélangez avec les œufs, sel, poivre.", "Faites dorer des petites galettes 4 minutes par face dans l'huile.", "Servez avec le saumon et la crème."],
 tofu:["Coupez le tofu en cubes, dorez-le 8 minutes.", "Cuisez les nouilles 3 minutes.", "Sautez brocoli et carottes 5 minutes.", "Mélangez tout avec 5 cuillères de soja."],
 pizzapain:["Préchauffez le four à 220 °C.", "Étalez le coulis sur les pitas, garnissez de jambon, champignons, mozzarella.", "Enfournez 10 minutes.", "Servez avec la salade."],
 orzo:["Dorez le poulet en dés 5 minutes, réservez.", "Faites revenir les courgettes, ajoutez l'orzo et 1 L de bouillon.", "Cuisez 10 minutes en remuant, ajoutez poulet et tomates.", "Finissez avec le parmesan."],
 dahl:["Émincez les oignons et faites-les revenir 3 minutes dans une casserole huilée avec la pâte de curry.", "Ajoutez les lentilles rincées, les tomates, le lait de coco et 50 cl d'eau.", "Laissez mijoter 15 minutes en remuant : les lentilles doivent fondre. Salez.", "Pendant ce temps, cuisez le riz. Servez le dahl sur le riz."],
 gratinpates:["Préchauffez le four à 220 °C et faites cuire les macaroni 2 minutes de moins que sur le paquet.", "Coupez le jambon en dés. Mélangez crème, lait, la moitié du fromage, sel et poivre.", "Mélangez pâtes, jambon et sauce dans un plat, couvrez du reste de fromage.", "Enfournez 12 minutes, jusqu'à ce que le dessus soit doré."],
 bolo:["Émincez l'oignon et râpez les carottes.", "Faites dorer le haché 5 minutes, ajoutez oignon et carottes, puis les tomates. Salez, poivrez.", "Laissez mijoter 15 minutes à feu doux.", "Cuisez les spaghetti et servez avec la sauce et le fromage."],
 boudin:["Épluchez les pommes de terre et cuisez-les 20 minutes à l'eau salée.", "Faites cuire le boudin 10 minutes à la poêle beurrée, à feu moyen, en le retournant.", "Écrasez les pommes de terre avec le lait chaud et le beurre.", "Servez avec la compote."],
 quesadillas:["Égouttez haricots et maïs, coupez le poivron en petits dés.", "Écrasez grossièrement les haricots à la fourchette.", "Sur une tortilla : haricots, maïs, poivron, fromage, puis une deuxième tortilla.", "Dorez 2 minutes de chaque côté dans une poêle sèche. Coupez en parts."],
 pesto:["Faites bouillir une grande casserole d'eau salée.", "Cuisez les pâtes, ajoutez les haricots verts 6 minutes avant la fin.", "Égouttez, mélangez avec le pesto.", "Servez avec les tomates cerises coupées en deux et le fromage."],
 shakshuka:["Émincez oignons et poivrons, faites-les fondre 8 minutes dans une grande poêle huilée.", "Ajoutez les tomates, salez, poivrez (cumin ou paprika si vous en avez) et laissez réduire 5 minutes.", "Creusez 10 petits puits et cassez-y les œufs.", "Couvrez et laissez cuire 6 à 8 minutes, jusqu'à ce que les blancs soient pris. Servez avec le pain."],
 gnocchis:["Faites dorer les gnocchis 8 minutes dans une grande poêle huilée.", "Ajoutez le coulis de tomate, salez, poivrez, laissez chauffer 3 minutes.", "Déchirez la mozzarella par-dessus et couvrez 2 minutes pour qu'elle fonde.", "Servez avec la salade."],
 hotdog:["Émincez les oignons et faites-les dorer 8 minutes à la poêle.", "Réchauffez les saucisses 5 minutes dans l'eau frémissante (sans bouillir).", "Passez les pains 3 minutes au four.", "Garnissez : saucisse, oignons, fromage. Servez avec les carottes râpées."],
 parmentier:["Cuisez les pommes de terre épluchées 20 minutes à l'eau salée. Préchauffez le grill.", "Faites revenir l'oignon puis le haché 8 minutes, salez, poivrez.", "Écrasez les pommes de terre avec le lait et le beurre.", "Haché au fond du plat, purée dessus, fromage, puis 5 minutes sous le grill."],
 couscous:["Coupez carottes et courgettes en morceaux. Faites-les revenir 5 minutes dans une casserole huilée.", "Ajoutez tomates, pois chiches égouttés, épices et 50 cl d'eau. Laissez mijoter 15 minutes.", "Grillez les merguez 10 minutes à la poêle.", "Versez 50 cl d'eau bouillante salée sur la semoule, couvrez 5 minutes, égrenez à la fourchette."],
 pouletcurry:["Lancez la cuisson du riz.", "Coupez le poulet en dés et les courgettes en demi-rondelles. Émincez l'oignon.", "Faites dorer le poulet 5 minutes, ajoutez oignon, courgettes et pâte de curry, puis 5 minutes de plus.", "Versez la crème, laissez mijoter 5 minutes. Servez avec le riz."],
 nouilles:["Cuisez les nouilles 3 minutes à l'eau bouillante, égouttez et rincez à l'eau froide.", "Coupez poulet, poivrons et carottes en fines lanières, émincez l'oignon.", "Saisissez le poulet 4 minutes à feu vif, ajoutez les légumes 4 minutes.", "Ajoutez les nouilles et 5 cuillères de sauce soja, mélangez 2 minutes."],
 cordonbleu:["Coupez les pommes de terre en dés et faites-les sauter 20 minutes dans une grande poêle huilée, à couvert les 10 premières minutes.", "Cuisez les haricots verts 8 minutes à l'eau salée.", "Faites dorer les cordons bleus 6 minutes de chaque côté dans le beurre.", "Servez le tout bien chaud."],
 cotesporc:["Cuisez les pommes de terre en robe des champs 20 minutes.", "Salez et poivrez les côtes, faites-les cuire 5 à 6 minutes de chaque côté dans le beurre.", "Coupez les pommes de terre en deux et passez-les 3 minutes dans la poêle de la viande.", "Servez avec la compote et la salade."],
 escalopes:["Coupez les blancs en escalopes fines. Passez-les dans l'œuf battu puis dans la chapelure.", "Cuisez les spaghetti et réchauffez le coulis de tomate.", "Faites dorer les escalopes 3 minutes de chaque côté dans une poêle bien huilée.", "Servez avec les pâtes et la salade."],
 pita:["Coupez le poulet en lanières, saisissez-le 8 minutes avec un peu de paprika.", "Râpez la moitié du concombre, mélangez au yaourt avec sel et ail : c'est le tzatziki.", "Coupez tomates, oignon et le reste du concombre.", "Réchauffez les pitas et garnissez-les."],
 volauvent:["Enfournez les frites selon le paquet.", "Faites pocher le poulet coupé en dés 10 minutes dans 40 cl d'eau avec les cubes de bouillon.", "Faites revenir les champignons, ajoutez poulet, 20 cl du bouillon et la crème. Laissez épaissir 5 minutes.", "Réchauffez les bouchées 5 minutes au four et garnissez-les."],
 wok:["Lancez la cuisson du riz.", "Saisissez le bœuf 2 minutes à feu très vif, réservez.", "Faites sauter brocoli, poivrons et oignon 6 minutes.", "Remettez le bœuf, ajoutez 4 cuillères de sauce soja, mélangez 1 minute."],
 burger:["Enfournez les frites selon le paquet.", "Coupez tomates et oignon en rondelles, lavez la salade.", "Cuisez les steaks 3 minutes de chaque côté, posez le cheddar dessus la dernière minute.", "Toastez les pains et montez les burgers."],
 steakfrites:["Enfournez les frites selon le paquet.", "Préparez la salade et les tomates.", "Saisissez les steaks dans le beurre bien chaud : 2 à 3 minutes par face pour saignant.", "Laissez reposer 2 minutes avant de servir."],
 saumon:["Préchauffez le four à 200 °C, lancez le riz.", "Posez les pavés dans un plat, salez, poivrez, un filet d'huile : 12 minutes au four.", "Cuisez le brocoli 6 minutes à l'eau ou à la vapeur.", "Mélangez la crème avec le jus du citron pour la sauce."],
 scampis:["Décongelez les scampis sous l'eau froide. Cuisez les tagliatelles.", "Faites revenir 3 gousses d'ail hachées dans l'huile, ajoutez les scampis 3 minutes.", "Versez la crème, salez, poivrez, laissez chauffer 2 minutes.", "Mélangez avec les pâtes et le persil haché."],
 tagsaumon:["Cuisez les tagliatelles.", "Chauffez doucement la crème avec le zeste du citron, salez peu, poivrez.", "Coupez le saumon en lanières.", "Hors du feu, mélangez pâtes, crème et saumon."],
 fajitas:["Coupez poivrons et oignons en lanières.", "Écrasez les avocats avec sel et un peu de citron : c'est le guacamole.", "Saisissez le bœuf 3 minutes à feu vif avec les épices, ajoutez les légumes 5 minutes.", "Réchauffez les tortillas et servez avec crème, fromage et guacamole."],
 moules:["Enfournez les frites. Rincez les moules et jetez celles qui restent ouvertes.", "Émincez céleri et oignons, faites-les fondre 5 minutes dans le beurre d'une grande casserole.", "Ajoutez les moules, couvrez et secouez : 6 à 8 minutes à feu vif, jusqu'à ce qu'elles s'ouvrent.", "Parsemez de persil et servez avec les frites."],
 cabillaud:["Lancez le riz. Émincez finement les poireaux.", "Faites fondre les poireaux 10 minutes dans le beurre, ajoutez la crème.", "Posez le cabillaud sur les poireaux, salez, poivrez, couvrez : 8 minutes à feu doux.", "Servez avec le riz."],
 carbo:["Faites bouillir une grande casserole d'eau salée.","Faites dorer les lardons à sec dans une poêle pendant 5 minutes.","Battez les œufs avec la crème et la moitié du fromage râpé, poivrez.","Cuisez les spaghetti selon le temps du paquet et gardez un petit verre d'eau de cuisson.","Hors du feu, mélangez les pâtes égouttées, les lardons et le mélange œufs-crème. Ajoutez un peu d'eau de cuisson s'il le faut pour une sauce onctueuse.","Servez avec le reste du fromage et la salade."],
 omelette:["Épluchez les pommes de terre et coupez-les en fines rondelles. Émincez les oignons.","Cuisez pommes de terre et oignons dans une grande poêle huilée, à couvert, pendant 15 minutes en remuant de temps en temps.","Battez les œufs avec le lait, salez et poivrez.","Versez sur les pommes de terre et laissez prendre 5 à 6 minutes à feu doux, à couvert.","Servez en parts avec la salade vinaigrette."],
 wraps:["Coupez le poulet en lanières et les poivrons en bandes.","Saisissez le poulet 5 minutes dans une poêle huilée, ajoutez les poivrons et poursuivez 5 minutes. Salez, poivrez (un peu de paprika si vous en avez).","Râpez les carottes et coupez les tomates en dés.","Réchauffez les tortillas 20 secondes à la poêle ou au micro-ondes.","Posez tout sur la table : chacun garnit et roule son wrap."],
 cantonais:["Cuisez le riz, ou utilisez du riz cuit la veille (il saute mieux froid).","Battez les œufs et cuisez-les en omelette fine, puis coupez-la en lanières.","Faites revenir l'oignon émincé 2 minutes, ajoutez les petits pois 3 minutes.","Ajoutez le riz et le jambon en dés, faites sauter 5 minutes à feu vif.","Ajoutez l'omelette et un trait de sauce soja, mélangez et servez."],
 croque:["Préchauffez le four à 220 °C (ou sortez l'appareil à croque-monsieur).","Beurrez les tranches de pain de mie sur une face.","Montez les croques : pain, jambon, fromage, pain, face beurrée à l'extérieur.","Enfournez 8 à 10 minutes jusqu'à ce qu'ils soient bien dorés.","Pendant ce temps, faites chauffer la soupe de tomates."],
 chili:["Émincez les oignons et le poivron, faites-les revenir 3 minutes dans l'huile avec une gousse d'ail.","Ajoutez le haché, émiettez-le et faites-le dorer 5 minutes.","Ajoutez les épices et les tomates concassées, salez et laissez mijoter 10 minutes.","Pendant ce temps, cuisez le riz.","Ajoutez les haricots rouges rincés, réchauffez 5 minutes et servez avec le riz."],
 quiche:["Préchauffez le four à 200 °C.","Déroulez les pâtes dans deux moules et piquez le fond à la fourchette.","Faites dorer les lardons 3 minutes à sec et répartissez-les sur les fonds.","Battez les œufs avec la crème et le lait, poivrez, versez sur les lardons et parsemez de fromage.","Enfournez 25 minutes jusqu'à ce que le dessus soit doré. Servez avec la salade."],
 stoemp:["Épluchez et coupez les pommes de terre et les carottes en morceaux, cuisez-les 20 minutes à l'eau salée.","Pendant ce temps, cuisez les saucisses à la poêle 15 à 20 minutes en les retournant.","Faites fondre l'oignon émincé dans un peu de beurre.","Égouttez les légumes et écrasez-les grossièrement avec le reste du beurre et l'oignon. Salez, poivrez, ajoutez une pointe de muscade.","Servez le stoemp avec les saucisses et la moutarde."],
 thon:["Cuisez les pâtes selon le temps du paquet.","Faites revenir l'oignon émincé 3 minutes dans l'huile.","Ajoutez les tomates concassées, salez, poivrez et laissez réduire 10 minutes.","Ajoutez le thon égoutté et émietté, réchauffez 2 minutes.","Mélangez avec les pâtes et servez avec le fromage râpé."],
 boulettes:["Mélangez le haché avec l'œuf, du sel et du poivre, puis formez des boulettes.","Lancez la cuisson du riz.","Faites dorer les boulettes 5 minutes dans une sauteuse huilée, puis retirez-les.","Faites revenir l'oignon émincé, ajoutez les tomates concassées, remettez les boulettes et laissez mijoter 15 minutes à couvert.","Servez avec le riz."],
 pizza:["Préchauffez le four à 220 °C.","Déroulez les pâtes à pizza sur les plaques du four.","Étalez le coulis, ajoutez le jambon, les champignons émincés et la mozzarella en tranches.","Enfournez 12 à 15 minutes jusqu'à ce que la pâte soit dorée.","Servez avec la salade."],
 poisson:["Épluchez et coupez les pommes de terre, cuisez-les 20 minutes à l'eau salée.","Cuisez les haricots verts surgelés 10 à 12 minutes à l'eau ou à la vapeur.","Cuisez le poisson pané au four ou à la poêle comme indiqué sur le paquet.","Égouttez les pommes de terre et écrasez-les avec le beurre et le lait chaud. Salez.","Servez le poisson avec la purée et les haricots."],
 soupe:["Lavez et coupez en morceaux les poireaux, les carottes, les pommes de terre et l'oignon.","Couvrez d'environ 2 litres d'eau, salez et ajoutez un cube de bouillon si vous en avez.","Laissez cuire 20 minutes puis mixez.","Pendant la cuisson, coupez les baguettes, garnissez de fromage et passez 5 minutes sous le gril.","Servez la soupe bien chaude avec les tartines."],
 curry:["Lancez la cuisson du riz.","Faites revenir l'oignon émincé 3 minutes, ajoutez la pâte de curry et remuez 1 minute.","Ajoutez les tomates concassées, le lait de coco et les pois chiches rincés.","Ajoutez les épinards surgelés et laissez mijoter 10 à 15 minutes.","Servez avec le riz."]
};
// Magasins autour de Ghlin
const MAGASINS = [
 {id:"inter",ens:"inter",nom:"Intermarché",lieu:"Av. de la Libération, Ghlin",lat:50.4749,lon:3.8999},
 {id:"lidl",ens:"lidl",nom:"Lidl",lieu:"Route de Mons, Ghlin",lat:50.4712,lon:3.9189},
 {id:"delhaize",ens:"delhaize",nom:"Delhaize Shop & Go",lieu:"Rue de Mons, Ghlin",lat:50.4690,lon:3.9212},
 {id:"aldi-jemappes",ens:"aldi",nom:"Aldi",lieu:"Av. Wilson, Jemappes",lat:50.4495,lon:3.9016},
 {id:"aldi-baudarts",ens:"aldi",nom:"Aldi",lieu:"Résidence des Baudarts, Mons",lat:50.4628,lon:3.9420},
 {id:"carrefour",ens:"carrefour",nom:"Carrefour",lieu:"Grands Prés, Mons",lat:50.4557,lon:3.9328},
 {id:"delhaize-nimy",ens:"delhaize",nom:"Delhaize",lieu:"Rue de Nimy, Mons",lat:50.4593,lon:3.9552},
 {id:"spar-quaregnon",ens:"spar",nom:"Spar",lieu:"Chemin du Bon Dieu, Quaregnon",lat:50.4378,lon:3.8702},
 {id:"delhaize-hornu",ens:"delhaize",nom:"Delhaize",lieu:"Rue de Mons, Hornu",lat:50.4375,lon:3.8392},
 {id:"carrefour-stg",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue du Sas, Saint-Ghislain",lat:50.4563,lon:3.8134},
 {id:"colruyt",ens:"colruyt",nom:"Colruyt",lieu:"Chaussée de Binche, Mons",lat:50.4528,lon:3.9768},
 {id:"delhaize-roeulx",ens:"delhaize",nom:"Delhaize",lieu:"Chaussée du Roeulx, Mons",lat:50.4551,lon:3.9837},
 {id:"spar-hyon",ens:"spar",nom:"Spar",lieu:"Chaussée de Maubeuge, Hyon",lat:50.4276,lon:3.9469},
 {id:"carrefour-casteau",ens:"carrefour",nom:"Carrefour Market",lieu:"Shopping Shape, Casteau",lat:50.5039,lon:3.9725},
 {id:"okay-frameries",ens:"okay",nom:"OKay",lieu:"Rue de l'Industrie, Frameries",lat:50.4106,lon:3.8719},
 {id:"okay-brugelette",ens:"okay",nom:"OKay",lieu:"Chaussée de Mons, Brugelette",lat:50.5862,lon:3.8478},
 {id:"bioplanet-mons",ens:"bioplanet",nom:"Bio-Planet",lieu:"Chaussée du Roeulx, Mons",lat:50.4562,lon:3.9757},
 {id:"colruyt-jemappes",ens:"colruyt",nom:"Colruyt",lieu:"Av. Wilson, Jemappes",lat:50.4479,lon:3.9062},
 {id:"lidl-jemappes",ens:"lidl",nom:"Lidl",lieu:"Av. Wilson, Jemappes",lat:50.4498,lon:3.9091},
 {id:"aldi-binche",ens:"aldi",nom:"Aldi",lieu:"Chaussée de Binche, Mons",lat:50.4527,lon:3.9747},
 {id:"inter-maisieres",ens:"inter",nom:"Intermarché",lieu:"Rue Grande, Maisières",lat:50.4914,lon:3.9696},
 {id:"inter-procession",ens:"inter",nom:"Intermarché",lieu:"Chemin de la Procession, Mons",lat:50.4583,lon:3.9765},
 {id:"inter-frameries",ens:"inter",nom:"Intermarché",lieu:"Route Nationale, Frameries",lat:50.4173,lon:3.8749},
 {id:"inter-boussu",ens:"inter",nom:"Intermarché",lieu:"Rue des Chaufours, Boussu",lat:50.4199,lon:3.8018},
 {id:"delhaize-dolez",ens:"delhaize",nom:"Delhaize Shop & Go",lieu:"Boulevard Dolez, Mons",lat:50.4493,lon:3.9549},
 {id:"louisdelhaize-binche",ens:"louisdelhaize",nom:"Louis Delhaize",lieu:"Chaussée de Binche, Mons",lat:50.4489,lon:3.9898},
 {id:"okay-givry",ens:"okay",nom:"OKay",lieu:"Chaussée de Beaumont, Givry",lat:50.3786,lon:4.0373},
 {id:"lidl-binche",ens:"lidl",nom:"Lidl",lieu:"Route de Mons, Binche",lat:50.4140,lon:4.1450},
 {id:"aldi-binche-zf",ens:"aldi",nom:"Aldi",lieu:"Rue Zéphirin Fontaine, Binche",lat:50.4160,lon:4.1600},
 {id:"colruyt-binche",ens:"colruyt",nom:"Colruyt",lieu:"Rue Zéphirin Fontaine, Binche",lat:50.4165,lon:4.1580},
 {id:"carrefour-binche",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue de Robiano, Binche",lat:50.4110,lon:4.1700},
 {id:"delhaize-epinois",ens:"delhaize",nom:"Delhaize",lieu:"Rue Saint-Fiacre, Épinois",lat:50.4050,lon:4.2094},
 {id:"carrefour-leval",ens:"carrefour",nom:"Carrefour Market",lieu:"Rue Salvador Allende, Leval-Trahegnies",lat:50.4165,lon:4.2181},
 {id:"okay-roeulx",ens:"okay",nom:"OKay",lieu:"Rue d'Houdeng, Le Rœulx",lat:50.5004,lon:4.1179}
];
// Enseignes : les promotions sont relevées par enseigne et valent dans tous ses magasins
const ENS = {autre:"Autre",inter:"Intermarché",lidl:"Lidl",delhaize:"Delhaize",aldi:"Aldi",carrefour:"Carrefour",colruyt:"Colruyt",okay:"OKay",bioplanet:"Bio-Planet",spar:"Spar",louisdelhaize:"Louis Delhaize",ah:"Albert Heijn",jumbo:"Jumbo",match:"Match",cora:"Cora",eurospar:"Eurospar"};
const ensOf = id => { const m=MAGASINS.find(x=>x.id===id); return m?m.ens:id; };
// Domicile approximatif (Ghlin) ; distance routière estimée = vol d'oiseau × 1,3
let HOME = {nom:"Ghlin",lat:50.48,lon:3.88};
// Points de départ proposés (centre approximatif de chaque localité)
const COMMUNES = [
 ["Ghlin",50.4800,3.8800],["Mons (centre)",50.4542,3.9523],["Jemappes",50.4515,3.8890],["Nimy",50.4719,3.9496],["Maisières",50.4870,3.9640],
 ["Cuesmes",50.4386,3.9264],["Hyon",50.4386,3.9708],["Havré",50.4600,4.0400],["Casteau",50.5150,3.9850],["Jurbise",50.5300,3.9100],
 ["Baudour",50.4800,3.8320],["Saint-Ghislain",50.4500,3.8183],["Hornu",50.4330,3.8290],["Boussu",50.4342,3.7953],["Quaregnon",50.4404,3.8649],
 ["Frameries",50.4083,3.8962],["Quévy",50.3700,3.9400],["Erquelinnes",50.3080,4.1100]
];
function km(a,b){ const R=6371, toR=x=>x*Math.PI/180, dLa=toR(b.lat-a.lat), dLo=toR(b.lon-a.lon);
  const h=Math.sin(dLa/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h))*1.3; }
const MAGBYID = id => MAGASINS.find(m=>m.id===id);
const COUT_KM = 0.25; // carburant + usure, estimation
const PREF_EUR = 0.6;  // valeur d'un rang de préférence, en euros
// magasins retenus : dans un rayon de 10 à 15 km autour du domicile (à vol d'oiseau), réglable
const rayonKm = () => [10,12,15].includes(state.rayon) ? state.rayon : 15;
const inRayon = m => !!m && km(HOME,m) <= rayonKm();
const orderedStores = () => { const l=state.storeOrder.map(MAGBYID).filter(Boolean), near=l.filter(inRayon); return near.length?near:l; };
function prefBonus(id){ const act=state.storeOrder, r=act.indexOf(id); return r<0?0:(act.length-1-r)*PREF_EUR; }
const MAGNOM = new Proxy({}, {get:(_,id)=>{ const m=MAGASINS.find(x=>x.id===id); if(!m) return ENS[id]||id; const twin=(state&&state.storeOrder||[]).filter(x=>x!==id&&MAGASINS.find(y=>y.id===x&&y.nom===m.nom)).length; return twin? m.nom+" "+m.lieu.split(", ").pop() : m.nom; }});
// Promotions relevées le 13/11/2026 (folders et PrijsProfeet). ing = ingrédient des recettes concerné
let RELEVE = "13 novembre 2026";
const PROMOS = [
 {mag:"colruyt",produit:"Barilla Spaghettoni n°7",prix:0.99,avant:1.99,du:"2026-11-04",au:"2026-11-17",ing:"Spaghetti"},
 {mag:"colruyt",produit:"Champignons shimeji Boni",prix:0.99,avant:1.99,du:"2026-11-04",au:"2026-11-17",ing:"Champignons"},
 {mag:"delhaize",produit:"Beurre doux Balade",prix:1.34,avant:2.69,du:"2026-11-12",au:"2026-11-18",ing:"Beurre"},
 {mag:"delhaize",produit:"Carottes de Hesbaye",prix:1.49,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Carottes"},
 {mag:"delhaize",produit:"Herta jambon cuit (folder)",prix:4.49,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Jambon cuit"},
 {mag:"delhaize",produit:"Emmental Mifroma (folder)",prix:4.12,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Fromage râpé"},
 {mag:"delhaize",produit:"Penne rigate Soubry (folder)",prix:4.65,avant:null,du:"2026-11-12",au:"2026-11-18",ing:"Penne"},
 {mag:"lidl",produit:"Haché préparé porc et bœuf",prix:2.49,avant:3.79,du:"2026-11-16",au:"2026-11-21",ing:"Haché porc-bœuf"},
 {mag:"lidl",produit:"Pommes de terre chair ferme XXL",prix:5.99,avant:8.94,du:"2026-11-16",au:"2026-11-21",ing:"Pommes de terre"}
];
// ---- Dates : semaine planifiée et validité des promos ----
const isoDate = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const TODAY = (()=>{const t=new Date(); t.setHours(0,0,0,0); return t;})();
let MONDAY = (()=>{const dow=(TODAY.getDay()+6)%7; const m=new Date(TODAY); m.setDate(TODAY.getDate()-dow+(dow>=4?7:0)); return m;})();
const BASE_MONDAY = new Date(MONDAY);
const isoOf = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const curIso = () => isoOf(MONDAY);
const dayOffset = n => { const d=new Date(MONDAY); d.setDate(MONDAY.getDate()+n); return d; };
const fmtD = d => d.toLocaleDateString("fr-BE",{weekday:"short",day:"2-digit",month:"2-digit"});
const fmtShort = d => d.toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit"});
const DAY = 86400000;
const validOn = (p,date) => isoDate(p.du)<=date && date<=isoDate(p.au);
function promoStatus(p){
  const du=isoDate(p.du), au=isoDate(p.au);
  if(TODAY<du){const n=Math.round((du-TODAY)/DAY); return {cls:"soon",txt:n===1?"Commence demain":`Commence dans ${n} jours`};}
  if(TODAY>au) return {cls:"over",txt:"Terminée"};
  const left=Math.round((au-TODAY)/DAY);
  return left===0?{cls:"last",txt:"Dernier jour"}:{cls:left<=2?"last":"on",txt:`Encore ${left+1} jours`};
}
const INDICE = [{nom:"Aldi",v:-5.2},{nom:"Colruyt",v:-2.8},{nom:"Albert Heijn",v:1.0},{nom:"Delhaize",v:4.1}];
// promos encore valables pendant la semaine planifiée (à partir de la 1re course)
const promosFor = n => PROMOS.filter(p=>p.ing===n && isoDate(p.au)>=tripDate(0) && isoDate(p.du)<=dayOffset(6));
const promoCount = r => new Set(r.ing.filter(([n])=>promosFor(n).length).map(([n])=>n)).size;
const eur = v => v.toLocaleString("fr-BE",{style:"currency",currency:"EUR"});
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DEFAUT = ["carbo","omelette","wraps","cantonais","croque","chili","quiche"];
const KEY = "menus-semaine-v1";

let state = {week:[...DEFAUT], persons:5, checked:{}, tab:"menu", picking:null, family:[], cooks:Array(7).fill(null), prices:{}, trip1:"sam", trip2:3, tripStore:[null,null], gamme:"eco", maxStores:1, seuil:2, weekOffset:0, weeks:{}, statut:"proposition", journal:[], approbations:{}, limite:null, exterieur:null, outDefault:[5], absents:{}, invites:[0,0,0,0,0,0,0], extras:[], emails:{}, perso:[], avis:{}, exclus:{}, storePref:null, onboarded:false};
try{const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s&&Array.isArray(s.perso)) s.perso.forEach(registerRecipe); if(s&&Array.isArray(s.week)&&s.week.every(id=>BYID[id])) state={...state,...s,picking:null};}catch(e){}
if(!Array.isArray(state.family)) state.family=[];
if(!state.prices||typeof state.prices!=="object") state.prices={};
if(!["sam","lun"].includes(state.trip1)) state.trip1="sam";
if(![2,3,4].includes(state.trip2)) state.trip2=3;
if(!Array.isArray(state.tripStore)||state.tripStore.length!==2) state.tripStore=[null,null];
if(!["eco","equi","qual"].includes(state.gamme)) state.gamme="eco";
state.family=Array.isArray(state.family)?[...new Set(state.family.map(x=>propre(x,30)).filter(Boolean))].slice(0,20):[];
const cleanMix=m=>(m&&typeof m==="object")?{plaisir:Math.max(0,Math.min(7,m.plaisir|0)),moyen:Math.max(0,Math.min(7,m.moyen|0))}:null;
state.mix=cleanMix(state.mix)||{plaisir:1,moyen:2};
if(![1,2].includes(state.maxStores)) state.maxStores=1;
if(![1,2,3,5].includes(state.seuil)) state.seuil=2;
if(!state.weeks||typeof state.weeks!=="object") state.weeks={};
if(!Array.isArray(state.customStores)) state.customStores=[];
state.customStores=state.customStores.filter(m=>m&&typeof m.id==="string"&&/^c[a-z0-9]{3,20}$/.test(m.id)&&typeof m.lat==="number"&&typeof m.lon==="number"&&ENS[m.ens]).slice(0,30);
const cleanTxt = t => String(t==null?"":t).replace(/[<>&"'`]/g,"").trim();
if(!Array.isArray(state.osmStores)) state.osmStores=[];
state.osmStores=state.osmStores.filter(m=>m&&typeof m.id==="string"&&/^(o[nwr]\d{1,14}|g[A-Za-z0-9_-]{6,90})$/.test(m.id)&&typeof m.lat==="number"&&typeof m.lon==="number"&&ENS[m.ens]).slice(0,80);
if(!state.storeFix||typeof state.storeFix!=="object") state.storeFix={};
Object.entries(state.storeFix).forEach(([id,c])=>{ const m=MAGASINS.find(x=>x.id===id); if(m&&c&&typeof c.lat==="number"&&typeof c.lon==="number"){ m.lat=c.lat; m.lon=c.lon; if(c.lieu) m.lieu=cleanTxt(c.lieu).slice(0,80); m.osm=true; } });
state.osmStores.forEach(m=>{ if(!MAGASINS.some(x=>x.id===m.id)) MAGASINS.push({id:m.id,ens:m.ens,nom:cleanTxt(m.nom).slice(0,40),lieu:cleanTxt(m.lieu).slice(0,80),lat:m.lat,lon:m.lon,osm:true}); });
state.customStores.forEach(m=>{ if(!MAGASINS.some(x=>x.id===m.id)) MAGASINS.push({id:m.id,ens:m.ens,nom:propre(m.nom,40)||ENS[m.ens],lieu:propre(m.lieu,80),lat:m.lat,lon:m.lon,perso:true}); });
if(state.home&&typeof state.home.lat==="number"&&typeof state.home.lon==="number"&&state.home.lat>49.3&&state.home.lat<51.6&&state.home.lon>2.4&&state.home.lon<6.5) HOME={nom:String(state.home.nom||"Mon domicile").slice(0,90),lat:state.home.lat,lon:state.home.lon,precision:state.home.precision==="exacte"?"exacte":"localite"}; else state.home=null;
if(!Number.isInteger(state.weekOffset)||state.weekOffset<0||state.weekOffset>3) state.weekOffset=0;
if(!["proposition","valide"].includes(state.statut)) state.statut="proposition";
if(!Array.isArray(state.journal)) state.journal=[];
if(!state.approbations||typeof state.approbations!=="object") state.approbations={};
if(typeof state.limite!=="string") state.limite=null;
const cleanDays=a=>Array.isArray(a)?[...new Set(a.filter(x=>Number.isInteger(x)&&x>=0&&x<7))].sort():null;
state.outDefault=cleanDays(state.outDefault)||[5]; state.exterieur=cleanDays(state.exterieur);
if(!state.absents||typeof state.absents!=="object") state.absents={};
if(!state.emails||typeof state.emails!=="object") state.emails={};
if(!Array.isArray(state.perso)) state.perso=[];
if(!state.avis||typeof state.avis!=="object") state.avis={};
if(!state.exclus||typeof state.exclus!=="object") state.exclus={};
if(state.storePref&&!MAGASINS.some(m=>m.id===state.storePref)) state.storePref=null;
// ordre de préférence des magasins (le premier est le magasin habituel)
{ const ids=MAGASINS.map(m=>m.id);
  let o=Array.isArray(state.storeOrder)?state.storeOrder.filter(id=>ids.includes(id)):[];
  if(!o.length) o=["inter","lidl","delhaize","carrefour","colruyt"];
  if(Array.isArray(state.storeOff)) o=o.filter(id=>!state.storeOff.includes(id));
  if(!o.length) o=["inter"];
  if(state.storePref){ o=[state.storePref,...o.filter(id=>id!==state.storePref)]; if(!state.storeMode) state.storeMode="fixe"; state.storePref=null; }
  state.storeOrder=o;
  state.storeOff=[];
  if(!["auto","fixe"].includes(state.storeMode)) state.storeMode="auto"; }
if(!Array.isArray(state.invites)||state.invites.length!==7) state.invites=[0,0,0,0,0,0,0];
// semaine affichée au démarrage
function setMonday(off){ MONDAY=new Date(BASE_MONDAY); MONDAY.setDate(BASE_MONDAY.getDate()+7*off); }
setMonday(state.weekOffset);
function stashWeek(){ state.weeks[curIso()]={menu:[...state.week],cooks:[...state.cooks],checked:{...state.checked},statut:state.statut,journal:state.journal.slice(0,15),approbations:JSON.parse(JSON.stringify(state.approbations)),limite:state.limite,exterieur:state.exterieur,absents:JSON.parse(JSON.stringify(state.absents)),invites:[...state.invites],extras:JSON.parse(JSON.stringify(state.extras||[])),quantites:{...(state.qtEdit||{})},tickets:JSON.parse(JSON.stringify(state.tickets||[]))};
  // ne garder que les semaines récentes
  const limit=new Date(BASE_MONDAY); limit.setDate(limit.getDate()-14); Object.keys(state.weeks).forEach(k=>{ if(isoDate(k)<limit) delete state.weeks[k]; }); }
function applyValidation(){ if(DB){ state.statut = VALID[curIso()]==="valide" ? "valide" : "proposition"; state.limite = LIMITES[curIso()]||null; } }
function applyWeekData(w){ state.week=[...w.menu]; state.cooks=(Array.isArray(w.cooks)&&w.cooks.length===7)?w.cooks.map(x=>propre(x,30)||null):Array(7).fill(null); state.checked={...(w.checked||{})}; state.statut=w.statut||"proposition"; state.journal=Array.isArray(w.journal)?w.journal:[];
  state.approbations=(w.approbations&&typeof w.approbations==="object")?JSON.parse(JSON.stringify(w.approbations)):{}; state.limite=typeof w.limite==="string"?w.limite:null; state.exterieur=cleanDays(w.exterieur);
  state.absents=(w.absents&&typeof w.absents==="object")?JSON.parse(JSON.stringify(w.absents)):{}; if(window.__dbReady) applyValidation(); state.invites=(Array.isArray(w.invites)&&w.invites.length===7)?w.invites.map(x=>Math.max(0,Math.min(20,+x||0))):[0,0,0,0,0,0,0]; state.extras=cleanExtras(w.extras); state.qtEdit=cleanQt(w.quantites); state.tickets=cleanTickets(w.tickets); }
function cleanQt(o){ const r={}; if(o&&typeof o==="object") Object.entries(o).slice(0,300).forEach(([k,v])=>{ if(typeof k==="string"&&k.length<=90&&typeof v==="string"&&v.trim()) r[k]=propre(v,20); }); return r; }
function cleanTickets(a){ return Array.isArray(a)?a.filter(x=>x&&+x.montant>0&&+x.montant<5000).slice(0,10).map(x=>({montant:Math.round(+x.montant*100)/100,mag:typeof x.mag==="string"?x.mag.replace(/[<>"'`]/g,"").slice(0,40):"",quand:typeof x.quand==="string"?x.quand.slice(0,30):"",estime:+x.estime>0?Math.round(+x.estime*100)/100:null,par:propre(x.par,30)})):[]; }
{ const w=state.weeks[curIso()]; if(w&&Array.isArray(w.menu)&&w.menu.length===7&&w.menu.every(id=>BYID[id])) applyWeekData(w); }
if(!Array.isArray(state.cooks)||state.cooks.length!==7) state.cooks=Array(7).fill(null);
function save(){ saveLocal(); if(typeof shareSync==="function"){ shareSync(); familySync(); goutsSync(); } }
function saveLocal(){ stashWeek(); try{localStorage.setItem(KEY,JSON.stringify({outDefault:state.outDefault,mix:state.mix,rayon:state.rayon,vueMenu:state.vueMenu,customStores:state.customStores,osmStores:state.osmStores,osmAt:state.osmAt,storeFix:state.storeFix,home:state.home,perso:state.perso,avis:state.avis,exclus:state.exclus,storeOrder:state.storeOrder,storeOff:state.storeOff,storeMode:state.storeMode,onboarded:state.onboarded,emails:state.emails,weekOffset:state.weekOffset,weeks:state.weeks,statut:state.statut,journal:state.journal,week:state.week,persons:state.persons,checked:state.checked,tab:state.tab,family:state.family,cooks:state.cooks,prices:state.prices,trip1:state.trip1,trip2:state.trip2,tripStore:state.tripStore,gamme:state.gamme,maxStores:state.maxStores,seuil:state.seuil}))}catch(e){}}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function cookSelect(d,extra=""){
  const v=state.cooks[d];
  if(!state.family.length) return `<span class="empty">Ajoutez la famille dans Réglages</span>`;
  return `<select data-cook="${d}" class="${v?"set":""}" aria-label="Qui cuisine le ${JOURS[d]}"${extra}><option value="">Personne</option>${state.family.map(n=>`<option${n===v?" selected":""}>${esc(n)}</option>`).join("")}</select>`;
}

const nf = new Intl.NumberFormat("fr-BE",{maximumFractionDigits:2});
function plural(u,c){ if(!u||c<=1) return u; if(u.endsWith("s")) return u; if(u.endsWith("eau")) return u+"x"; return u+"s"; }
const qtyOf = i => (state.qtEdit&&state.qtEdit[i.k]) ? state.qtEdit[i.k] : i.x ? (i.qt||"") : fmt(i.q,i.u);
function fmt(q,u){
  if(u==="g"){ q=Math.max(50,Math.round(q/50)*50); return q>=1000? nf.format(q/1000)+" kg" : q+" g"; }
  if(u==="cl"){ q=Math.max(5,Math.round(q/5)*5); return q>=100? nf.format(q/100)+" L" : q+" cl"; }
  const c=Math.max(1,Math.ceil(q-1e-9)); return u? c+" "+plural(u,c) : String(c);
}
// Nombre de personnes à table : présences de la famille + invités, sinon le réglage général
const outList = ex => Array.isArray(ex) ? ex : state.outDefault;
function isOut(d){ return d!==undefined && d!==null && outList(state.exterieur).includes(d); }
function toggleOut(d){ const cur=new Set(outList(state.exterieur)); cur.has(d)?cur.delete(d):cur.add(d); state.exterieur=[...cur].sort(); save(); render(); if(modalCtx) renderModal();
  toast(isOut(d)?`${JOURS[d]} : repas à l'extérieur, pas de courses`:`${JOURS[d]} : on mange à la maison`); }
const homeDays = () => JOURS.map((_,d)=>d).filter(d=>!isOut(d));
// ---- Ce qui manque pour valider : un plat et un cuisinier pour chaque soir où quelqu'un mange à la maison ----
function manques(){ const l=[];
  homeDays().filter(d=>headcount(d)>0).forEach(d=>{ const j=JOURS[d].toLowerCase();
    if(!BYID[state.week[d]]) l.push({d,court:"pas de plat le "+j}); else if(!state.cooks[d]) l.push({d,court:"pas de cuisinier le "+j}); });
  return l; }
// ---- Bulles d'aide : au survol (souris) ou au clavier, sur tout élément portant data-tip ----
(function(){ let bulle=null, minuteur=null, cible=null;
  const montrer=el=>{ const t=el.getAttribute("data-tip"); if(!t) return; if(!bulle){ bulle=document.createElement("div"); bulle.className="tip"; bulle.setAttribute("role","tooltip"); document.body.appendChild(bulle); }
    bulle.textContent=t; bulle.hidden=false; const r=el.getBoundingClientRect(), w=Math.min(280,innerWidth-24); bulle.style.maxWidth=w+"px";
    const bw=bulle.offsetWidth, bh=bulle.offsetHeight; let x=Math.max(12,Math.min(innerWidth-bw-12,r.left+r.width/2-bw/2)), y=r.bottom+8; if(y+bh>innerHeight-8) y=r.top-bh-8;
    bulle.style.left=x+"px"; bulle.style.top=y+"px"; };
  const cacher=()=>{ clearTimeout(minuteur); cible=null; if(bulle) bulle.hidden=true; };
  document.addEventListener("pointerover",e=>{ if(e.pointerType!=="mouse") return; const el=e.target.closest("[data-tip]"); if(el===cible) return; cacher(); if(!el) return; cible=el; minuteur=setTimeout(()=>montrer(el),350); });
  document.addEventListener("focusin",e=>{ const el=e.target.closest&&e.target.closest("[data-tip]"); cacher(); if(el&&el.matches(":focus-visible")){ cible=el; montrer(el); } });
  // sur téléphone : appui long sur un bouton pour voir son aide (l'action n'est alors pas déclenchée)
  let appui=null, bloquerClic=false;
  document.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse") return; const el=e.target.closest("[data-tip]"); if(!el) return;
    appui=setTimeout(()=>{ cible=el; montrer(el); bloquerClic=true; setTimeout(cacher,3500); },550); },true);
  ["pointerup","pointercancel","pointermove"].forEach(ev=>document.addEventListener(ev,e=>{ if(ev==="pointermove"&&Math.abs(e.movementX||0)+Math.abs(e.movementY||0)<6) return; clearTimeout(appui); },true));
  document.addEventListener("click",e=>{ if(bloquerClic){ bloquerClic=false; e.preventDefault(); e.stopPropagation(); } },true);
  document.addEventListener("contextmenu",e=>{ if(e.target.closest&&e.target.closest("[data-tip]")) e.preventDefault(); });
  ["focusout","scroll","keydown"].forEach(ev=>document.addEventListener(ev,cacher,true));
  document.addEventListener("click",()=>{ if(!bloquerClic) cacher(); },true);
})();
function manquesTexte(m){ const liste=l=>l.length>1?l.slice(0,-1).join(", ")+" et "+l[l.length-1]:l[0];
  const j=x=>JOURS[x.d].toLowerCase(), pc=m.filter(x=>x.court.startsWith("pas de cuisinier")).map(j), pp=m.filter(x=>x.court.startsWith("pas de plat")).map(j);
  return [pp.length?"il manque un plat "+liste(pp):"",pc.length?"il manque un cuisinier "+liste(pc):""].filter(Boolean).join(" ; "); }
// ---- Vue calendrier : la semaine comme dans l'export PDF, cases à compléter en orange ----
function renderCalendrier(){ const box=$("calendrier"), liste=$("days"); if(!box||!liste) return;
  const cal=(state.vueMenu||(innerWidth>=700?"cal":"liste"))==="cal"; box.hidden=!cal; liste.hidden=cal;
  document.querySelectorAll("[data-vue]").forEach(b=>b.classList.toggle("on",(b.dataset.vue==="cal")===cal));
  if(!cal) return;
  const cases=menuRows().map(x=>{ const today=x.date.getTime()===TODAY.getTime(), head=`<span class="chead"><span>${JOURS[x.d]}</span><small>${fmtShort(x.date)}</small></span>`;
    if(x.out) return `<div class="cbox dehors">${head}<span class="cvide"><b>Pas de repas à la maison</b><span>Soir à l'extérieur</span><button class="chip edit-only" data-acout="${x.d}" type="button">Prévoir un repas</button></span></div>`;
    if(!x.hc) return `<div class="cbox dehors">${head}<span class="cvide"><b>Personne à table</b><span>Tout le monde est absent</span></span></div>`;
    if(!x.r) return `<div class="cbox manque">${head}<span class="cvide"><b>Aucun plat prévu</b><button class="chip on edit-only" data-cpick="${x.d}" type="button">Choisir un plat</button></span></div>`;
    const sansCuisinier=!x.cook;
    return `<div class="cbox${today?" today":""}${sansCuisinier?" manque":""}" data-copen="${x.d}" role="button" tabindex="0" aria-label="${JOURS[x.d]} : ${esc(x.r.nom)}">${head}
      <img src="${photoSrc(x.r.id)}" alt="" loading="lazy" data-cache-err="1">
      <span class="cbody"><b>${esc(x.r.nom)}</b>${x.r.acc?`<small>avec ${esc(x.r.acc.toLowerCase())}</small>`:""}<small><span class="bdg b-${budgetOf(x.r)}">${BUDGETS[budgetOf(x.r)].court}</span> ${x.r.t} min${x.abs.length?` · absent : ${x.abs.map(esc).join(", ")}`:""}${x.inv?` · +${x.inv} invité${x.inv>1?"s":""}`:""}</small></span>
      <span class="cfoot"><span><small>Cuisine</small>${sansCuisinier?(state.family.length?`<span class="edit-only">${cookSelect(x.d)}</span>`:"<b>à définir</b>"):`<b>${esc(x.cook)}</b>`}</span><span><small>Couverts</small><span class="ccouv">${x.hc}</span></span></span></div>`; });
  const m=manques(), {ok}=approvalStats();
  cases.push(`<div class="cbox bref"><span class="chead"><span>La semaine en bref</span></span><span class="cbody">
    <small>${homeDays().length} soirs à la maison · ${totalCouverts()} couverts</small><small>Budget ≈ ${eur(weekCost(state.gamme))}</small>
    ${state.family.length?`<small>Validations : ${ok.length}/${state.family.length}</small>`:""}
    ${state.statut!=="valide"&&decompte(limiteDate())?`<small>Réponses avant ${esc(limiteTxt())} · il reste <b data-compte="${limiteDate().getTime()}">${decompte(limiteDate())}</b></small>`:""}
    <b style="color:${m.length?"var(--warm)":"var(--accent)"}">${m.length?"À compléter : "+esc(manquesTexte(m)):"✓ Prêt à être validé"}</b></span></div>`);
  box.innerHTML=cases.join("")+`<p class="calleg"><span><i style="background:var(--warm)"></i>à compléter</span><span><i style="background:var(--muted)"></i>pas de repas à la maison</span><span><i style="background:var(--accent)"></i>prêt</span></p>`; }
document.addEventListener("click",e=>{ const pd=e.target.closest("[data-pdfdirect]"); if(pd){ const t=pd.textContent; exportMenuPdf(pd).finally(()=>{ pd.disabled=false; pd.textContent=t; }); return; }
  const v=e.target.closest("[data-vue]"); if(v){ state.vueMenu=v.dataset.vue; saveLocal(); renderCalendrier(); return; }
  const pk=e.target.closest("[data-cpick]"); if(pk){ openSheet({type:"gallery",d:+pk.dataset.cpick}); return; }
  if(e.target.closest("select,button,a")) return; const c=e.target.closest("[data-copen]"); if(c) openMeal(state.week[+c.dataset.copen],+c.dataset.copen); });
document.addEventListener("keydown",e=>{ if(e.key!=="Enter") return; const c=e.target.closest&&e.target.closest("[data-copen]"); if(c&&e.target===c) openMeal(state.week[+c.dataset.copen],+c.dataset.copen); });
// ---- Page principale : les soirs sans repas prévu ou sans cuisinier ----
function renderACompleter(){ const box=$("acompleter"); if(!box) return;
  const sansCuisinier=homeDays().filter(d=>headcount(d)>0&&!state.cooks[d]);
  const dehors=JOURS.map((_,d)=>d).filter(d=>isOut(d)), personne=homeDays().filter(d=>headcount(d)===0);
  const jour=d=>`${JOURS[d].slice(0,3)}<br>${fmtShort(dayOffset(d))}`;
  if(!sansCuisinier.length&&!personne.length&&!dehors.length){ box.className="panel acomp ok"; box.innerHTML=`<p>✓ Chaque soir a un repas et un cuisinier.</p>`; return; }
  box.className="panel acomp";
  const lignes=[...sansCuisinier.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>${esc(BYID[state.week[d]].nom)}</b><small>Pas encore de cuisinier · ${headcount(d)} à table</small></span><span class="edit-only">${state.family.length?cookSelect(d):""}</span>`})),
    ...personne.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>Personne à table</b><small>Tout le monde est absent : pas de repas prévu</small></span><span></span>`})),
    ...dehors.map(d=>({d,html:`<span class="acday">${jour(d)}</span><span class="acinfo"><b>Pas de repas prévu à la maison</b><small>Soir marqué « à l'extérieur »</small></span><button class="chip edit-only" data-acout="${d}" type="button">Prévoir un repas</button>`}))].sort((x,y)=>x.d-y.d);
  box.innerHTML=`<div class="phead"><h2>À compléter cette semaine</h2>${sansCuisinier.length>1&&state.family.length?`<button class="btn edit-only" id="acrepartir" type="button" data-tip="Attribue ces soirs aux personnes présentes, en commençant par celles qui cuisinent le moins">Répartir ces soirs</button>`:""}</div>
    ${!state.family.length?`<p class="note">Ajoutez les membres de la famille pour choisir qui cuisine.</p>`:""}
    ${lignes.map(l=>`<div class="acrow">${l.html}</div>`).join("")}`; }
document.addEventListener("click",e=>{ const o=e.target.closest("[data-acout]"); if(o){ toggleOut(+o.dataset.acout); return; }
  if(e.target.closest("#acrepartir")){ const vides=homeDays().filter(d=>headcount(d)>0&&!state.cooks[d]), cnt={};
    state.family.forEach(n=>cnt[n]=state.cooks.filter(c=>c===n).length);
    vides.forEach(d=>{ const dispo=presentAt(d).filter(n=>state.family.includes(n)); const l=(dispo.length?dispo:state.family).slice().sort((a,b)=>cnt[a]-cnt[b]||Math.random()-.5); state.cooks[d]=l[0]; cnt[l[0]]++; });
    save(); render(); toast(`${vides.length} soirs répartis entre les présents`); } });
function headcount(d){
  if(isOut(d)) return 0;
  if(d===undefined||d===null) return state.persons;
  const inv=Math.max(0,+(state.invites[d]||0));
  if(!state.family.length) return state.persons+inv;
  return state.family.filter(n=>!(state.absents[n]||[]).includes(d)).length+inv;
}
const scale = (q,d) => q*headcount(d)/5;
const totalCouverts = () => JOURS.reduce((s,_,d)=>s+headcount(d),0);

function courses(){
  const map=new Map();
  state.week.forEach((id,d)=>{ if(!headcount(d)) return; const r=BYID[id]; r.ing.forEach(([n,q,u,ray])=>{
    const k=n+"|"+u; if(!map.has(k)) map.set(k,{k,n,u,ray,q:0,pour:new Set()});
    const it=map.get(k); it.q+=scale(q,d); it.pour.add(JOURS[d]); }); });
  return [...map.values()].sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr"));
}

const $=id=>document.getElementById(id);
const todayIdx=(new Date().getDay()+6)%7;

function renderStats(){
  const hd=homeDays(), mins=hd.reduce((s,d)=>s+BYID[state.week[d]].t,0);
  const n=courses().length;
  $("stats").innerHTML=`<span><b>${hd.length}</b> soirs à la maison</span><span><b>${Math.floor(mins/60)} h ${String(mins%60).padStart(2,"0")}</b> en cuisine</span><span><b>${n}</b> articles</span>`;
  $("persons").textContent=state.persons+(state.persons>1?" personnes":" personne");
  document.querySelector(".stepper").hidden=!!state.family.length;
}

function renderDays(){
  $("days").innerHTML=state.week.map((id,d)=>{const r=BYID[id];
    if(isOut(d)) return `<article class="day out${dayOffset(d).getTime()===TODAY.getTime()?" today":""}" id="day-${d}">
      <button class="dcard" data-open="${d}" aria-label="${JOURS[d]} : repas à l'extérieur, ouvrir la fiche">
        <span class="dthumbbox outbox" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 7h3v11"/></svg></span>
        <span class="dinfo"><span class="dday">${JOURS[d]} ${fmtShort(dayOffset(d))}</span><b class="dish">Repas à l'extérieur</b><span class="dmeta">Pas de cuisine ni de courses ce soir</span></span>
        <span class="dchev" aria-hidden="true">›</span></button></article>`;
    const isToday=dayOffset(d).getTime()===TODAY.getTime(), pc=promoCount(r), hc=headcount(d), w=dislikesFor(r,d);
    return `<article class="day${isToday?" today":""}" id="day-${d}">
      <button class="dcard" data-open="${d}" aria-label="${JOURS[d]} : ${esc(r.nom)}, ouvrir la fiche">
        <span class="dthumbbox"><img class="dthumb" src="${photoSrc(id)}" alt="" loading="lazy" data-cache-err="1"></span>
        <span class="dinfo">
          <span class="dday">${JOURS[d]} ${fmtShort(dayOffset(d))}${isToday?' <span class="tonight">Ce soir</span>':""}</span>
          <b class="dish">${esc(r.nom)}</b>
          <span class="dmeta"><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${hc?`${r.t} min · ${hc} à table`:"Personne à table"}${state.cooks[d]?` · <span class="dcook">${esc(state.cooks[d])} cuisine</span>`:(hc?` · <span class="dnocook">pas de cuisinier</span>`:"")}${pc&&hc?` · <span class="promo">promo</span>`:""}</span>
          ${w.length&&hc?`<span class="dwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas ce plat</span>`:""}
        </span>
        <span class="dchev" aria-hidden="true">›</span>
      </button>
    </article>`}).join("");
}

// ---- Deux courses par semaine ----
const STOCKABLE = ["epi","sur"];
const trip1Day = () => state.trip1==="sam" ? -2 : 0;   // samedi avant la semaine = -2
const tripOf = d => 0; // une seule course par semaine (la liste n'est plus scindée)
const tripName = t => t===0 ? (state.trip1==="sam"?"Samedi":"Lundi") : JOURS[state.trip2];
function tripDate(t){ return dayOffset(t===0 ? trip1Day() : state.trip2); }
function coursesTrips(){
  const trips=[new Map()];
  const dejaLa=new Map();
  state.week.forEach((id,d)=>headcount(d)&&BYID[id]&&BYID[id].ing.forEach(([n,q,u,ray])=>{
    if(PLACARD[n]){ const o=dejaLa.get(n)||{n,pour:new Set()}; o.pour.add(JOURS[d]); dejaLa.set(n,o); return; }
    const t=STOCKABLE.includes(ray)?0:tripOf(d), k=n+"|"+u, m=trips[t];
    if(!m.has(k)) m.set(k,{k,ck:t+"|"+k,n,u,ray,q:0,pour:new Set(),freeze:false});
    const it=m.get(k); it.q+=scale(q,d); it.pour.add(JOURS[d]);
    const buy=t===0?trip1Day():state.trip2; if(ray==="bou"&&d-buy>=3) it.freeze=true;
  }));
  (state.extras||[]).forEach(x=>{ const t=0, k="x|"+x.id;
    trips[t].set(k,{k,ck:t+"|"+k,n:x.n,u:"",ray:RAYONS[x.ray]?x.ray:"epi",q:0,qt:x.qt||"",pour:new Set(),freeze:false,x:true,id:x.id,par:x.par||""}); });
  // anciennes cases cochées de la 2e course : reprises dans la liste unique
  trips[0].forEach(it=>{ if(state.checked["1|"+it.k]&&!state.checked[it.ck]) state.checked[it.ck]=true; });
  DEJA_LA=[...dejaLa.values()].sort((a,b)=>a.n.localeCompare(b.n,"fr"));
  return trips.map(m=>[...m.values()].sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr")));
}
function cleanExtras(a){ return Array.isArray(a)? a.filter(x=>x&&typeof x.n==="string"&&x.n.trim()&&x.id).slice(0,200).map(x=>({id:String(x.id).slice(0,40),n:String(x.n).trim().slice(0,60),qt:String(x.qt||"").slice(0,20),ray:RAYONS[x.ray]?x.ray:"epi",t:x.t===1?1:0,par:String(x.par||"").slice(0,30)})) : []; }
function suggestStore(items,date){
  const c={}; items.forEach(i=>promosFor(i.n).filter(p=>validOn(p,date)).forEach(p=>c[p.mag]=(c[p.mag]||0)+1));
  const best=Object.keys(c).sort((a,b)=>c[b]-c[a])[0]; return best||"colruyt";
}
// ---- Regroupement par magasin : 1 arrêt, ou 2 si le détour rapporte assez ----
function storeGain(items,date,mag){ let sav=0,n=0; items.forEach(i=>{const ps=promosFor(i.n).filter(p=>p.mag===ensOf(mag)&&validOn(p,date)); if(ps.length){n++; sav+=Math.max(...ps.map(p=>p.avant?p.avant-p.prix:0));}}); return {sav,n}; }
function planTrip(t,items){
  const date=tripDate(t);
  const allowed=orderedStores(); if(!allowed.length) allowed.push(MAGASINS[0]);
  const score=allowed.map(m=>({m:m.id,...storeGain(items,date,m.id),d:km(HOME,m),bonus:prefBonus(m.id)}));
  // gain net = économies promo − frais de route (aller-retour) + bonus de préférence
  let primary=state.storeOrder.includes(state.tripStore[t])?state.tripStore[t]:null;
  if(!primary&&state.storeMode==="fixe") primary=state.storeOrder[0];
  if(!primary){ primary=score.slice().sort((a,b)=>(b.sav-2*b.d*COUT_KM+b.bonus)-(a.sav-2*a.d*COUT_KM+a.bonus)||b.n-a.n)[0].m; }
  const P0=MAGBYID(primary);
  let secondary=null, extra=0, detour=0;
  if(state.maxStores===2){
    let best=-Infinity;
    score.filter(s=>s.m!==primary).forEach(s=>{
      const only=items.filter(i=>{const v=promosFor(i.n).filter(p=>validOn(p,date)); return v.some(p=>p.mag===ensOf(s.m))&&!v.some(p=>p.mag===ensOf(primary));});
      const g=storeGain(only,date,s.m).sav, S=MAGBYID(s.m);
      const dt=km(HOME,P0)+km(P0,S)+km(S,HOME)-2*km(HOME,P0);
      const net=g-dt*COUT_KM+s.bonus*0.5;
      if(g>0&&net>best){best=net;extra=g;detour=dt;secondary=s.m;} });
    if(!secondary||extra-detour*COUT_KM<state.seuil){secondary=null;}
  }
  const assign={};
  items.forEach(i=>{const v=promosFor(i.n).filter(p=>validOn(p,date));
    assign[i.k]= secondary && v.some(p=>p.mag===ensOf(secondary))&&!v.some(p=>p.mag===ensOf(primary)) ? secondary : primary;});
  const P=MAGBYID(primary), S=secondary?MAGBYID(secondary):null;
  const route = S ? km(HOME,P)+km(P,S)+km(S,HOME) : 2*km(HOME,P);
  const sav = storeGain(items.filter(i=>assign[i.k]===primary),date,primary).sav + (S?storeGain(items.filter(i=>assign[i.k]===secondary),date,secondary).sav:0);
  // meilleur second arrêt possible, même s'il n'est pas retenu (pour l'expliquer)
  return {primary,secondary,assign,route,sav,extra,detour,date};
}
function tripStore(t,items){ return planTrip(t,items).primary; }
const kmTxt = v => nf.format(Math.round(v*10)/10)+" km";
function renderPlan(trips){
  const plans=trips.map((items,t)=>planTrip(t,items));
  const totKm=plans.reduce((s,p)=>s+p.route,0), totSav=plans.reduce((s,p)=>s+p.sav,0);
  const stops=plans.reduce((s,p)=>s+(p.secondary?2:1),0);
  $("plan").innerHTML=`<h2>Plan de déplacement</h2>
    <div class="planstats"><span><b>${stops}</b> arrêt${stops>1?"s":""} en magasin</span><span><b>≈ ${kmTxt(totKm)}</b> aller-retour au total</span><span><b>${eur(totSav)}</b> d'économies promo connues</span></div>
    ${plans.map((p,t)=>`<div class="route"><div class="rt">Courses de la semaine · ${fmtD(p.date)}</div>
      <div class="rpath"><span class="rhome">Maison</span><span class="rarrow">→</span><span class="rstop">${MAGNOM[p.primary]}</span>${p.secondary?`<span class="rarrow">→</span><span class="rstop alt">${MAGNOM[p.secondary]}</span>`:""}<span class="rarrow">→</span><span class="rhome">Maison</span></div>
      <small>≈ ${kmTxt(p.route)} (≈ ${eur(p.route*COUT_KM)} de route) · ${p.secondary?`le 2e arrêt rapporte ${eur(p.extra)} pour ${kmTxt(p.detour)} de détour`: (state.maxStores===2 && p.extra>0 ? `un 2e arrêt rapporterait ${eur(p.extra)} pour ${kmTxt(p.detour)} de détour : pas rentable selon votre seuil` : "tout dans un seul magasin")}</small></div>`).join("")}
    <div class="planopts">
      <label>Arrêts par course <select id="maxstores" class="pick"><option value="1"${state.maxStores===1?" selected":""}>1 magasin seulement</option><option value="2"${state.maxStores===2?" selected":""}>Jusqu'à 2 magasins</option></select></label>
      <label${state.maxStores===2?"":" hidden"}>2e arrêt si le gain net atteint <select id="seuil" class="pick">${[1,2,3,5].map(v=>`<option value="${v}"${state.seuil===v?" selected":""}>${eur(v)}</option>`).join("")}</select></label>
    </div>
    <p class="note">Le magasin est choisi pour le meilleur gain net : économies des promos moins les frais de route (estimés à ${eur(COUT_KM)} par km). Distances estimées depuis ${esc(HOME.nom)}. Seules les promos dont l'ancien prix est connu sont chiffrées.</p>`;
  $("plansum").innerHTML=`<span class="sumtitle">Trajet</span><span class="sumval">${plans.map(p=>MAGNOM[p.primary]+(p.secondary?" + "+MAGNOM[p.secondary]:"")).join(" puis ")} · ≈ ${kmTxt(totKm)}</span>`;
  return plans;
}
let tripVue=null; // course affichée sur téléphone (une à la fois)
const tripAuto=()=>0;
function renderCourses(){
  const trips=coursesTrips(); let done=0, total=0;
  if(tripVue===null) tripVue=tripAuto();
  const tdone=trips.map(items=>items.filter(i=>state.checked[i.ck]).length);
  const plans=renderPlan(trips);
  $("aisles").innerHTML=trips.map((items,t)=>{
    const plan=plans[t], store=plan.primary, date=plan.date;
    const days=JOURS.filter((_,d)=>tripOf(d)===t);
    const cover=`Tous les repas de la semaine, du ${days[0].toLowerCase()} au ${days[days.length-1].toLowerCase()}`;
    const stopsHtml=[plan.primary,plan.secondary].filter(Boolean).map((mag,si)=>{
      const sitems=items.filter(i=>plan.assign[i.k]===mag); if(!sitems.length) return "";
      const m=MAGBYID(mag), nP=sitems.filter(i=>promosFor(i.n).some(p=>p.mag===ensOf(mag)&&validOn(p,date))).length;
    const groups=ORDRE.map(ray=>{const its=sitems.filter(i=>i.ray===ray).sort((a,b)=>(!!state.checked[a.ck])-(!!state.checked[b.ck])); if(!its.length) return "";
      const rows=its.map(i=>{const c=!!state.checked[i.ck]; total++; if(c) done++;
        const tags=promosFor(i.n).map(p=>{const ok=validOn(p,date);
          const when= ok ? `jusqu'au ${fmtShort(isoDate(p.au))}` : (isoDate(p.du)>date ? `dès le ${fmtShort(isoDate(p.du))}, pas encore valable ce jour-là` : `terminée le ${fmtShort(isoDate(p.au))}`);
          return `<span class="ptag${ok&&p.mag===ensOf(mag)?"":" off"}">· Promo ${ENS[p.mag]} ${eur(p.prix)} ${when}</span>`}).join("");
        return `<label class="item${c?" checked":""}"><input type="checkbox" data-k="${esc(i.ck)}"${c?" checked":""}><span class="iname"><b>${esc(i.n)}</b><small>${i.x?(i.par?"Ajouté par "+esc(nomDe(i.par)):"Ajouté à la main"):[...i.pour].join(", ")}${i.freeze?'<span class="ptag" style="color:var(--accent)">· à congeler à l\'achat</span>':""}${tags}</small></span><span class="qty"><button type="button" class="qtbtn" data-qedit="${esc(i.k)}" aria-label="Changer la quantité de ${esc(i.n)}" data-tip="Changer la quantité">${esc(qtyOf(i))||"qté"}${state.qtEdit&&state.qtEdit[i.k]&&!i.x?`<s>${esc(fmt(i.q,i.u))}</s>`:""}</button>${i.x?`<button type="button" class="xdel edit-only" data-xdel="${esc(i.id)}" aria-label="Retirer ${esc(i.n)} de la liste">×</button>`:`<button type="button" class="dejabtn edit-only" data-deja="${esc(i.n)}" aria-label="J'en ai déjà : ${esc(i.n)}" data-tip="J'en ai déjà à la maison : ne plus le mettre sur la liste">🏠</button>`}</span></label>`}).join("");
      return `<div class="aisle"><h2><span>${RAYONS[ray]}</span><span>${its.length}</span></h2><div class="list">${rows}</div></div>`}).join("");
      return `<div class="stop"><div class="stophead"><span class="stopno">Arrêt ${si+1}</span><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ${sitems.length} article${sitems.length>1?"s":""}${nP?` · ${nP} en promo`:""} · ≈ ${eur(sitems.reduce((s,i)=>s+itemCost(i.n,i.u,i.q,i.ray),0))}</small></div>${groups}</div>`}).join("");
    return `<div class="trip${t===tripVue?" on":""}" id="trip-${t}"><div class="triphead"><div><div class="tripno">Courses de la semaine · ${fmtD(date)}</div><p class="note">${cover}</p></div>
      <button class="btn primary" data-shop="${t}" data-tip="Liste plein écran, rayon par rayon : cochez en avançant dans le magasin">Mode magasin</button>
      <label class="tripstore">Magasin principal <select data-store="${t}" aria-label="Magasin principal"><option value="">Automatique</option>${orderedStores().map(m=>`<option value="${m.id}"${m.id===state.tripStore[t]?" selected":""}>${m.nom} · ${kmTxt(km(HOME,m))}</option>`).join("")}</select></label></div>
      <p class="note">${items.length} articles · ≈ ${eur(items.reduce((s,i)=>s+itemCost(i.n,i.u,i.q,i.ray),0))} (gamme ${GAMMES[state.gamme].nom.toLowerCase()}) · trajet ≈ ${kmTxt(plan.route)}</p>${stopsHtml}</div>`}).join("");
  $("tripsel").innerHTML=(`${trips.map((items,t)=>`<button role="tab" data-tripvue="${t}" aria-selected="${t===tripVue}"><b>Course ${t+1}</b><small>${fmtShort(tripDate(t))} · ${tdone[t]}/${items.length}</small></button>`).join("")}`);
  $("ptext").textContent=`${done} sur ${total} dans le caddie`;
  if(typeof renderHabituels==="function"){ renderHabituels(); renderDejaLa(); renderTicket(); }
  if(typeof renderApTrip==="function") renderApTrip();
  $("pbar").style.width=(total?done/total*100:0)+"%";
  $("ccount").textContent=total-done?String(total-done):"";
  renderNext();
}

// ---- Prix de revient (estimations) ----
// Prix indicatifs en marque distributeur : [prix, unité] avec unité kg, L ou u (pièce)
const PRIX = {
 "Potiron":[1.8, "kg"],"Choux de Bruxelles":[3, "kg"],"Chou de Milan":[1.8, "u"],"Saucisses fumées":[0.8, "u"],"Céleri-rave":[1.8, "u"],"Patates douces":[3, "kg"],"Haricots noirs":[0.9, "u"],"Tortellini":[5, "kg"],"Falafels":[0.25, "u"],"Houmous":[2, "u"],"Navets":[0.5, "u"],"Mâche":[13, "kg"],"Lentilles vertes":[3, "kg"],"Chou rouge cuisiné":[1.8, "u"],"Pommes":[0.4, "u"],"Maquereau en conserve":[1.6, "u"],"Feuilles de lasagne":[2.5, "kg"],"Olives":[2, "u"],"Cuisses de poulet désossées":[9, "kg"],"Pruneaux":[8, "kg"],"Escalopes de dinde":[10, "kg"],"Filets de colin":[11, "kg"],"Gyozas":[0.25, "u"],"Nouilles de riz":[4, "kg"],"Germes de soja":[6, "kg"],"Cacahuètes":[6, "kg"],"Citrons verts":[0.5, "u"],"Haché pur bœuf":[11, "kg"],"Filets de canard":[6, "u"],"Potimarron":[2.2, "kg"],"Miel":[3, "u"],"Escalopes de veau":[28, "kg"],"Croquettes de crevettes":[2.2, "u"],"Fromage à raclette":[15, "kg"],"Charcuterie assortie":[18, "kg"],"Cornichons":[1.8, "u"],"Steaks de thon":[3.5, "u"],"Gambas":[18, "kg"],"Fromage à fondue":[16, "kg"],"Filets de cabillaud":[18, "kg"],"Saumon frais":[22, "kg"],
 "Aiguillettes de poulet":[10, "kg"],"Vinaigre":[1.2, "u"],"Sirop de Liège":[3, "u"],"Bouillon de bœuf":[0.2, "u"],"Bœuf à carbonnades":[14, "kg"],"Bière brune":[2.5, "L"],"Pain d'épices":[0.2, "u"],"Moutarde":[1.2, "u"],"Américain préparé":[16, "kg"],"Chicons":[3, "kg"],"Riz à risotto":[3.5, "kg"],"Bouillon de légumes":[0.2, "u"],"Parmesan":[22, "kg"],"Haricots blancs":[0.8, "u"],"Coquillettes":[1.4, "kg"],"Focaccia":[2, "u"],"Piadine":[0.5, "u"],"Jambon cru":[25, "kg"],"Roquette":[14, "kg"],"Filet de porc":[11, "kg"],"Feta":[11, "kg"],"Sauce teriyaki":[2.5, "u"],"Sésame":[1, "u"],"Ananas en morceaux":[1.2, "u"],"Ketchup":[1.5, "u"],"Pousses d'épinards":[9, "kg"],"Petites tortillas":[0.15, "u"],"Épices pour tacos":[0.9, "u"],"Garam masala":[2, "u"],"Naans":[0.6, "u"],"Galettes de sarrasin":[0.35, "u"],"Reblochon":[6, "u"],"Pain de campagne":[2.5, "u"],"Filets de poisson panés":[0.8, "u"],"Chou blanc râpé":[4, "kg"],"Mayonnaise":[1.8, "u"],"Tofu":[8, "kg"],"Orzo":[2.5, "kg"],
 "Lentilles corail":[3, "kg"],"Macaroni":[1.4, "kg"],"Tagliatelles":[2.2, "kg"],"Maïs":[0.8, "u"],"Pesto":[1.8, "u"],"Tomates cerises":[6, "kg"],"Boudin":[0.6, "u"],"Compote de pommes":[1.6, "u"],"Gnocchis":[2.6, "kg"],"Saucisses de Francfort":[0.3, "u"],"Pains à hot-dog":[0.25, "u"],"Semoule":[1.6, "kg"],"Merguez":[0.6, "u"],"Courgettes":[0.8, "u"],"Épices à couscous":[1, "u"],"Nouilles chinoises":[3, "kg"],"Sauce soja":[1, "u"],"Cordons bleus":[1.2, "u"],"Côtes de porc":[8, "kg"],"Chapelure":[1.2, "u"],"Pains pita":[0.25, "u"],"Yaourt grec":[3.5, "kg"],"Concombre":[0.8, "u"],"Bouchées feuilletées":[0.5, "u"],"Bouillon de volaille":[0.2, "u"],"Frites au four":[2, "kg"],"Lanières de bœuf":[17, "kg"],"Brocoli":[2.5, "kg"],"Steaks hachés pur bœuf":[1.5, "u"],"Pains burger":[0.4, "u"],"Cheddar en tranches":[0.2, "u"],"Steaks de bœuf":[22, "kg"],"Pavés de saumon":[2.9, "u"],"Citrons":[0.45, "u"],"Scampis":[20, "kg"],"Persil":[0.9, "u"],"Saumon fumé":[38, "kg"],"Avocats":[0.9, "u"],"Moules":[5.5, "kg"],"Céleri":[1.3, "u"],"Dos de cabillaud":[18, "kg"],
 "Spaghetti":[1.4,"kg"],"Penne":[1.4,"kg"],"Lardons":[9,"kg"],"Œufs":[0.25,"u"],"Crème fraîche":[4.5,"L"],"Fromage râpé":[9,"kg"],
 "Laitue":[1,"u"],"Pommes de terre":[1,"kg"],"Oignons":[0.25,"u"],"Lait":[1,"L"],"Blancs de poulet":[9.5,"kg"],"Tortillas":[0.2,"u"],
 "Poivrons":[0.7,"u"],"Carottes":[1.2,"kg"],"Tomates":[0.4,"u"],"Riz":[1.8,"kg"],"Jambon cuit":[12,"kg"],"Petits pois":[2,"kg"],
 "Pain de mie":[0.1,"u"],"Beurre":[9,"kg"],"Soupe de tomates":[2,"L"],"Haché porc-bœuf":[7.5,"kg"],"Haricots rouges":[0.7,"u"],
 "Tomates concassées":[0.65,"u"],"Épices pour chili":[0.9,"u"],"Pâte brisée":[1.1,"u"],"Saucisses":[0.55,"u"],"Thon au naturel":[1.3,"u"],
 "Pâte à pizza":[1.4,"u"],"Coulis de tomate":[2,"L"],"Mozzarella":[0.85,"u"],"Champignons":[4,"kg"],"Poisson pané":[0.3,"u"],
 "Haricots verts":[2.2,"kg"],"Poireaux":[0.6,"u"],"Baguettes":[0.9,"u"],"Fromage en tranches":[9,"kg"],"Pois chiches":[0.7,"u"],
 "Lait de coco":[1.3,"u"],"Épinards":[2.5,"kg"],"Pâte de curry":[2.5,"u"]
};
const GAMMES = {
 eco:{nom:"Économique",m:{fl:1,bou:1,cre:1,bl:1,epi:1,sur:1},desc:"Marques distributeur et premiers prix.",ou:"Lidl, Aldi, Colruyt"},
 equi:{nom:"Équilibré",m:{fl:1.2,bou:1.35,cre:1.25,bl:1.3,epi:1.15,sur:1.2},desc:"Épicerie en marque distributeur, viande de boucherie, œufs de plein air, légumes de saison.",ou:"Colruyt + boucher ou marché"},
 qual:{nom:"Qualité",m:{fl:1.7,bou:2,cre:1.7,bl:1.6,epi:1.6,sur:1.5},desc:"Bio ou labels : viande belge labellisée, œufs bio, légumes bio, grandes marques.",ou:"Delhaize, Carrefour, magasin bio"}
};
function promoFactor(n){ const ps=promosFor(n).filter(p=>p.avant); return ps.length? Math.min(...ps.map(p=>p.prix/p.avant)) : 1; }
function itemCost(n,u,q,ray,g){ const p=PRIX[n]; if(!p) return 0; const gm=GAMMES[g||state.gamme].m[ray]||1;
  const qty = u==="g"? q/1000 : u==="cl"? q/100 : q; return p[0]*qty*gm*promoFactor(n); }
function recipeCost(r,g,d){ return r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,scale(q,d),ray,g),0) + (r.prix? r.prix*headcount(d)/5*GAMMES[g||state.gamme].m.epi : 0); }
function weekCost(g){ return state.week.reduce((s,id,d)=>s+recipeCost(BYID[id],g,d),0); }
function renderMix(){ const home=[0,1,2,3,4,5,6].filter(d=>!isOut(d)), q=mixFor(home.length), now={eco:0,moyen:0,plaisir:0}, P={}, F={};
  home.forEach(d=>{ const r=BYID[state.week[d]]; if(!r) return; now[budgetOf(r)]++; if(r.p) P[r.p]=(P[r.p]||0)+1; if(r.f) F[r.f]=(F[r.f]||0)+1; });
  const step=(k,v,max)=>`<span class="mixstep"><button class="sbtn edit-only" data-mix="${k}" data-dv="-1" ${v<=0?"disabled":""} aria-label="Un de moins">−</button><b>${v}</b><button class="sbtn edit-only" data-mix="${k}" data-dv="1" ${max<=0?"disabled":""} aria-label="Un de plus">+</button></span>`;
  const libre=home.length-q.plaisir-q.moyen;
  return `<h3 class="shopray">Répartition des repas de la semaine</h3>
    <p class="note">Les nouvelles propositions suivent cette règle, pour ${home.length} soirs à la maison. Elle vaut pour toute la famille.</p>
    <div class="mixgrid">
      <div class="mixrow b-eco"><span><b>${BUDGETS.eco.nom}</b><small>${BUDGETS.eco.desc}</small></span><span class="mixstep"><b>${q.eco}</b><small>le reste</small></span><span class="mixnow">${now.eco} cette semaine</span></div>
      <div class="mixrow b-moyen"><span><b>${BUDGETS.moyen.nom}</b><small>${BUDGETS.moyen.desc}</small></span>${step("moyen",q.moyen,libre)}<span class="mixnow">${now.moyen} cette semaine</span></div>
      <div class="mixrow b-plaisir"><span><b>${BUDGETS.plaisir.nom}</b><small>${BUDGETS.plaisir.desc}</small></span>${step("plaisir",q.plaisir,libre)}<span class="mixnow">${now.plaisir} cette semaine</span></div>
    </div>
    <p class="note">Variété de la semaine : ${Object.entries(P).map(([k,v])=>`${v} ${PROT[k]||k}`).join(", ")||"–"} · ${Object.entries(F).map(([k,v])=>`${v} ${FECU[k]||k}`).join(", ")||"–"}.
      Règles : pas plus de 2 fois la même viande ni le même féculent, jamais deux soirs de suite, du poisson et un repas sans viande quand c'est possible, et pas les plats des deux dernières semaines.</p>
    <div class="actions"><button class="btn edit-only" id="mixpropose">Proposer un menu avec cette répartition</button></div>`; }
function renderBudget(){
  const couverts=totalCouverts()||1, per=v=>eur(v/couverts);
  const g=GAMMES[state.gamme], w=weekCost(state.gamme);
  const sorted=state.week.map((id,d)=>({d,r:BYID[id],c:recipeCost(BYID[id],state.gamme)/state.persons})).sort((a,b)=>a.c-b.c);
  $("budget").innerHTML=`<h2>Prix de revient de la semaine</h2>
    <div class="bigcost"><span>${eur(w)}</span><small>soit ${per(w)} par personne et par repas · ${totalCouverts()} couverts dans la semaine · gamme ${g.nom.toLowerCase()}</small></div>
    <div class="gammes" role="radiogroup" aria-label="Gamme de produits">${Object.entries(GAMMES).map(([k,x])=>{const c=weekCost(k);
      return `<button class="gamme" role="radio" aria-checked="${k===state.gamme}" data-gamme="${k}"><b>${x.nom}</b><span class="gc">${eur(c)}</span><small>${per(c)} / pers. / repas</small><small class="gd">${x.desc}</small><small class="gd">Où : ${x.ou}</small></button>`}).join("")}</div>
    ${renderMix()}
    <p class="note">Le plus économique cette semaine : ${sorted[0].r.nom.toLowerCase()} (${eur(sorted[0].c)} par personne). Le plus cher : ${sorted[6].r.nom.toLowerCase()} (${eur(sorted[6].c)} par personne).</p>
    <p class="note">Estimation à partir de prix indicatifs, promos de la semaine déduites. Les ingrédients sont comptés à la quantité utilisée, pas au paquet entier.</p>`;
  const absN=Object.values(state.absents).reduce((s,a)=>s+a.length,0);
  $("budgetsum").innerHTML=`<span class="sumtitle">Budget</span><span class="sumval">≈ ${eur(w)} · ${per(w)} par repas · ${totalCouverts()} couverts${absN?` · ${absN} absence${absN>1?"s":""}`:""}</span>`;
}

function renderRecettes(){
  const list=[...RECETTES].sort((x,y)=>(y.perso?1:0)-(x.perso?1:0)||x.nom.localeCompare(y.nom,"fr"));
  $("recipes").innerHTML=list.map(r=>{const days=state.week.map((id,d)=>id===r.id?JOURS[d].slice(0,3):null).filter(Boolean), lk=likeScore(r);
    return `<button class="rrow" data-openrec="${r.id}"><img class="rthumb" src="${photoSrc(r.id)}" alt="" loading="lazy"><span class="rinfo"><span class="rtitle">${esc(r.nom)}</span>
      <span class="rmeta">${r.t} min${r.perso?" · recette de famille":""}${lk>0?` · aimé par ${lk}`:""}${days.length?` · au menu ${days.join(", ")}`:""}</span></span><span class="dchev" aria-hidden="true">›</span></button>`}).join("");
}

function renderPromos(){
  $("promodate").textContent=`Promotions relevées le ${RELEVE} dans les enseignes autour de chez vous (mise à jour le lundi et le mercredi). Vérifiez en magasin avant d'acheter.`;
  const ranked=RECETTES.map(r=>({r,c:promoCount(r)})).filter(x=>x.c).sort((a,b)=>b.c-a.c||a.r.t-b.r.t);
  $("sugg").innerHTML=ranked.map(({r,c})=>{const days=state.week.map((id,d)=>id===r.id?JOURS[d]:null).filter(Boolean);
    const what=[...new Set(r.ing.map(([n])=>n).filter(n=>promosFor(n).length))].map(n=>n.toLowerCase()+" ("+promosFor(n).map(p=>ENS[p.mag]).join(", ")+")").join(", ");
    return `<div class="srow"><span><b>${esc(r.nom)}</b> <span class="promo">${c} en promo</span><small>${what}</small>${days.length?`<small>Déjà au menu : ${days.join(", ")}</small>`:""}</span>
      <select data-add="${r.id}" aria-label="Mettre ${esc(r.nom)} au menu"><option value="">Mettre au menu…</option>${JOURS.map((j,d)=>`<option value="${d}">${j}${state.week[d]===r.id?" ✓":""}</option>`).join("")}</select></div>`}).join("");
  // promos utiles pour la liste actuelle
  const items=courses(); const byMag={}; let gain=0;
  items.forEach(i=>promosFor(i.n).forEach(p=>{(byMag[p.mag]=byMag[p.mag]||[]).push({p,i}); if(p.avant) gain+=p.avant-p.prix;}));
  const mags=Object.keys(byMag).sort((a,b)=>byMag[b].length-byMag[a].length);
  $("planinfo").textContent=mags.length? `${mags.length} enseigne${mags.length>1?"s":""} ont des promos sur votre liste. Économie connue : environ ${eur(gain)} par paquet acheté en promo.` : "Aucun article de votre liste n'est en promo cette semaine.";
  $("pcount").textContent=String(items.filter(i=>promosFor(i.n).length).length||"");
  $("deals").innerHTML=mags.map(m=>{const mine=orderedStores().filter(x=>x.ens===m);
    return `<div class="store">${ENS[m]}${mine.length?" · "+mine.map(x=>x.lieu.split(", ").pop()).join(", "):" · pas dans vos magasins"}</div>`+byMag[m].map(({p,i})=>`<div class="deal"><span>${esc(p.produit)}</span><span class="p">${p.avant?`<s>${eur(p.avant)}</s>`:""}${eur(p.prix)}</span><small>Pour : ${i.n.toLowerCase()} (${qtyOf(i)}) · du ${fmtD(isoDate(p.du))} au ${fmtD(isoDate(p.au))} <span class="st ${promoStatus(p).cls}">${promoStatus(p).txt}</span></small></div>`).join("")}).join("");
  // validité par magasin
  const parMag={}; PROMOS.forEach(p=>(parMag[p.mag]=parMag[p.mag]||[]).push(p));
  const seen=new Set();
  $("validite").innerHTML=orderedStores().filter(m=>!seen.has(m.ens)&&seen.add(m.ens)).map(m=>{const ps=parMag[m.ens]; m={...m,nom:ENS[m.ens],lieu:orderedStores().filter(x=>x.ens===m.ens).map(x=>x.lieu).join(" · ")};
    if(!ps) return `<div class="vrow"><div><b>${m.nom}</b><small>${m.lieu}</small></div><div class="vr"><span class="st none">Pas de folder relevé</span></div></div>`;
    const periods=[...new Set(ps.map(p=>p.du+"|"+p.au))].map(k=>{const [du,au]=k.split("|"); const p=ps.find(x=>x.du===du&&x.au===au); const s=promoStatus(p);
      return `<div class="vr"><span>du ${fmtD(isoDate(du))} au ${fmtD(isoDate(au))}</span><span class="st ${s.cls}">${s.txt}</span></div>`}).join("");
    const c1=ps.some(p=>validOn(p,tripDate(0))), c2=false;
    const use=[c1?`les courses du ${fmtShort(tripDate(0))}`:null].filter(Boolean);
    return `<div class="vrow"><div><b>${m.nom}</b><small>${m.lieu} · ${ps.length} promo${ps.length>1?"s":""}</small><small>${use.length?"Valable pour la "+use.join(" et la "):"Non valable vos jours de courses"}</small></div><div>${periods}</div></div>`}).join("");
  // indice
  const max=6;
  $("index").innerHTML=INDICE.map(x=>{const w=Math.abs(x.v)/max*50; const col=x.v<0?"var(--accent)":"var(--warm)";
    return `<div class="irow"><span>${x.nom}</span><span class="ibar"><i style="background:${col};width:${w}%;${x.v<0?`right:50%`:`left:50%`}"></i></span><span style="color:${col}">${x.v>0?"+":""}${nf.format(x.v)} %</span></div>`}).join("");
  renderCmp();
}
function renderCmp(onlyTotals){
  const items=courses();
  if(onlyTotals){ const tot={},cnt={}; orderedStores().forEach(m=>{tot[m.id]=0;cnt[m.id]=0;});
    items.forEach(i=>{const pr=state.prices[i.k]||{}; orderedStores().forEach(m=>{if(typeof pr[m.id]==="number"){tot[m.id]+=pr[m.id];cnt[m.id]++;}})});
    const full=orderedStores().filter(m=>cnt[m.id]===items.length&&items.length); const best=full.length?Math.min(...full.map(m=>tot[m.id])):null;
    $("cmp").querySelector("tfoot").innerHTML=`<tr><td>Total</td>${orderedStores().map(m=>`<td class="${best!==null&&tot[m.id]===best&&cnt[m.id]===items.length?"best":""}">${cnt[m.id]?eur(tot[m.id]):"—"}</td>`).join("")}</tr>`;
    $("cmpnote").textContent=`Articles renseignés : ${orderedStores().map(m=>`${m.nom} ${cnt[m.id]}/${items.length}`).join(" · ")}. Un total n'est comparable que lorsque tous les articles sont remplis.`;
    return; }
  const tot={}, cnt={};
  orderedStores().forEach(m=>{tot[m.id]=0;cnt[m.id]=0;});
  const rows=items.map(i=>{const pr=state.prices[i.k]||{};
    return `<tr><td>${esc(i.n)}<small>${esc(qtyOf(i))}</small></td>${orderedStores().map(m=>{const v=pr[m.id]; if(typeof v==="number"){tot[m.id]+=v;cnt[m.id]++;}
      return `<td><input type="number" inputmode="decimal" min="0" step="0.01" id="px-${i.k.replace(/[^a-zA-Z0-9]/g,"_")}-${m.id}" data-pk="${esc(i.k)}" data-mag="${m.id}" value="${typeof v==="number"?v:""}" aria-label="Prix ${esc(i.n)} chez ${m.nom}"></td>`}).join("")}</tr>`}).join("");
  const full=orderedStores().filter(m=>cnt[m.id]===items.length&&items.length);
  const best=full.length?Math.min(...full.map(m=>tot[m.id])):null;
  $("cmp").innerHTML=`<thead><tr><th>Article</th>${orderedStores().map(m=>`<th>${m.nom}</th>`).join("")}</tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td>Total</td>${orderedStores().map(m=>`<td class="${best!==null&&tot[m.id]===best&&cnt[m.id]===items.length?"best":""}">${cnt[m.id]?eur(tot[m.id]):"—"}</td>`).join("")}</tr></tfoot>`;
  const filled=orderedStores().map(m=>`${m.nom} ${cnt[m.id]}/${items.length}`).join(" · ");
  $("cmpnote").textContent=`Articles renseignés : ${filled}. Un total n'est comparable que lorsque tous les articles sont remplis.`;
}
function renderReglages(){
  $("members").innerHTML=state.family.length? state.family.map((n,i)=>{const c=state.cooks.filter(x=>x===n).length, m=state.emails[n]||"";
    const ex=state.exclus[n]||[], nope=RECETTES.filter(r=>(state.avis[r.id]||{})[n]===-1).length, yes=RECETTES.filter(r=>(state.avis[r.id]||{})[n]===1).length;
    return `<div class="mrow"><div class="mname"><b>${esc(n)}</b><small>${c} soir${c>1?"s":""} aux fourneaux</small></div>
      <input type="email" inputmode="email" class="mmail" id="mail-${i}" data-mail="${i}" value="${esc(m)}"${IS_OWNER?"":" readonly"} placeholder="Adresse e-mail" maxlength="120" autocomplete="off" aria-label="Adresse e-mail de ${esc(n)}">
      <button class="mdel edit-only owner-only" data-del="${i}" aria-label="Retirer ${esc(n)}">×</button>
      <button class="mgouts" data-gouts="${i}"><span>Goûts</span><small>${ex.length?"Ne mange pas : "+esc(ex.slice(0,3).join(", "))+(ex.length>3?"…":""):"Aucun ingrédient évité"}${yes||nope?` · ${yes} aimé${yes>1?"s":""}, ${nope} évité${nope>1?"s":""}`:""}</small><span class="dchev" aria-hidden="true">›</span></button></div>`}).join("")
    : `<span class="empty">Aucun membre pour l'instant. Ajoutez le premier prénom ci-dessous.</span>`;
  const nb=state.family.filter(n=>state.emails[n]).length;
  $("mailnote").textContent = !IS_OWNER ? "Seul le propriétaire de l'application ajoute ou retire des membres et modifie les adresses e-mail. Les goûts restent modifiables par tous." : state.family.length ? `${nb} adresse${nb>1?"s":""} sur ${state.family.length}. Elles servent à envoyer les menus par e-mail. Pour inviter quelqu'un, utilisez le lien d'invitation (Réglages, Accès de la famille).` : "";
  $("planning").innerHTML=JOURS.map((j,d)=>`<div class="prow"><span>${j}</span><span>${cookSelect(d)}</span></div>`).join("");
  renderStoreOrder();
  $("outdef").innerHTML=JOURS.map((j,d)=>`<button class="chip${state.outDefault.includes(d)?" on":""}" data-outdef="${d}" aria-pressed="${state.outDefault.includes(d)}">${j.slice(0,3)}</button>`).join("");
  $("fcount").textContent=state.family.length?"":"!";
}
const VUES=["menu","courses","famille","envies","reglages"];
function setTab(t,opts={}){ if(!VUES.includes(t)) t="menu"; const changed=state.tab!==t; state.tab=t; save(); if(t==="envies"&&typeof renderEnvies==="function") renderEnvies();
  document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t));
  VUES.forEach(v=>{const s=$("view-"+v); s.hidden=v!==t; if(v===t&&changed){s.classList.remove("view-in"); void s.offsetWidth; s.classList.add("view-in");}});
  if(location.hash!=="#"+t){ try{history.replaceState(null,"","#"+t);}catch(e){} }
  if(changed&&!opts.keepScroll) window.scrollTo(0,0);
}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1); if(VUES.includes(h)&&h!==state.tab) setTab(h);});
// Aller à un élément d'une autre vue, avec un repère visuel
function goTo(tab,elId){ setTab(tab,{keepScroll:!!elId}); if(!elId) return;
  requestAnimationFrame(()=>{const el=$(elId); if(!el) return; el.scrollIntoView({behavior:"smooth",block:"start"}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");}); }
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-goto]"); if(g){ e.preventDefault(); if(modalCtx) closeMeal(); goTo(g.dataset.goto,g.dataset.el||null); return; }
  const tr=e.target.closest("[data-gotrip]"); if(tr){ e.preventDefault(); if(modalCtx) closeMeal(); tripVue=+tr.dataset.gotrip; renderCourses(); goTo("courses","trip-"+tr.dataset.gotrip); }
});
// Bandeau « À suivre » : prochain repas et prochaine course
function renderNext(){
  let d=state.week.findIndex((_,i)=>dayOffset(i)>=TODAY&&!isOut(i)); if(d<0) d=homeDays()[0]??0;
  const r=BYID[state.week[d]], isToday=dayOffset(d).getTime()===TODAY.getTime();
  const trips=coursesTrips();
  let t=0;
  const items=trips[t], plan=planTrip(t,items), left=items.filter(i=>!state.checked[i.ck]).length;
  const days=Math.round((tripDate(t)-TODAY)/DAY);
  const when=days===0?"aujourd'hui":days===1?"demain":fmtD(tripDate(t));
  $("next").innerHTML=`<button class="ncard" data-open="${d}"><img src="${photoSrc(r.id)}" alt="" data-cache-err="1"><div><small>${isToday?"Ce soir":"Prochain repas · "+fmtD(dayOffset(d))}</small><b>${esc(r.nom)}</b><span class="nsub">${r.t} min${state.cooks[d]?" · "+esc(state.cooks[d])+" cuisine":""} · voir la recette</span></div></button>
    <button class="ncard" data-gotrip="${t}"><span class="nicon"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg></span><div><small>Prochaine course · ${when}</small><b>${MAGNOM[plan.primary]}${plan.secondary?" + "+MAGNOM[plan.secondary]:""}</b><span class="nsub">${left?`${left} article${left>1?"s":""} à acheter`:"Tout est dans le caddie"} · ≈ ${kmTxt(plan.route)}</span></div></button>`;
}
$("next").addEventListener("click",e=>{const o=e.target.closest("[data-open]"); if(o) openMeal(state.week[+o.dataset.open],+o.dataset.open);});
// ---- Fenêtre détail d'un repas ----
let modalCtx=null, lastFocus=null;
function mealItems(id,d){
  return BYID[id].ing.map(([n,q,u,ray])=>{
    const t = d===null ? null : (STOCKABLE.includes(ray)?0:tripOf(d));
    return {n,u,ray,q:scale(q,d),t,ck:t===null?null:t+"|"+n+"|"+u,cost:itemCost(n,u,scale(q,d),ray)};
  });
}
function renderModal(){
  if(!modalCtx) return; const {id,d}=modalCtx, r=BYID[id], items=mealItems(id,d), total=items.reduce((s,i)=>s+i.cost,0);
  $("meyebrow").textContent = d===null ? "Recette" : `${JOURS[d]} ${fmtShort(dayOffset(d))}${state.cooks[d]?" · cuisiné par "+state.cooks[d]:""}`;
  $("mtitle").textContent = r.nom;
  $("mmeta").innerHTML = `<span class="pill">${r.t} min</span><span class="pill cost">≈ ${eur(total)} · ${eur(total/Math.max(1,headcount(d)))} / pers.</span><span>${headcount(d)} à table · avec ${r.acc.toLowerCase()}</span>`;
  const trips = d===null ? [null] : [...new Set(items.map(i=>i.t))].sort();
  const lists = trips.map(t=>{const its=items.filter(i=>i.t===t);
    const plan = t===null?null:planTrip(t,coursesTrips()[t]), date = t===null?null:tripDate(t);
    const head = t===null ? "" : `<div class="store">Courses de la semaine · ${fmtD(date)}</div>`;
    const rows = its.map(i=>{const c = i.ck && !!state.checked[i.ck];
      const tags = promosFor(i.n).map(p=>{const ok = date ? validOn(p,date) : true;
        return `<span class="ptag"${ok?"":' style="opacity:.6"'}>· Promo ${ENS[p.mag]} ${eur(p.prix)}${ok?"":" (pas valable ce jour-là)"}</span>`}).join("");
      const box = i.ck ? `<input type="checkbox" data-mk="${esc(i.ck)}"${c?" checked":""} aria-label="${esc(i.n)} acheté">` : `<span></span>`;
      return `<label class="item${c?" checked":""}">${box}<span class="iname"><b>${esc(i.n)}</b><small>${plan?`<b style="color:var(--accent);font-weight:700">${MAGNOM[plan.assign[i.n+"|"+i.u]||plan.primary]}</b> · `:""}${RAYONS[i.ray]} · ≈ ${eur(i.cost)}${tags}</small></span><span class="qty">${qtyOf(i)}</span></label>`}).join("");
    return head+`<div class="list">${rows}</div>`}).join("");
  const steps = getSteps(id).map(s=>`<li><span>${esc(s)}</span></li>`).join("");
  const w=dislikesFor(r,d), pp=photoPage(id);
  const ctrl = d===null ? `<div class="mctrl"><button class="btn primary" data-cookmode="1">Cuisiner pas à pas</button>${r.perso?`<button class="btn edit-only" data-editrec="${id}">Modifier</button><button class="btn edit-only owner-only" data-delrec="${id}">${delArm===id?"Confirmer la suppression":"Supprimer"}</button>`:""}</div>`
    : isOut(d) ? `<div class="mout"><b>Ce soir, repas à l'extérieur.</b><span>Ce plat n'est ni compté dans les courses ni dans le budget. Il reste proposé si vos plans changent.</span><button class="btn primary edit-only" data-outtoggle="${d}">Finalement, on mange à la maison</button></div>`
    : `<div class="mctrl"><button class="btn primary" data-cookmode="1">Cuisiner pas à pas</button><button class="btn edit-only" data-gallery="${d}">Changer de plat</button><button class="btn edit-only" data-swap="${d}">Autre idée</button><button class="btn edit-only" data-outtoggle="${d}">Manger à l'extérieur ce soir</button></div>
       <div class="mcook edit-only"><span>Aux fourneaux</span>${cookSelect(d)}</div>`;
  const avis = state.family.length ? `<section id="avis"><h3><span>L'avis de la famille</span><span class="mtotal">${avisSummary(r)}</span></h3>
      <div class="avislist">${state.family.map((n,i)=>{const v=(state.avis[id]||{})[n]||0;
        return `<div class="avisrow"><span>${esc(n)}</span><button class="avb up edit-ctl" data-avis="${i}|1" aria-pressed="${v===1}">J'aime</button><button class="avb down edit-ctl" data-avis="${i}|-1" aria-pressed="${v===-1}">Pas pour moi</button></div>`}).join("")}</div>
      <p class="note">Les plats aimés reviennent plus souvent dans les propositions, les autres sont évités les soirs où la personne est là.</p></section>` : "";
  $("mbody").innerHTML = `<figure class="mphoto"><img src="${photoSrc(id)}" alt="${esc(r.nom)}" data-cache-parent="1">${pp?`<figcaption>Photo d'illustration : <a href="${pp}" target="_blank" rel="noopener">Wikimedia Commons</a> (auteur et licence libre sur la page du fichier)</figcaption>`:(r.perso?`<figcaption>Recette de la famille</figcaption>`:"")}</figure>
    ${w.length?`<div class="mwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas ce plat${d!==null?" et sera là ce soir":""}.</div>`:""}
    ${ctrl}
    <section><h3><span>Courses pour ce repas</span><span class="mtotal">${items.length} ingrédients</span></h3>${lists}
      ${d!==null?'<p class="note" style="margin-top:6px">Cocher ici coche aussi l\'article dans la liste de la course correspondante.</p>':""}
      <div class="actions" style="margin-top:8px"><button class="btn" id="mcopy">Copier ces ingrédients</button></div></section>
    <section><h3><span>Préparation</span><span class="mtotal">${r.t} min</span></h3>${steps?`<ol class="steps">${steps}</ol>`:`<p class="note">Pas encore d'étapes pour cette recette.</p>`}</section>
    ${r.astuce?`<div class="mtip"><b>Astuce :</b> ${esc(r.astuce)}</div>`:""}
    ${r.proposePar?`<p class="note">Recette proposée par ${esc(r.proposePar)}.</p>`:""}
    ${r.source?`<p class="note">Idée trouvée sur <a href="${esc(r.source.url)}" target="_blank" rel="noopener">${esc(r.source.titre||"le web")}</a>${r.ajoute?`, ajoutée le ${new Date(r.ajoute).toLocaleDateString("fr-BE")}`:""}.</p>`:""}
    ${avis}
    <p class="note">Sel, poivre, huile et ail sont à prendre au placard. Coût estimé selon la gamme ${GAMMES[state.gamme].nom.toLowerCase()}.</p>
    ${d===null?"":`<div class="links"><button class="chip" data-gotrip="${items.find(i=>i.t!==null)?.t??0}">Voir la liste de la course</button><button class="chip" data-goto="courses" data-el="economies">Voir les promos</button></div>
    <div class="mnav"><button data-mday="${d-1}"${d===0?" disabled":""}><small>← Veille</small>${d>0?esc(BYID[state.week[d-1]].nom):"—"}</button><button data-mday="${d+1}"${d===6?" disabled":""}><small>Lendemain →</small>${d<6?esc(BYID[state.week[d+1]].nom):"—"}</button></div>`}`;
}
function openMeal(id,d){ lastFocus=document.activeElement; modalCtx={id,d}; renderModal(); $("overlay").hidden=false; document.body.style.overflow="hidden"; $("mclose").focus(); }
function closeMeal(){ modalCtx=null; $("overlay").hidden=true; document.body.style.overflow=""; if(lastFocus&&lastFocus.focus) try{lastFocus.focus()}catch(e){} }
$("mclose").onclick=closeMeal;
function modalDay(nd){ if(!modalCtx||modalCtx.d===null||nd<0||nd>6) return; modalCtx={id:state.week[nd],d:nd}; renderModal(); $("modal").scrollTop=0; }
$("mbody").addEventListener("click",e=>{const b=e.target.closest("[data-mday]"); if(b&&!b.disabled) modalDay(+b.dataset.mday);});
document.addEventListener("keydown",e=>{ if(!modalCtx||modalCtx.d===null) return; if(e.key==="ArrowLeft") modalDay(modalCtx.d-1); if(e.key==="ArrowRight") modalDay(modalCtx.d+1); });
// glisser à gauche/droite pour changer de jour
(()=>{let x0=null,y0=null; const m=$("modal");
  m.addEventListener("touchstart",e=>{const t=e.touches[0]; x0=t.clientX; y0=t.clientY;},{passive:true});
  m.addEventListener("touchend",e=>{ if(x0===null) return; const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0; x0=null;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5&&modalCtx) modalDay(modalCtx.d+(dx<0?1:-1)); },{passive:true});
})();
$("overlay").addEventListener("click",e=>{ if(e.target===$("overlay")) closeMeal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&modalCtx) closeMeal(); });
$("mbody").addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.mk; if(!k) return;
  if(e.target.checked) state.checked[k]=true; else delete state.checked[k]; save(); renderCourses(); renderModal();});
$("mbody").addEventListener("click",e=>{ if(e.target.id!=="mcopy") return;
  const {id,d}=modalCtx, items=mealItems(id,d);
  const txt=BYID[id].nom+(d!==null?" ("+JOURS[d]+")":"")+" · "+headcount(d)+" pers.\n"+items.map(i=>"- "+i.n+" : "+qtyOf(i)).join("\n");
  try{ navigator.clipboard.writeText(txt).then(()=>toast("Ingrédients copiés"),()=>toast("Copie impossible ici")); }catch(err){ toast("Copie impossible ici"); }
});
$("recipes").addEventListener("click",e=>{const b=e.target.closest("[data-openrec]"); if(b) openMeal(b.dataset.openrec,null);});
$("trip1").onchange=e=>{state.trip1=e.target.value;state.checked={};save();render();toast("Jour des courses : "+tripName(0));};

function render(){if(!$("view-menu")) return; $("trip1").value=state.trip1;renderWeekbar();renderCompteHaut();renderACompleter();renderCalendrier();renderPresences();renderBudget();renderStats();renderDays();renderCourses();renderPromos();renderRecettes();renderReglages();if(typeof renderRetours==="function")renderRetours();if(state.tab==="envies"&&typeof renderEnvies==="function")renderEnvies();}
$("sugg").addEventListener("change",e=>{const s=e.target.closest("select[data-add]"); if(!s||s.value==="") return;
  replaceDay(+s.value,s.dataset.add);});
$("cmp").addEventListener("change",e=>{const inp=e.target.closest("input[data-pk]"); if(!inp) return;
  const k=inp.dataset.pk, m=inp.dataset.mag, v=parseFloat(String(inp.value).replace(",","."));
  state.prices[k]=state.prices[k]||{}; if(isNaN(v)) delete state.prices[k][m]; else state.prices[k][m]=Math.round(v*100)/100;
  save(); renderCmp(true);});
$("clearprices").onclick=()=>{state.prices={};save();renderCmp();toast("Prix effacés");};
function syncPersons(){ if(state.family.length) state.persons=state.family.length; }
document.addEventListener("change",e=>{const s=e.target.closest("select[data-cook]"); if(!s) return;
  state.cooks[+s.dataset.cook]=s.value||null; save(); render(); if(modalCtx) renderModal();});
$("addform").addEventListener("submit",e=>{e.preventDefault(); const n=$("newname").value.trim();
  if(!n) return; if(state.family.some(x=>x.toLowerCase()===n.toLowerCase())){toast(n+" est déjà dans la famille");return;}
  const m=$("newmail").value.trim();
  if(m&&!validMail(m)){ toast("Adresse e-mail invalide : vérifiez-la"); $("newmail").focus(); return; }
  state.family.push(n); if(m) state.emails={...state.emails,[n]:m};
  syncPersons(); $("newname").value=""; $("newmail").value=""; save(); render(); $("newname").focus(); toast(n+" ajouté(e)");});
const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m);
$("members").addEventListener("change",e=>{const inp=e.target.closest("input[data-mail]"); if(!inp) return;
  const n=state.family[+inp.dataset.mail]; if(!n) return; const m=inp.value.trim();
  if(m&&!validMail(m)){ inp.classList.add("bad"); toast("Adresse e-mail invalide : vérifiez-la"); return; }
  inp.classList.remove("bad"); const em={...state.emails}; if(m) em[n]=m; else delete em[n]; state.emails=em; save(); renderReglages(); if(shareOpen) renderWeekbar(); toast(m?"Adresse enregistrée":"Adresse retirée");});
$("copymails").onclick=()=>{ const list=state.family.map(n=>state.emails[n]).filter(Boolean);
  if(!list.length){ toast("Ajoutez d'abord des adresses e-mail"); return; }
  const txt=list.join(", ");
  try{ navigator.clipboard.writeText(txt).then(()=>toast(list.length+" adresse"+(list.length>1?"s":"")+" copiée"+(list.length>1?"s":"")),()=>toast(txt)); }catch(err){ toast(txt); } };
$("members").addEventListener("click",e=>{const b=e.target.closest("[data-del]"); if(!b) return;
  const n=state.family[+b.dataset.del]; state.family.splice(+b.dataset.del,1);
  state.cooks=state.cooks.map(c=>c===n?null:c); if(state.absents[n]){ const c={...state.absents}; delete c[n]; state.absents=c; } if(state.emails[n]){ const em={...state.emails}; delete em[n]; state.emails=em; } syncPersons(); save(); render(); toast(n+" retiré(e)");});
$("autoassign").onclick=()=>{ if(!state.family.length){toast("Ajoutez d'abord des prénoms");return;}
  const start=Math.floor(Math.random()*state.family.length);
  state.cooks=JOURS.map((_,d)=>state.family[(start+d)%state.family.length]); save(); render(); toast("Soirs répartis");};
$("clearassign").onclick=()=>{state.cooks=Array(7).fill(null);save();render();toast("Attributions effacées");};
function toast(msg,undo,label){const t=$("toast");t.textContent=msg;
  if(undo){const b=document.createElement("button");b.textContent=label||"Annuler";b.onclick=()=>{undo();t.hidden=true;};t.appendChild(b);}
  t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,undo?4500:2000);}
// Remplacement d'un plat avec possibilité d'annuler
function replaceDay(d,newId){ const prev=state.week[d]; state.week[d]=newId; state.picking=null; save(); render();
  toast(JOURS[d]+" : "+BYID[newId].nom,()=>{state.week[d]=prev; save(); render(); toast("Plat rétabli");}); }

document.querySelector("nav").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]"); if(b) setTab(b.dataset.tab);});
$("minus").onclick=()=>{if(state.persons>1){state.persons--;save();render();}};
$("plus").onclick=()=>{if(state.persons<12){state.persons++;save();render();}};
$("days").addEventListener("click",e=>{
  const o=e.target.closest("[data-open]"); if(o){ openMeal(state.week[+o.dataset.open], +o.dataset.open); return; }
  const s=e.target.closest("[data-swap]"), p=e.target.closest("[data-pick]");
  if(s){const d=+s.dataset.swap; const libres=RECETTES.filter(r=>!state.week.includes(r.id));
    const pool=libres.length?libres:RECETTES.filter(r=>r.id!==state.week[d]);
    replaceDay(d,pool[Math.floor(Math.random()*pool.length)].id);}
  if(p){const d=+p.dataset.pick; state.picking=state.picking===d?null:d; renderDays(); const sel=$("pick-"+d); if(sel) sel.focus();}
});
$("days").addEventListener("change",e=>{const sel=e.target.closest("select.pick"); if(!sel) return;
  replaceDay(+sel.dataset.day,sel.value);});
$("aisles").addEventListener("change",e=>{const k=e.target.dataset.k; if(!k) return; if(e.target.checked) state.checked[k]=true; else delete state.checked[k]; save(); renderCourses();});
$("aisles").addEventListener("change",e=>{const s=e.target.closest("select[data-store]"); if(!s) return;
  state.tripStore[+s.dataset.store]=s.value||null; save(); renderCourses();});
$("plan").addEventListener("change",e=>{
  if(e.target.id==="maxstores"){state.maxStores=+e.target.value;}
  else if(e.target.id==="seuil"){state.seuil=+e.target.value;}
  else return; save(); renderCourses();});
$("budget").addEventListener("click",e=>{ const m=e.target.closest("[data-mix]"); if(m){ const k=m.dataset.mix, v=Math.max(0,(state.mix[k]|0)+(+m.dataset.dv)); state.mix={...state.mix,[k]:v}; save(); render(); toast("Répartition enregistrée : elle s'appliquera à la prochaine proposition"); return; }
  if(e.target.closest("#mixpropose")){ $("propose")&&$("propose").click(); return; } });
$("budget").addEventListener("click",e=>{const b=e.target.closest("[data-gamme]"); if(!b) return; state.gamme=b.dataset.gamme; save(); render();});
$("uncheck").onclick=()=>{state.checked={};save();renderCourses();toast("Liste remise à zéro");};
$("copy").onclick=()=>{
  const trips=coursesTrips();
  const txt="Courses de la semaine ("+totalCouverts()+" couverts)\n"+trips.map((all,t)=>{const items=all.filter(i=>!state.checked[i.ck]); if(!items.length) return "";
    const plan=planTrip(t,all);
    return "\n== Course "+(t+1)+" · "+tripName(t)+" ==\n"+[plan.primary,plan.secondary].filter(Boolean).map(mag=>{const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return "";
      return "\n>> "+MAGNOM[mag]+"\n"+ORDRE.map(ray=>{const its=si.filter(i=>i.ray===ray); return its.length? RAYONS[ray]+"\n"+its.map(i=>"- "+i.n+" : "+qtyOf(i)).join("\n")+"\n":""}).join("");}).join("");}).join("");
  const box=$("copybox");
  const fallback=()=>{box.value=txt;box.hidden=false;box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");};
  try{ navigator.clipboard.writeText(txt).then(()=>{box.hidden=true;toast("Liste copiée");},fallback);}catch(err){fallback();}
};
// ======================= Semaines et partage familial =======================
// Proposition automatique : évite les plats de la semaine précédente, privilégie les promos,
// plats les plus rapides en semaine et ceux de 30 min le week-end.
// ---- Règle des budgets et de la variété ----
const BUDGETS={eco:{nom:"Économique",court:"Éco",desc:"Le quotidien à petit prix"},moyen:{nom:"Budget moyen",court:"Moyen",desc:"Un peu plus de viande ou de variété"},plaisir:{nom:"Pour se faire plaisir",court:"Plaisir",desc:"Le repas qu'on attend dans la semaine"}};
const PROT={veau:"veau",boeuf:"bœuf",porc:"porc",volaille:"volaille",poisson:"poisson",oeufs:"œufs",vege:"végétarien"};
const FECU={legumes:"légumes",lentilles:"lentilles",galette:"galettes",pates:"pâtes",riz:"riz",pdt:"pommes de terre",pain:"pain ou galette",tarte:"pâte à tarte",semoule:"semoule"};
// Recette de famille : budget déduit de son prix de revient par personne (gamme économique)
function budgetOf(r){ if(r.b) return r.b; let c=0; try{ c=r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0)/5+(r.prix?r.prix/5:0); }catch(e){} return c<1.6?"eco":c<2.6?"moyen":"plaisir"; }
function mixFor(n){ const m=state.mix||{plaisir:1,moyen:2}; let pl=Math.min(n,Math.max(0,m.plaisir|0)), mo=Math.min(n-pl,Math.max(0,m.moyen|0)); return {plaisir:pl,moyen:mo,eco:n-pl-mo}; }
function recentIds(nbWeeks){ const ids=new Set(), src={...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})};
  for(let k=1;k<=nbWeeks;k++){ const iso=isoOf(new Date(MONDAY.getFullYear(),MONDAY.getMonth(),MONDAY.getDate()-7*k)); const w=src[iso]; if(w&&Array.isArray(w.menu)) w.menu.forEach(id=>ids.add(id)); } return ids; }
function proposeMenu(opts={}){
  const out=opts.out||outList(state.exterieur), home=[0,1,2,3,4,5,6].filter(d=>!out.includes(d)), quota=opts.mix?(()=>{ const pl=Math.min(home.length,opts.mix.plaisir), mo=Math.min(home.length-pl,opts.mix.moyen); return {plaisir:pl,moyen:mo,eco:home.length-pl-mo}; })():mixFor(home.length);
  const recent1=recentIds(1), recent2=recentIds(2), avoid=opts.avoid||new Set();
  let profs=null; try{ if(typeof profil==="function"&&state.family.length) profs=Object.fromEntries(state.family.map(n=>[n,profil(n)])); }catch(e){}
  const fam=r=>{ try{ return profs?scoreFamille(r,profs):0; }catch(e){ return 0; } };
  const base=r=>promoCount(r)*0.6+(opts.extra?opts.extra(r):likeScore(r)*0.6+fam(r)*1.2)-dislikesFor(r,null).length*1.5+(typeof bonusRetours==="function"?bonusRetours(r):0)-(recent1.has(r.id)||avoid.has(r.id)?6:recent2.has(r.id)?2:0);
  const S=Object.fromEntries(RECETTES.map(r=>[r.id,base(r)]));
  // le plat plaisir de préférence le vendredi ou le dimanche, les plats de 30 minutes plutôt le week-end
  const order=[...home].sort((x,y)=>([4,6,5,3,2,1,0].indexOf(x))-([4,6,5,3,2,1,0].indexOf(y)));
  const sols=[];
  for(let essai=0;essai<250;essai++){
    const left={...quota}, used=new Set(), pick={}, cntP={}, cntF={}; let total=0, ok=true;
    for(const d of order){
      const want=left.plaisir>0?"plaisir":left.moyen>0&&Math.random()<left.moyen/(left.moyen+left.eco)?"moyen":left.eco>0?"eco":"moyen";
      const cand=RECETTES.filter(r=>!used.has(r.id)&&budgetOf(r)===want).filter(r=>{
        const p=r.p||"autre", f=r.f||"autre";
        if((cntF[f]||0)>=2) return false;                                   // pas plus de 2 fois le même féculent
        if(p!=="vege"&&(cntP[p]||0)>=2) return false;                       // pas plus de 2 fois la même viande
        if(pick[d-1]&&(BYID[pick[d-1]].p===p&&p!=="vege"||BYID[pick[d-1]].f===f)) return false;   // pas deux soirs de suite pareil
        if(pick[d+1]&&(BYID[pick[d+1]].p===p&&p!=="vege"||BYID[pick[d+1]].f===f)) return false;
        if(r.t>=30&&(d<4)&&Math.random()<0.5) return false;                 // les plats plus longs plutôt en fin de semaine
        return true; });
      if(!cand.length){ ok=false; break; }
      const sc=cand.map(r=>({r,s:S[r.id]+Math.random()*3})).sort((x,y)=>y.s-x.s)[0];
      pick[d]=sc.r.id; used.add(sc.r.id); cntP[sc.r.p]=(cntP[sc.r.p]||0)+1; cntF[sc.r.f]=(cntF[sc.r.f]||0)+1; left[want]--; total+=sc.s;
    }
    if(!ok) continue;
    const prots=Object.keys(cntP); if(prots.includes("poisson")) total+=1; if(prots.includes("vege")||prots.includes("oeufs")) total+=1.5; total+=prots.length*0.5;
    sols.push({total,pick});
  }
  // on tire au hasard parmi les 25 meilleures combinaisons : les menus changent d'une proposition à l'autre
  sols.sort((x,y)=>y.total-x.total); const best=sols.length?sols[Math.floor(Math.random()*Math.min(25,sols.length))]:null;
  const res=Array(7).fill(null);
  if(best) Object.entries(best.pick).forEach(([d,id])=>{ res[+d]=id; });
  // jours à l'extérieur, ou si aucune combinaison ne respecte les règles : on complète simplement
  const pool=RECETTES.map(r=>r.id).filter(id=>!res.includes(id)).sort((x,y)=>S[y]-S[x]);
  for(let d=0;d<7;d++) if(!res[d]) res[d]=pool.shift()||RECETTES[d%RECETTES.length].id;
  return res;
}
function weekLabel(){ const a=dayOffset(0), b=dayOffset(6);
  return `${a.getDate()} ${a.getMonth()!==b.getMonth()?a.toLocaleDateString("fr-BE",{month:"short"})+" ":""}au ${b.getDate()} ${b.toLocaleDateString("fr-BE",{month:"long"})}`; }
function relWeek(){ return ["Cette semaine","Semaine suivante","Dans 2 semaines","Dans 3 semaines"][state.weekOffset]; }
function goWeek(off){ if(off<0||off>3||off===state.weekOffset) return;
  stashWeek(); state.weekOffset=off; setMonday(off);
  const w=state.weeks[curIso()];
  if(w&&Array.isArray(w.menu)&&w.menu.length===7&&w.menu.every(id=>BYID[id])) applyWeekData(w);
  else { state.week=proposeMenu(); state.cooks=Array(7).fill(null); state.checked={}; state.statut="proposition"; state.journal=[]; state.absents={}; state.invites=[0,0,0,0,0,0,0]; state.approbations={}; state.limite=null; state.exterieur=null; state.extras=[]; state.qtEdit={}; state.tickets=[]; }
  state.picking=null; applyValidation(); saveLocal(); subscribeWeek(); render(); }

// --- partage via la base de données de la page ---
let DB=null, USER=null, ME=null, CAN_WRITE=null, unsubWeek=null, unsubFam=null, IS_OWNER=true, VALID={}, LIMITES={};
let shareOpen=false, shareReady=false, lastShared=null, lastFamily=null, writing=false, dirty=false, syncState="local";
const sharedPayload=()=>({menu:state.week,cuisiniers:state.cooks,coches:state.checked,absents:state.absents,invites:state.invites,approbations:state.approbations,exterieur:state.exterieur,ajouts:state.extras,quantites:state.qtEdit||{},tickets:state.tickets||[]});
function describeChange(prev,next){
  if(!prev) return "a proposé le menu de la semaine";
  const out=[];
  next.menu.forEach((id,d)=>{ if(prev.menu&&prev.menu[d]!==id) out.push(`${JOURS[d]} : ${BYID[id].nom}`); });
  next.cuisiniers.forEach((c,d)=>{ if((prev.cuisiniers||[])[d]!==c) out.push(`${JOURS[d]} : ${c?c+" aux fourneaux":"personne aux fourneaux"}`); });
  state.family.forEach(n=>{ const a=(prev.absents||{})[n]||[], b=(next.absents||{})[n]||[];
    JOURS.forEach((j,d)=>{ if(a.includes(d)!==b.includes(d)) out.push(`${n} ${b.includes(d)?"absent(e)":"présent(e)"} ${j.toLowerCase()}`); }); });
  JOURS.forEach((j,d)=>{ const a=outList(prev.exterieur).includes(d), b=outList(next.exterieur).includes(d); if(a!==b) out.push(`${j} : ${b?"repas à l'extérieur":"on mange à la maison"}`); });
  state.family.forEach(n=>{ const a=(prev.approbations||{})[n], b=(next.approbations||{})[n]; if(!a&&b) out.push(`${n} a validé le menu`); if(a&&!b) out.push(`${n} a retiré sa validation`); });
  (next.invites||[]).forEach((v,d)=>{ const o=(prev.invites||[])[d]||0; if(o!==v) out.push(`${JOURS[d]} : ${v} invité${v>1?"s":""}`); });
  const pa=new Set((prev.ajouts||[]).map(x=>x.id)), na=(next.ajouts||[]).filter(x=>!pa.has(x.id));
  if(na.length) out.push(`a ajouté ${na.map(x=>x.n.toLowerCase()).join(", ")} aux courses`);
  if(!out.length && JSON.stringify(prev.coches)!==JSON.stringify(next.coches)) return null; // cocher ne pollue pas le journal
  return out.slice(0,3).join(" · ")+(out.length>3?` (+${out.length-3})`:"");
}
function shareSync(){
  if(!DB||CAN_WRITE===false||!shareReady) return;
  const now=sharedPayload(), s=JSON.stringify(now);
  if(s===lastShared) return;
  const txt=describeChange(lastShared?JSON.parse(lastShared):null,now);
  lastShared=s;
  if(txt){ state.journal=[{par:ME,quand:new Date().toISOString(),texte:txt},...state.journal].slice(0,15); saveLocal(); }
  queueWrite();
}
async function queueWrite(){
  if(writing){dirty=true;return;} writing=true;
  const iso=curIso(), body={...sharedPayload(),journal:state.journal,maj:new Date().toISOString()};
  try{ await DB.doc("semaines/"+iso).set(body); setSync("ok"); }
  catch(e){ if(e&&e.code==="invalid_argument"){ CAN_WRITE=false; document.body.classList.add("readonly"); setSync("readonly"); } else setSync("err"); }
  writing=false; if(dirty){dirty=false; queueWrite();}
}
function subscribeWeek(){
  if(!DB) return; if(unsubWeek) unsubWeek(); shareReady=false; lastShared=null; setSync("load");
  const iso=curIso(); const timer=setTimeout(()=>setSync("slow"),10000);
  unsubWeek=DB.doc("semaines/"+iso).onSnapshot(snap=>{
    if(iso!==curIso()) return;
    if(snap.exists){
      const d=snap.data();
      if(Array.isArray(d.menu)&&d.menu.length===7&&!d.menu.every(id=>BYID[id])) pendingWeek={iso,d};
      if(!snap.metadata.hasPendingWrites && Array.isArray(d.menu) && d.menu.length===7 && d.menu.every(id=>BYID[id])){
        applyWeekData({menu:d.menu,cooks:d.cuisiniers,checked:d.coches,statut:d.statut,journal:d.journal,absents:d.absents,invites:d.invites,approbations:d.approbations,exterieur:d.exterieur,extras:d.ajouts,quantites:d.quantites,tickets:d.tickets});
        lastShared=JSON.stringify(sharedPayload()); saveLocal(); render(); if(modalCtx) renderModal();
      }
    }
    if(!snap.metadata.fromCache){ clearTimeout(timer); shareReady=true; setSync(CAN_WRITE===false?"readonly":"ok");
      if(!snap.exists) shareSync(); }   // première ouverture : on publie le menu local pour la famille
  }, err=>{ clearTimeout(timer); setSync("err"); });
}
function subscribeFamily(){
  if(!DB) return; if(unsubFam) unsubFam();
  unsubFam=DB.doc("famille/liste").onSnapshot(snap=>{
    if(snap.exists){ const m=snap.data().membres; if(Array.isArray(m)&&!snap.metadata.hasPendingWrites){ state.family=[...new Set(m.map(x=>propre(x,30)).filter(Boolean))].slice(0,20); const em=snap.data().emails; state.emails={}; if(em&&typeof em==="object") state.family.forEach(n=>{ if(typeof em[n]==="string"&&validMail(em[n])) state.emails[n]=em[n]; }); lastFamily=JSON.stringify(famPayload()); syncPersons(); saveLocal(); render(); } }
    else if(!snap.metadata.fromCache){ lastFamily=""; familySync(); }
  },()=>{});
}
let famWriting=false, famDirty=false;
const famPayload=()=>({membres:state.family,emails:Object.fromEntries(state.family.filter(n=>state.emails[n]).map(n=>[n,state.emails[n]]))});
async function familySync(){
  if(DB&&!IS_OWNER) return;
  if(!DB||CAN_WRITE===false||lastFamily===null) return;
  const s=JSON.stringify(famPayload()); if(s===lastFamily) return;
  if(famWriting){famDirty=true;return;} famWriting=true; lastFamily=s;
  try{ await DB.doc("famille/liste").set(famPayload()); }catch(e){}
  famWriting=false; if(famDirty){famDirty=false; familySync();}
}
function setSync(st){ syncState=st; const el=$("sync"); if(!el) return;
  const t={local:"Enregistré sur cet appareil",load:"Synchronisation…",ok:"Partagé avec la famille",slow:"Connexion lente : vos changements partiront dès que possible",err:"Partage indisponible pour le moment",readonly:"Lecture seule"}[st];
  el.textContent=t; el.className="sync "+st; }
async function renderJournal(){
  const box=$("journal"); if(!box) return;
  const items=state.journal.slice(0,5);
  if(!items.length){ box.innerHTML=`<p class="note">${DB?"Les modifications de chacun apparaîtront ici.":"Le journal des modifications s'active quand vous rejoignez la famille avec le code d'invitation."}</p>`; return; }
  box.innerHTML=items.map((j,i)=>`<div class="jrow"><span class="jwho" id="jw-${i}">…</span><span class="jtxt"></span><span class="jwhen">${ago(j.quand)}</span></div>`).join("");
  items.forEach((j,i)=>{ box.children[i].querySelector(".jtxt").textContent=j.texte; });
  const ids=[...new Set(items.map(j=>j.par).filter(Boolean))];
  let ps={}; try{ if(USER&&ids.length) ps=await USER.profiles(ids); }catch(e){}
  items.forEach((j,i)=>{ const el=$("jw-"+i); if(!el) return; const p=j.par&&ps[j.par];
    el.textContent = p&&p.isMe ? "Vous" : (p&&p.name) || "Quelqu'un"; });
}
function ago(iso){ const m=Math.round((Date.now()-new Date(iso).getTime())/60000);
  if(!(m>=0)) return ""; if(m<1) return "à l'instant"; if(m<60) return `il y a ${m} min`; const h=Math.round(m/60); if(h<24) return `il y a ${h} h`; return `il y a ${Math.round(h/24)} j`; }
function renderWeekbar(){
  const valide=state.statut==="valide";
  $("weekbar").innerHTML=`<div class="wtop">
      <button class="wnav" data-week="${state.weekOffset-1}" ${state.weekOffset===0?"disabled":""} aria-label="Semaine précédente">‹</button>
      <div class="wtitle"><small>${relWeek()}</small><b>Semaine du ${weekLabel()}</b></div>
      <button class="wnav" data-week="${state.weekOffset+1}" ${state.weekOffset===3?"disabled":""} aria-label="Semaine suivante">›</button>
    </div>
    <div class="wstate"><span class="st ${valide?"on":"soon"}">${valide?"Menu validé":"Proposition à discuter"}</span><span class="sync ${syncState}" id="sync"></span></div>
    <div class="actions wact">
      <button class="btn primary" id="share" data-tip="Prépare un message avec le menu et le lien de l'application, à envoyer par WhatsApp ou SMS">Envoyer à la famille</button>
      <button class="btn edit-only owner-only${!valide&&manques().length?" incomplet":""}" id="valider" data-tip="${valide?"Permet à nouveau de changer les plats et les cuisiniers":manques().length?"Impossible pour l'instant : "+esc(manquesTexte(manques()))+". Complétez d'abord ces soirs.":"Fige le menu de la semaine : il devient le menu officiel"}">${valide?"Rouvrir aux modifications":"Valider le menu"}</button>
      <button class="btn" id="exportmenu" data-tip="Calendrier de la semaine en PDF (ou en texte), avec les plats, les cuisiniers et les couverts">📄 Menu en PDF</button>
      <button class="btn edit-only" id="propose" data-tip="Tire un nouveau menu selon la répartition des budgets, la variété et les goûts de chacun">Nouvelle proposition</button>
      ${state.weekOffset===0?`<button class="btn" data-week="1" data-tip="Passe à la semaine prochaine pour préparer son menu à l'avance">Préparer la semaine suivante →</button>`:""}
    </div>
    ${renderApprovals()}
    <div class="sharebox" id="sharebox"${shareOpen?"":" hidden"}>
      <ol class="sharesteps">
        <li>${window.INVITE_URL?`Envoyez ce lien d'invitation à chaque membre de la famille. En l'ouvrant, chacun indique son prénom et peut tout de suite modifier les menus.<div class="invite"><code>${esc(window.INVITE_URL)}</code><button class="btn" id="copyinvite" type="button">Copier le lien</button></div>`:`Demandez le lien d'invitation au propriétaire de l'application (Réglages, Accès de la famille).`}</li>
        <li>Envoyez-leur le message ci-dessous par WhatsApp, SMS ou e-mail.</li>
      </ol>
      <textarea class="copybox" id="sharemsg" readonly aria-label="Message pour la famille">${esc(shareMessage())}</textarea>
      <div class="actions"><button class="btn primary" id="copymsg">Copier le message</button></div>
    </div>
    <div class="journal"><h3>Dernières modifications</h3><div id="journal"></div></div>`;
  setSync(syncState); renderJournal();
}
// ---- Validation par chaque membre et date limite ----
const menuKey = () => state.week.join(",")+"|"+outList(state.exterieur).join("");
function approvalOf(n){ const a=state.approbations[n]; if(!a) return null; return {...a, ancienne: a.menu && a.menu!==menuKey()}; }
// Date limite de réponse : par défaut le samedi qui précède la semaine, à 10 h (jour de la première course)
function limiteParDefaut(){ const d=new Date(MONDAY); d.setDate(d.getDate()-2); d.setHours(10,0,0,0); return d; }
const isoLocal = d => isoOf(d)+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
function limiteDate(){ return state.limite? new Date(state.limite) : limiteParDefaut(); }
// Décompte affiché en haut à droite de la page
function renderCompteHaut(){ const box=$("comptehaut"); if(!box) return; const L=limiteDate();
  if(!state.family.length||!L||isNaN(L)){ box.hidden=true; return; } box.hidden=false; const t=decompte(L);
  if(state.statut==="valide"){ box.className="comptehaut"; box.innerHTML=`<small>Menu validé</small><b>✓</b><small>Semaine du ${esc(weekLabel())}</small>`; return; }
  const {ok}=approvalStats(); if(ok.length===state.family.length){ box.className="comptehaut"; box.innerHTML=`<small>Toute la famille a validé</small><b>${ok.length}/${state.family.length} ✓</b><small>${IS_OWNER?"Il reste à valider le menu final":"En attente de la validation finale"}</small>`; return; }
  box.className="comptehaut"+(!t?" fini":(L-Date.now())<24*36e5?" urgent":"");
  box.innerHTML=t?`<small>Validation du menu : il reste</small><b role="timer" data-compte="${L.getTime()}">${t}</b><small>avant ${esc(limiteTxt())}</small>`:`<small>Validation du menu</small><b>Délai dépassé</b><small>depuis ${esc(limiteTxt())}</small>`; }
// Décompte : « 1 j 12 h 05 min », mis à jour en continu dans tout élément portant data-compte
function decompte(L){ let ms=L-Date.now(); if(ms<=0) return null; const j=Math.floor(ms/864e5); ms-=j*864e5; const h=Math.floor(ms/36e5); ms-=h*36e5; const m=Math.floor(ms/6e4), sec=Math.floor((ms-m*6e4)/1000);
  const mm=String(m).padStart(2,"0"), ss=String(sec).padStart(2,"0");
  return j?`${j} j ${h} h ${mm} min ${ss} s`:h?`${h} h ${mm} min ${ss} s`:`${m} min ${ss} s`; }
setInterval(()=>{ document.querySelectorAll("[data-compte]").forEach(el=>{ const L=new Date(+el.dataset.compte), t=decompte(L);
  if(t) el.textContent=t; else if(!el.dataset.fini){ el.dataset.fini="1"; render(); } }); },1000);
function limiteTxt(){ const L=limiteDate(); if(!L||isNaN(L)) return null;
  return L.toLocaleDateString("fr-BE",{weekday:"long",day:"numeric",month:"long"})+" à "+L.toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}); }
function approvalStats(){ const ok=state.family.filter(n=>{const a=approvalOf(n); return a&&!a.ancienne;}); return {ok, wait:state.family.filter(n=>!ok.includes(n))}; }
function renderApprovals(){
  if(!state.family.length) return "";
  const L=limiteDate(), past=L&&Date.now()>L.getTime(), {ok,wait}=approvalStats();
  const urgent=L&&!past&&(L-Date.now())<24*36e5;
  return `<div class="appr">
    <div class="apprhead"><b>Validation de la famille</b><span class="st ${wait.length?"soon":"on"}">${ok.length}/${state.family.length} ont validé</span></div>
    <div class="apprdeadline${past?" late":""}">
      ${past?`<span>Délai dépassé depuis ${esc(limiteTxt())}</span>`:`<span>Réponse attendue avant <b>${esc(limiteTxt())}</b></span>
`}
      <span class="owner-only edit-only"><label class="sr" for="limite">Date limite</label><input type="datetime-local" id="limite" value="${esc(isoLocal(L))}" aria-label="Date limite de réponse" data-tip="Par défaut : le samedi avant la semaine, à 10 h">${state.limite?`<button class="chip" id="nolimite" data-tip="Revenir au samedi 10 h">Samedi 10 h</button>`:""}</span></div>
    <div class="apprlist">${state.family.map((n,i)=>{const a=approvalOf(n);
      const st=!a?"wait":a.ancienne?"old":"ok";
      return `<div class="apprrow ${st}"><span class="adot" aria-hidden="true">${st==="ok"?"✓":st==="old"?"!":"…"}</span><span class="aname"><b>${esc(n)}</b><small>${st==="ok"?"a validé "+ago(a.quand):st==="old"?"a validé une version précédente "+ago(a.quand):(past?"n'a pas répondu à temps":"n'a pas encore validé")}</small></span>
        <button class="chip ${st==="ok"?"":"on"} edit-ctl" data-appr="${i}">${st==="ok"?"Retirer":"Valider pour "+esc(n)}</button></div>`}).join("")}</div>
  </div>`;
}
function shareMessage(){
  return `Bonjour la famille ! Voici les menus du soir proposés pour la semaine du ${weekLabel()} :\n`+
    state.week.map((id,d)=>isOut(d)?`- ${JOURS[d]} : repas à l'extérieur`:`- ${JOURS[d]} : ${BYID[id].nom}${state.cooks[d]?" (cuisine : "+state.cooks[d]+")":""}`).join("\n")+
    `${limiteTxt()?`\n\nMerci de valider le menu (ou de proposer des changements) avant ${limiteTxt()}.`:""}\n\nVous pouvez changer un plat, choisir qui cuisine et cocher les courses directement dans l'application :\n${window.INVITE_URL||APP_URL}`;
}
const APP_URL="https://man2106.github.io/menus-semaine/";
function setLimite(v){ if(DB&&!IS_OWNER){ toast("Seul le propriétaire fixe la date limite"); return; }
  state.limite=v||null;
  if(DB){ LIMITES={...LIMITES}; if(v) LIMITES[curIso()]=v; else delete LIMITES[curIso()]; DB.doc("validations/menus").set({semaines:VALID,limites:LIMITES}).catch(()=>toast("La date limite n'a pas pu être enregistrée")); }
  saveLocal(); render(); toast(v?"Réponse attendue avant "+limiteTxt():"Date limite : le samedi à 10 h, avant la première course"); }
$("weekbar").addEventListener("change",e=>{ if(e.target.id==="limite"){ const v=e.target.value; if(v) setLimite(v); } });
$("weekbar").addEventListener("click",e=>{
  const w=e.target.closest("[data-week]"); if(w&&!w.disabled){ goWeek(+w.dataset.week); toast(relWeek()+" : semaine du "+weekLabel()); return; }
  if(e.target.id==="share"){ shareOpen=!shareOpen; const b=$("sharebox"); b.hidden=!shareOpen; if(shareOpen){ $("sharemsg").value=shareMessage(); } return; }
  const ap=e.target.closest("[data-appr]");
  if(ap){ const n=state.family[+ap.dataset.appr]; if(!n) return; const a=approvalOf(n), all={...state.approbations};
    if(a&&!a.ancienne) delete all[n]; else all[n]={quand:new Date().toISOString(),menu:menuKey(),par:ME};
    state.approbations=all; save(); render(); toast(all[n]?`${n} a validé le menu`:`Validation de ${n} retirée`); return; }
  if(e.target.id==="nolimite"){ setLimite(null); return; }
  if(e.target.id==="exportmenu"){ openSheet({type:"export",kind:"menu",withRecipes:false}); return; }
  if(e.target.id==="copymails2"){ $("copymails").click(); return; }
  if(e.target.id==="copyinvite"){ try{ navigator.clipboard.writeText(window.INVITE_URL).then(()=>toast("Lien d'invitation copié"),()=>toast(window.INVITE_URL)); }catch(err){ toast(window.INVITE_URL); } return; }
  if(e.target.id==="copymsg"){ const txt=shareMessage(), box=$("sharemsg"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Message copié"),()=>{box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){box.focus();box.select();} return; }
  if(e.target.id==="valider"){ if(DB&&!IS_OWNER){ toast("Seul le propriétaire valide le menu"); return; }
    if(state.statut!=="valide"){ const m=manques(); if(m.length){ toast(`Validation impossible : ${manquesTexte(m)}.`); const b=$("acompleter"); if(b){ b.scrollIntoView({behavior:"smooth",block:"center"}); b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); } return; } }
    state.statut=state.statut==="valide"?"proposition":"valide";
    if(DB){ VALID={...VALID,[curIso()]:state.statut}; DB.doc("validations/menus").set({semaines:VALID,limites:LIMITES}).catch(()=>toast("La validation n'a pas pu être enregistrée"));
      state.journal=[{par:ME,quand:new Date().toISOString(),texte:state.statut==="valide"?"a validé le menu":"a rouvert le menu aux modifications"},...state.journal].slice(0,15); if(shareReady) queueWrite(); }
    saveLocal(); render(); toast(state.statut==="valide"?"Menu validé":"Menu rouvert"); return; }
  if(e.target.id==="propose"){ const prev=[...state.week]; state.week=proposeMenu(); state.statut="proposition"; save(); render();
    toast("Nouvelle proposition",()=>{state.week=prev; save(); render(); toast("Proposition précédente rétablie");}); return; }
});
// ---- Calendrier de présence ----
function gcalLink(d){
  const day=dayOffset(d), r=BYID[state.week[d]], ymd=isoOf(day).replace(/-/g,"");
  const pres=state.family.filter(n=>!(state.absents[n]||[]).includes(d));
  const det=[`${headcount(d)} à table`, state.cooks[d]?`Cuisine : ${state.cooks[d]}`:"", pres.length?`Présents : ${pres.join(", ")}`:"", state.invites[d]?`Invités : ${state.invites[d]}`:"", "Recette et courses : "+APP_URL].filter(Boolean).join("\n");
  const q=new URLSearchParams({action:"TEMPLATE",text:`Dîner : ${r.nom}`,dates:`${ymd}T190000/${ymd}T200000`,ctz:"Europe/Brussels",details:det});
  return "https://calendar.google.com/calendar/render?"+q.toString();
}
function planningText(){
  return `Présences aux repas du soir, semaine du ${weekLabel()} :\n`+JOURS.map((j,d)=>{
    const abs=state.family.filter(n=>(state.absents[n]||[]).includes(d));
    return `- ${j} ${fmtShort(dayOffset(d))} : ${headcount(d)} à table (${BYID[state.week[d]].nom})${abs.length?" · absents : "+abs.join(", "):""}${state.invites[d]?" · invités : "+state.invites[d]:""}${state.cooks[d]?" · cuisine : "+state.cooks[d]:""}`;}).join("\n")+
    `\n\nIndiquez vos absences dans l'application :\n${APP_URL}`;
}
function renderPresences(){
  const box=$("presences");
  if(!state.family.length){
    box.innerHTML=`<h2>Qui sera à table ?</h2><p>Ajoutez les membres de la famille pour que chacun indique ses présences. Les quantités s'adapteront à chaque repas.</p>
      <div class="links"><button class="chip" data-goto="famille" data-el="members">Ajouter la famille</button></div>`; return; }
  const head=JOURS.map((j,d)=>`<th scope="col"${dayOffset(d).getTime()===TODAY.getTime()?' class="today"':""}>${j.slice(0,2)}<small>${dayOffset(d).getDate()}</small></th>`).join("");
  const rows=state.family.map((n,i)=>`<tr><th scope="row">${esc(n)}</th>${JOURS.map((j,d)=>{const here=!(state.absents[n]||[]).includes(d);
      return `<td><button class="pres ${here?"in":"out"} edit-ctl" data-pres="${i}|${d}" aria-pressed="${here}" aria-label="${esc(n)} ${j} : ${here?"présent":"absent"}">${here?"✓":"–"}</button></td>`}).join("")}</tr>`).join("");
  const inv=`<tr class="inv"><th scope="row">Invités</th>${JOURS.map((j,d)=>`<td><select class="edit-ctl" data-inv="${d}" aria-label="Invités ${j}">${Array.from({length:11},(_,k)=>`<option value="${k}"${(state.invites[d]||0)===k?" selected":""}>${k?"+"+k:"0"}</option>`).join("")}</select></td>`).join("")}</tr>`;
  const tot=`<tr class="tot"><th scope="row">À table</th>${JOURS.map((j,d)=>`<td>${isOut(d)?'<small class="outsmall">Dehors</small>':`<b>${headcount(d)}</b>`}</td>`).join("")}</tr>`;
  box.innerHTML=`<h2>Qui sera à table ?</h2>
    <p>Touchez une case pour indiquer une absence. Chacun peut remplir la sienne : les quantités, les courses et le budget s'adaptent à chaque repas.</p>
    <div class="prwrap"><table class="prtable"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}${inv}</tbody><tfoot>${tot}</tfoot></table></div>
    <p class="note">${totalCouverts()} couverts cette semaine${JOURS.some((_,d)=>!headcount(d))?" · les soirs sans personne n'entrent pas dans les courses":""}.</p>
    <div class="actions">
      <button class="btn primary" id="sharecal" data-tip="Envoie les soirs et les présences à la famille">Partager le calendrier</button>
      <button class="btn edit-ctl" id="allhere">Tout le monde présent</button>
    </div>
    <div class="sharebox" id="calbox"${calOpen?"":" hidden"}>
      <p class="note">Le calendrier se met à jour en direct pour toute la famille invitée sur l'application. Vous pouvez aussi envoyer le planning ou ajouter les dîners à un agenda.</p>
      <textarea class="copybox" id="calmsg" readonly aria-label="Planning des présences">${esc(planningText())}</textarea>
      <div class="actions"><button class="btn primary" id="copycal">Copier le planning</button></div>
      <div class="gcal"><span class="note">Ajouter à Google Agenda :</span>${JOURS.map((j,d)=>`<a class="chip" href="${gcalLink(d)}" target="_blank" rel="noopener">${j.slice(0,3)} ${dayOffset(d).getDate()}</a>`).join("")}</div>
    </div>`;
}
let calOpen=false;
$("presences").addEventListener("click",e=>{
  const b=e.target.closest("[data-pres]");
  if(b){ const [i,d]=b.dataset.pres.split("|").map(Number), n=state.family[i]; if(!n) return;
    const a=new Set(state.absents[n]||[]); a.has(d)?a.delete(d):a.add(d);
    state.absents={...state.absents,[n]:[...a].sort()}; if(!state.absents[n].length){ const c={...state.absents}; delete c[n]; state.absents=c; }
    save(); render(); return; }
  if(e.target.id==="allhere"){ const prevA=state.absents, prevI=[...state.invites]; state.absents={}; state.invites=[0,0,0,0,0,0,0]; save(); render();
    toast("Tout le monde est présent",()=>{state.absents=prevA; state.invites=prevI; save(); render();}); return; }
  if(e.target.id==="sharecal"){ calOpen=!calOpen; $("calbox").hidden=!calOpen; if(calOpen) $("calmsg").value=planningText(); return; }
  if(e.target.id==="copycal"){ const txt=planningText(), box=$("calmsg"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Planning copié"),()=>{box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){box.focus();box.select();} }
});
$("presences").addEventListener("change",e=>{const s=e.target.closest("select[data-inv]"); if(!s) return;
  const inv=[...state.invites]; inv[+s.dataset.inv]=+s.value; state.invites=inv; save(); render();});
// ======================= Goûts, avis, recettes de famille =======================
function getSteps(id){ return (BYID[id]&&BYID[id].perso) ? (ETAPES_PERSO[id]||[]) : (ETAPES[id]||[]); }
function presentAt(d){ return d===null||d===undefined ? state.family : state.family.filter(n=>!(state.absents[n]||[]).includes(d)); }
function dislikesFor(r,d){ return presentAt(d).filter(n=>(state.avis[r.id]||{})[n]===-1 || (state.exclus[n]||[]).some(x=>r.ing.some(([ing])=>ing===x))); }
function likeScore(r){ return state.family.filter(n=>(state.avis[r.id]||{})[n]===1).length; }
function avisSummary(r){ const a=state.avis[r.id]||{}; const up=state.family.filter(n=>a[n]===1).length, dn=state.family.filter(n=>a[n]===-1).length;
  return up||dn ? `${up} aime${up>1?"nt":""} · ${dn} pas pour ${dn>1?"eux":"lui"}` : "pas encore d'avis"; }
const ALL_ING = () => [...new Set(RECETTES.flatMap(r=>r.ing.map(([n])=>n)))].sort((a,b)=>a.localeCompare(b,"fr"));
let delArm=null;

// --- partage des goûts ---
let unsubGouts=null, lastGouts=null, goutsWriting=false, goutsDirty=false;
const goutsPayload=()=>({avis:state.avis,exclus:state.exclus,exterieurHabituel:state.outDefault,repartition:state.mix});
function subscribeGouts(){ if(!DB) return; if(unsubGouts) unsubGouts();
  unsubGouts=DB.doc("famille/gouts").onSnapshot(snap=>{
    if(snap.exists&&!snap.metadata.hasPendingWrites){ const g=snap.data();
      state.avis=(g.avis&&typeof g.avis==="object")?JSON.parse(JSON.stringify(g.avis)):{}; if(cleanDays(g.exterieurHabituel)) state.outDefault=cleanDays(g.exterieurHabituel); if(cleanMix(g.repartition)) state.mix=cleanMix(g.repartition); state.exclus=(g.exclus&&typeof g.exclus==="object")?JSON.parse(JSON.stringify(g.exclus)):{};
      lastGouts=JSON.stringify(goutsPayload()); saveLocal(); render(); if(modalCtx) renderModal(); if(sheetCtx&&sheetCtx.type==="gouts") renderSheet(); }
    else if(!snap.exists&&!snap.metadata.fromCache){ lastGouts=""; goutsSync(); }
  },()=>{}); }
async function goutsSync(){ if(!DB||CAN_WRITE===false||lastGouts===null) return;
  const s=JSON.stringify(goutsPayload()); if(s===lastGouts) return;
  if(goutsWriting){goutsDirty=true;return;} goutsWriting=true; lastGouts=s;
  try{ await DB.doc("famille/gouts").set(goutsPayload()); }catch(e){}
  goutsWriting=false; if(goutsDirty){goutsDirty=false; goutsSync();} }

// --- partage des recettes de famille ---
let unsubRec=null, pendingWeek=null;
function subscribeRecettes(){ if(!DB) return; if(unsubRec) unsubRec();
  unsubRec=DB.collection("recettes").onSnapshot(q=>{
    let changed=false;
    q.docChanges().forEach(ch=>{ const x={...ch.doc.data(),id:ch.doc.id};
      if(ch.type==="removed"){ state.perso=state.perso.filter(p=>p.id!==x.id);
        if(!state.week.includes(x.id)){ const i=RECETTES.findIndex(r=>r.id===x.id); if(i>=0) RECETTES.splice(i,1); delete BYID[x.id]; } changed=true; }
      else { const r=registerRecipe(x); if(r){ state.perso=[...state.perso.filter(p=>p.id!==r.id),r]; changed=true; } } });
    if(changed){ saveLocal();
      if(pendingWeek&&pendingWeek.iso===curIso()&&pendingWeek.d.menu.every(id=>BYID[id])){ const d=pendingWeek.d; pendingWeek=null;
        applyWeekData({menu:d.menu,cooks:d.cuisiniers,checked:d.coches,statut:d.statut,journal:d.journal,absents:d.absents,invites:d.invites,approbations:d.approbations,exterieur:d.exterieur,extras:d.ajouts,quantites:d.quantites,tickets:d.tickets}); lastShared=JSON.stringify(sharedPayload()); }
      render(); if(modalCtx&&BYID[modalCtx.id]) renderModal(); }
  },()=>{}); }
async function saveRecipeShared(r){ if(!DB||CAN_WRITE===false) return; try{ await DB.collection("recettes").doc(r.id).set({...r}); }catch(e){ toast("La recette est gardée sur cet appareil, le partage a échoué"); } }
async function deleteRecipeShared(id){ if(!DB||CAN_WRITE===false) return; try{ await DB.collection("recettes").doc(id).delete(); }catch(e){} }

// ======================= Fenêtres plein écran =======================
let sheetCtx=null, wakeLock=null;
function openSheet(ctx){ sheetCtx=ctx; $("sheet").hidden=false; document.body.style.overflow="hidden"; renderSheet(); $("sbody").scrollTop=0; if(ctx.wake) keepAwake(true); try{$("sclose").focus();}catch(e){} }
function closeSheet(){ const c=sheetCtx; if(c&&c.type==="wizard"&&!state.onboarded){ state.onboarded=true; saveLocal(); }
  sheetCtx=null; $("sheet").hidden=true; if(!modalCtx) document.body.style.overflow=""; keepAwake(false); if(c&&c.after) c.after(); }
function renderSheet(){ const c=sheetCtx; if(!c) return; $("sheet").dataset.type=c.type;
  ({gallery:renderGallery,shop:renderShop,cook:renderCook,wizard:renderWizard,recipe:renderRecipeForm,gouts:renderGouts,export:renderExport,retour:renderRetourSheet,bilan:renderBilan})[c.type](); }
async function keepAwake(on){ try{ if(on&&navigator.wakeLock&&!wakeLock){ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener&&wakeLock.addEventListener("release",()=>{wakeLock=null;}); }
  else if(!on&&wakeLock){ const w=wakeLock; wakeLock=null; await w.release(); } }catch(e){ wakeLock=null; } }
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&sheetCtx&&sheetCtx.wake&&!wakeLock) keepAwake(true); });
$("sclose").onclick=closeSheet;
window.addEventListener("keydown",e=>{ if(e.key==="Escape"&&sheetCtx){ e.stopPropagation(); closeSheet(); } },true);

// --- Galerie de plats ---
function renderGallery(){ const c=sheetCtx, d=c.d;
  $("seyebrow").textContent=d===null?"Recettes":`${JOURS[d]} ${fmtShort(dayOffset(d))}`; $("stitle").textContent="Choisir le plat"; $("sextra").innerHTML="";
  const F=[["tous","Tous"],["eco","Économiques"],["moyen","Budget moyen"],["plaisir","Plaisir"],["rapides","20 min max"],["promo","En promo"],["aimes","Aimés"],["vege","Sans viande"],["famille","De la famille"]];
  $("sbody").innerHTML=`<input class="gsearch" id="gq" type="search" placeholder="Rechercher un plat" value="${esc(c.q||"")}" aria-label="Rechercher un plat" autocomplete="off">
    <div class="gfilters">${F.map(([k,l])=>`<button class="chip${(c.filter||"tous")===k?" on":""}" data-gf="${k}">${l}</button>`).join("")}</div>
    <div class="gfilters"><button class="chip${!c.cuis?" on":""}" data-gc="tous">Toutes les cuisines</button>${Object.entries(CUISINES).map(([k,l])=>`<button class="chip${c.cuis===k?" on":""}" data-gc="${k}">${l}</button>`).join("")}</div><div class="ggrid" id="ggrid"></div>`;
  $("sfoot").innerHTML=`<button class="btn edit-only" data-newrec="1">Ajouter une recette de famille</button>`;
  renderGalleryGrid(); }
function renderGalleryGrid(){ const c=sheetCtx, d=c.d, q=(c.q||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""), f=c.filter||"tous";
  let list=RECETTES.filter(r=>!q||r.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes(q));
  if(c.cuis) list=list.filter(r=>r.c===c.cuis); if(["eco","moyen","plaisir"].includes(f)) list=list.filter(r=>budgetOf(r)===f); if(f==="vege") list=list.filter(r=>r.p==="vege"||r.p==="oeufs"); if(f==="rapides") list=list.filter(r=>r.t<=20); if(f==="promo") list=list.filter(r=>promoCount(r)); if(f==="aimes") list=list.filter(r=>likeScore(r)>0); if(f==="famille") list=list.filter(r=>r.perso);
  list.sort((a,b)=>(dislikesFor(a,d).length-dislikesFor(b,d).length)||(likeScore(b)-likeScore(a))||(promoCount(b)-promoCount(a))||a.t-b.t);
  $("ggrid").innerHTML=list.length?list.map(r=>{const w=dislikesFor(r,d), cur=d!==null&&state.week[d]===r.id, other=state.week.map((id,i)=>id===r.id&&i!==d?JOURS[i].slice(0,3):null).filter(Boolean);
    return `<button class="gcard${cur?" cur":""}" data-pickrec="${r.id}"><img src="${photoSrc(r.id)}" alt="" loading="lazy"><span class="gname">${esc(r.nom)}</span>
      <span class="gmeta"><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${r.t} min${r.c?" · "+CUISINES[r.c]:""}${promoCount(r)?' · <span class="promo">promo</span>':""}${likeScore(r)?` · aimé par ${likeScore(r)}`:""}</span>
      ${cur?'<span class="gtag">Plat actuel</span>':other.length?`<span class="gtag soft">Déjà ${other.join(", ")}</span>`:""}
      ${w.length?`<span class="gwarn">${esc(w.join(", "))} n'aime${w.length>1?"nt":""} pas</span>`:""}</button>`}).join("")
    : `<p class="note">Aucun plat ne correspond. Essayez un autre filtre.</p>`; }
$("sbody").addEventListener("input",e=>{ if(e.target.id==="gq"&&sheetCtx&&sheetCtx.type==="gallery"){ sheetCtx.q=e.target.value; renderGalleryGrid(); } });

// --- Mode magasin ---
function renderShop(){ const c=sheetCtx, t=c.t, items=coursesTrips()[t], plan=planTrip(t,items), stores=[plan.primary,plan.secondary].filter(Boolean);
  if(c.stop>=stores.length) c.stop=0; const mag=stores[c.stop];
  const sitems=items.filter(i=>plan.assign[i.k]===mag).sort((a,b)=>ORDRE.indexOf(a.ray)-ORDRE.indexOf(b.ray)||a.n.localeCompare(b.n,"fr"));
  const done=sitems.filter(i=>state.checked[i.ck]).length;
  $("seyebrow").textContent=`Courses de la semaine · ${fmtD(tripDate(t))}`; $("stitle").textContent=MAGNOM[mag];
  $("sextra").innerHTML=`<span class="scount">${done}/${sitems.length}</span>`;
  $("sbody").innerHTML=(stores.length>1?`<div class="gfilters">${stores.map((m,i)=>`<button class="chip${i===c.stop?" on":""}" data-stop="${i}">Arrêt ${i+1} · ${MAGNOM[m]}</button>`).join("")}</div>`:"")+
    (sitems.length?ORDRE.map(ray=>{const its=sitems.filter(i=>i.ray===ray); if(!its.length) return "";
      return `<h3 class="shopray">${RAYONS[ray]}</h3>`+its.map(i=>{const ck=!!state.checked[i.ck], pr=promosFor(i.n).find(p=>p.mag===ensOf(mag)&&validOn(p,tripDate(t)));
        return `<button class="shopitem${ck?" done":""}" data-shopk="${esc(i.ck)}" aria-pressed="${ck}"><span class="sbox" aria-hidden="true">${ck?"✓":""}</span><span class="sname">${esc(i.n)}${pr?`<small>Promo ${eur(pr.prix)}</small>`:""}</span><span class="sqty">${esc(qtyOf(i))}</span></button>`}).join("")}).join("")
     :`<p class="note">Rien à acheter ici.</p>`)+
    (done===sitems.length&&sitems.length?`<div class="shopdone">Tout est dans le caddie.</div>`:"");
  $("sfoot").innerHTML=`<div class="track big"><i style="width:${sitems.length?done/sitems.length*100:0}%"></i></div><button class="btn primary" data-shopend="1">${done===sitems.length?"Terminer":"Fermer"}</button>`; }

// --- Mode cuisine ---
let TIMERS=[], timerTick=null, audioCtx=null;
function parseMinutes(txt){ const out=[]; const re=/(\d+)\s*(?:à|-)?\s*(\d+)?\s*minutes?/gi; let m; while((m=re.exec(txt))) out.push(+(m[2]||m[1])); return out.filter(n=>n>0&&n<=240); }
function renderCook(){ const c=sheetCtx, r=BYID[c.id], steps=getSteps(c.id), n=steps.length||1, i=Math.min(c.step,n-1);
  $("seyebrow").textContent=steps.length?`Étape ${i+1} sur ${n}`:"Préparation"; $("stitle").textContent=r.nom;
  $("sextra").innerHTML="";
  const txt=steps[i]||"Pas d'étapes enregistrées pour cette recette.", mins=parseMinutes(txt);
  $("sbody").innerHTML=`<div class="cprog">${steps.map((_,k)=>`<i class="${k<i?"past":k===i?"now":""}"></i>`).join("")}</div>
    <p class="cstep">${esc(txt)}</p>
    ${mins.length?`<div class="actions">${[...new Set(mins)].map(m=>`<button class="btn primary big" data-timer="${m}">Minuteur ${m} min</button>`).join("")}</div>`:""}
    <div id="timers" class="timers"></div>
    <details class="cing"><summary>Ingrédients pour ${headcount(c.d)} personne${headcount(c.d)>1?"s":""}</summary><ul class="ing">${r.ing.map(([nn,q,u])=>`<li><span>${esc(nn)}</span><span>${fmt(scale(q,c.d),u)}</span></li>`).join("")}</ul></details>`;
  $("sfoot").innerHTML=`<button class="btn big" data-cstep="-1"${i===0?" disabled":""}>Précédent</button>${i<n-1?`<button class="btn primary big" data-cstep="1">Suivant</button>`:`<button class="btn primary big" data-cookend="1">Terminé, bon appétit !</button>`}`;
  renderTimers(); }
function renderTimers(){ const box=$("timers"); if(!box) return; const now=Date.now();
  box.innerHTML=TIMERS.map((t,k)=>{const left=Math.max(0,Math.round((t.end-now)/1000)), mm=Math.floor(left/60), ss=String(left%60).padStart(2,"0");
    return `<div class="timer${left===0?" ring":""}"><span>${esc(t.label)}</span><b>${mm}:${ss}</b><button class="chip" data-tstop="${k}">${left===0?"OK":"Arrêter"}</button></div>`}).join(""); }
function startTimer(min,label){ try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  TIMERS.push({end:Date.now()+min*60000,label,rang:false}); if(!timerTick) timerTick=setInterval(tickTimers,1000); renderTimers(); toast(`Minuteur de ${min} min lancé`); }
function beep(){ try{ if(!audioCtx) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=880; o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.3,audioCtx.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.9); o.start(); o.stop(audioCtx.currentTime+1); }catch(e){} }
function tickTimers(){ const now=Date.now(); TIMERS.forEach(t=>{ if(!t.rang&&now>=t.end){ t.rang=true; beep(); setTimeout(beep,1100); try{navigator.vibrate&&navigator.vibrate([300,150,300]);}catch(e){} toast("Minuteur terminé : "+t.label); } });
  if(!TIMERS.length){ clearInterval(timerTick); timerTick=null; } renderTimers(); }

// --- Guide de démarrage ---
function renderWizard(){ const c=sheetCtx, st=c.step;
  $("seyebrow").textContent=`Étape ${st+1} sur 3`; $("sextra").innerHTML="";
  if(st===0){ $("stitle").textContent="Qui mange à la maison ?";
    $("sbody").innerHTML=`<p class="wlead">Ajoutez chaque membre de la famille. L'adresse e-mail (facultative) sert à lui envoyer les menus et la liste des courses.</p>
      <div class="mlist">${state.family.map((n,i)=>`<div class="wmember"><b>${esc(n)}</b><span>${esc(state.emails[n]||"")}</span><button class="mdel" data-wdel="${i}" aria-label="Retirer ${esc(n)}">×</button></div>`).join("")||`<p class="note">Personne pour l'instant.</p>`}</div>
      <form class="addrow addmember owner-only" id="wform"><input id="wname" type="text" placeholder="Prénom" maxlength="20" autocomplete="off" aria-label="Prénom"><input id="wmail" type="email" inputmode="email" placeholder="E-mail (facultatif)" maxlength="120" autocomplete="off" aria-label="Adresse e-mail"><button class="btn primary" type="submit">Ajouter</button></form>`; }
  if(st===1){ $("stitle").textContent="Quand faites-vous les courses ?";
    $("sbody").innerHTML=`<p class="wlead">Deux passages par semaine gardent les produits frais. L'épicerie et les surgelés sont achetés à la première course.</p>
      <label class="wfield">Première course<select id="wt1" class="pick"><option value="sam"${state.trip1==="sam"?" selected":""}>Samedi, avant la semaine</option><option value="lun"${state.trip1==="lun"?" selected":""}>Lundi</option></select></label>`; }
  if(st===2){ $("stitle").textContent="Vos magasins";
    const near=MAGASINS.slice().sort((a,b)=>km(HOME,a)-km(HOME,b));
    $("sbody").innerHTML=`<p class="wlead">Touchez les magasins où vous allez, dans votre ordre de préférence : le premier touché devient votre magasin habituel.</p>
      <div class="wstores">${near.map(m=>{const r=state.storeOrder.indexOf(m.id);
        return `<button class="wstore${r>=0?" on":""}" data-wpick="${m.id}"><b>${r>=0?`<span class="wrank">${r+1}</span>`:""}${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}</small></button>`}).join("")}</div>
      <label class="wfield">Comment choisir le magasin de chaque course<select id="wmode" class="pick"><option value="auto"${state.storeMode==="auto"?" selected":""}>Le plus avantageux, selon mon ordre</option><option value="fixe"${state.storeMode==="fixe"?" selected":""}>Toujours mon magasin habituel</option></select></label>
      <p class="note">Vous pourrez modifier ce choix et l'ordre dans Réglages.</p>`; }
  $("sfoot").innerHTML=`${st>0?`<button class="btn big" data-wstep="-1">Retour</button>`:`<button class="btn big" data-wskip="1">Plus tard</button>`}<button class="btn primary big" data-wstep="1">${st<2?"Continuer":"C'est parti !"}</button>`; }

// --- Goûts d'un membre ---
function renderGouts(){ const c=sheetCtx, n=state.family[c.i]; if(!n){ closeSheet(); return; }
  $("seyebrow").textContent="Goûts"; $("stitle").textContent=n; $("sextra").innerHTML="";
  const ex=state.exclus[n]||[];
  $("sbody").innerHTML=`<h3 class="shopray">Ingrédients que ${esc(n)} ne mange pas</h3>
    <div class="gfilters wrapchips">${ALL_ING().map(x=>`<button class="chip${ex.includes(x)?" on warn":""} edit-ctl" data-excl="${esc(x)}" aria-pressed="${ex.includes(x)}">${esc(x)}</button>`).join("")}</div>
    <h3 class="shopray">Plats</h3>
    <div class="avislist">${RECETTES.map(r=>{const v=(state.avis[r.id]||{})[n]||0;
      return `<div class="avisrow"><span>${esc(r.nom)}</span><button class="avb up edit-ctl" data-gavis="${r.id}|1" aria-pressed="${v===1}">J'aime</button><button class="avb down edit-ctl" data-gavis="${r.id}|-1" aria-pressed="${v===-1}">Pas pour moi</button></div>`}).join("")}</div>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`; }

// --- Formulaire de recette de famille ---
const UNITS=[["g","grammes"],["cl","centilitres"],["","pièces"]];
function newDraft(){ return {nom:"",acc:"",t:30,pers:5,ing:[["",0,"g","fl"],["",0,"g","fl"],["",0,"g","fl"]],etapes:"",astuce:"",photo:null,prix:""}; }
function renderRecipeForm(){ const c=sheetCtx, dr=c.draft;
  $("seyebrow").textContent=c.editId?"Modifier la recette":"Nouvelle recette de famille"; $("stitle").textContent=dr.nom||"Recette"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`<form id="rform" class="rform">
    <label class="wfield">Nom du plat<input id="rf-nom" type="text" maxlength="60" value="${esc(dr.nom)}" placeholder="Ex. : lasagnes de mamie" required></label>
    <label class="wfield">Accompagnement<input id="rf-acc" type="text" maxlength="60" value="${esc(dr.acc)}" placeholder="Ex. : salade verte"></label>
    <div class="rgrid2"><label class="wfield">Temps (minutes)<input id="rf-t" type="number" inputmode="numeric" min="5" max="240" value="${esc(dr.t)}"></label>
      <label class="wfield">Pour combien de personnes<input id="rf-pers" type="number" inputmode="numeric" min="1" max="20" value="${esc(dr.pers)}"></label></div>
    <div class="wfield"><span>Photo (facultatif)</span><div class="rphoto">${dr.photo?`<img src="${dr.photo}" alt="">`:""}<label class="btn">${dr.photo?"Changer la photo":"Ajouter une photo"}<input id="rf-photo" type="file" accept="image/*" hidden></label>${dr.photo?`<button type="button" class="btn" data-rfnophoto="1">Retirer</button>`:""}</div></div>
    <fieldset class="ringr"><legend>Ingrédients</legend>
      ${dr.ing.map(([n,q,u,ray],k)=>`<div class="ingrow"><input list="inglist" type="text" data-rf="n" data-k="${k}" value="${esc(n)}" placeholder="Ingrédient" aria-label="Ingrédient ${k+1}">
        <input type="number" inputmode="decimal" min="0" step="any" data-rf="q" data-k="${k}" value="${q||""}" placeholder="Qté" aria-label="Quantité">
        <select data-rf="u" data-k="${k}" aria-label="Unité">${UNITS.map(([v,l])=>`<option value="${v}"${u===v?" selected":""}>${l}</option>`).join("")}</select>
        <select data-rf="ray" data-k="${k}" aria-label="Rayon">${RAYKEYS.map(v=>`<option value="${v}"${ray===v?" selected":""}>${RAYONS[v]}</option>`).join("")}</select>
        <button type="button" class="mdel" data-rfdel="${k}" aria-label="Retirer cet ingrédient">×</button></div>`).join("")}
      <datalist id="inglist">${ALL_ING().map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
      <button type="button" class="btn" data-rfadd="1">Ajouter un ingrédient</button></fieldset>
    <label class="wfield">Étapes (une par ligne)<textarea id="rf-etapes" rows="6" placeholder="Faire revenir l'oignon 3 minutes.&#10;Ajouter la viande…">${esc(dr.etapes)}</textarea></label>
    <label class="wfield">Astuce (facultatif)<input id="rf-astuce" type="text" maxlength="200" value="${esc(dr.astuce)}"></label>
    <label class="wfield">Coût estimé du plat en euros (facultatif, pour les ingrédients inconnus de l'application)<input id="rf-prix" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(dr.prix)}"></label>
  </form>`;
  $("sfoot").innerHTML=`<button class="btn big" data-sclose="1">Annuler</button><button class="btn primary big" data-rfsave="1">Enregistrer</button>`; }
function readRecipeForm(){ const dr=sheetCtx.draft, v=id=>{const e=$(id); return e?e.value:"";};
  dr.nom=v("rf-nom").trim(); dr.acc=v("rf-acc").trim(); dr.t=+v("rf-t")||30; dr.pers=+v("rf-pers")||5; dr.etapes=v("rf-etapes"); dr.astuce=v("rf-astuce").trim(); dr.prix=v("rf-prix");
  document.querySelectorAll("#rform [data-rf]").forEach(el=>{ const k=+el.dataset.k, f=el.dataset.rf; if(!dr.ing[k]) return;
    if(f==="n") dr.ing[k][0]=el.value; if(f==="q") dr.ing[k][1]=+el.value||0; if(f==="u") dr.ing[k][2]=el.value; if(f==="ray") dr.ing[k][3]=el.value; }); }
function resizePhoto(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{
  const W=480,H=360, cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
  const sc=Math.max(W/img.width,H/img.height), w=img.width*sc, h=img.height*sc; g.drawImage(img,(W-w)/2,(H-h)/2,w,h);
  res(cv.toDataURL("image/jpeg",0.72)); }; img.onerror=rej; img.src=fr.result; }; fr.onerror=rej; fr.readAsDataURL(file); }); }
function saveRecipe(){ readRecipeForm(); const c=sheetCtx, dr=c.draft;
  if(!dr.nom){ toast("Donnez un nom au plat"); $("rf-nom").focus(); return; }
  const k=5/Math.max(1,dr.pers);
  const ing=dr.ing.filter(([n])=>n.trim()).map(([n,q,u,ray])=>[n.trim(),Math.round(q*k*100)/100,u,ray]);
  if(!ing.length){ toast("Ajoutez au moins un ingrédient"); return; }
  const raw={id:c.editId||("p"+Date.now().toString(36)),nom:dr.nom,acc:dr.acc,t:dr.t,ing,etapes:dr.etapes.split(/\n+/).map(x=>x.trim()).filter(Boolean),astuce:dr.astuce,photo:dr.photo,prix:dr.prix?Math.round(+dr.prix*k*100)/100:null,auteur:ME};
  const r=registerRecipe(raw); if(!r){ toast("Recette invalide"); return; }
  state.perso=[...state.perso.filter(p=>p.id!==r.id),r]; saveLocal(); saveRecipeShared(r);
  const d=c.forDay; sheetCtx.after=null; closeSheet();
  if(d!==undefined&&d!==null) replaceDay(d,r.id); else { render(); if(modalCtx&&modalCtx.id===r.id) renderModal(); }
  toast(c.editId?"Recette mise à jour":"Recette ajoutée"); }

// --- Clics dans les fenêtres plein écran ---
$("sheet").addEventListener("click",async e=>{ const c=sheetCtx; if(!c) return; const T=e.target.closest("button,a,[data-gf]")||e.target; const D=T.dataset||{};
  if(D.sclose){ closeSheet(); return; }
  if(c.type==="export"){ handleExportClick(D,T); return; }
  if(c.type==="gallery"){ if(D.gf){ c.filter=D.gf; renderGallery(); return; } if(D.gc){ c.cuis=D.gc==="tous"?null:D.gc; renderGallery(); return; }
    if(D.pickrec){ const d=c.d; closeSheet(); if(d===null){ openMeal(D.pickrec,null); return; } if(state.week[d]!==D.pickrec) replaceDay(d,D.pickrec); if(modalCtx&&modalCtx.d===d){ modalCtx.id=state.week[d]; renderModal(); } return; }
    if(D.newrec){ const d=c.d; closeSheet(); openSheet({type:"recipe",draft:newDraft(),forDay:d}); return; } }
  if(c.type==="shop"){ if(D.stop){ c.stop=+D.stop; renderShop(); return; }
    if(D.shopk){ const k=D.shopk; if(state.checked[k]) delete state.checked[k]; else state.checked[k]=true; save(); renderCourses(); renderShop(); try{navigator.vibrate&&navigator.vibrate(15);}catch(err){} return; }
    if(D.shopend){ closeSheet(); return; } }
  if(c.type==="cook"){ if(D.cstep){ c.step=Math.max(0,c.step+(+D.cstep)); renderCook(); $("sbody").scrollTop=0; return; }
    if(D.timer){ startTimer(+D.timer,BYID[c.id].nom+" · étape "+(c.step+1)); return; }
    if(D.tstop){ TIMERS.splice(+D.tstop,1); renderTimers(); return; }
    if(D.cookend){ const {id,d}=c; closeSheet(); openMeal(id,d); setTimeout(()=>{const a=$("avis"); if(a){a.scrollIntoView({behavior:"smooth"}); a.classList.add("flash");}},250); toast("Bon appétit ! Donnez votre avis sur ce plat."); return; } }
  if(c.type==="wizard"){
    if(D.wdel){ const n=state.family[+D.wdel]; state.family.splice(+D.wdel,1); if(state.emails[n]){const em={...state.emails}; delete em[n]; state.emails=em;} syncPersons(); save(); render(); renderWizard(); return; }
    if(D.wpick){ const id=D.wpick; if(c.fresh!==true){ c.fresh=true; state.storeOrder=[]; }
      if(state.storeOrder.includes(id)){ if(state.storeOrder.length>1) state.storeOrder=state.storeOrder.filter(x=>x!==id); } else state.storeOrder=[...state.storeOrder,id];
      if(!state.storeOrder.length) state.storeOrder=[id]; save(); render(); renderWizard(); return; }
    if(D.wstore!==undefined){ if(D.wstore){ state.storeMode="fixe"; state.storeOrder=[D.wstore,...state.storeOrder.filter(x=>x!==D.wstore)]; state.storeOff=state.storeOff.filter(x=>x!==D.wstore); } else state.storeMode="auto"; save(); render(); renderWizard(); return; }
    if(D.wskip){ closeSheet(); return; }
    if(D.wstep){ if(c.step===1){ state.trip1=$("wt1").value; save(); }
      if(c.step===2&&$("wmode")){ state.storeMode=$("wmode").value; save(); }
      if(c.step===0&&!state.family.length&&+D.wstep>0){ toast("Ajoutez au moins une personne, ou touchez « Plus tard »"); return; }
      const nx=c.step+(+D.wstep); if(nx>2){ state.onboarded=true; save(); closeSheet(); render(); toast("C'est prêt ! Bon appétit cette semaine."); return; }
      c.step=Math.max(0,nx); renderWizard(); return; } }
  if(c.type==="gouts"){
    if(D.excl){ const n=state.family[c.i], x=D.excl, cur=new Set(state.exclus[n]||[]); cur.has(x)?cur.delete(x):cur.add(x);
      const ex={...state.exclus}; if(cur.size) ex[n]=[...cur]; else delete ex[n]; state.exclus=ex; save(); render(); renderGouts(); return; }
    if(D.gavis){ const [rid,v]=D.gavis.split("|"); setAvis(rid,state.family[c.i],+v); renderGouts(); return; } }
  if(c.type==="recipe"){
    if(D.rfadd){ readRecipeForm(); c.draft.ing.push(["",0,"g","fl"]); renderRecipeForm(); return; }
    if(D.rfdel){ readRecipeForm(); c.draft.ing.splice(+D.rfdel,1); if(!c.draft.ing.length) c.draft.ing.push(["",0,"g","fl"]); renderRecipeForm(); return; }
    if(D.rfnophoto){ readRecipeForm(); c.draft.photo=null; renderRecipeForm(); return; }
    if(D.rfsave){ saveRecipe(); return; } }
});
$("sheet").addEventListener("submit",e=>{ if(e.target.id==="wform"){ e.preventDefault(); const n=$("wname").value.trim(), m=$("wmail").value.trim();
    if(!n) return; if(state.family.some(x=>x.toLowerCase()===n.toLowerCase())){ toast(n+" est déjà dans la famille"); return; }
    if(m&&!validMail(m)){ toast("Adresse e-mail invalide : vérifiez-la"); return; }
    state.family.push(n); if(m) state.emails={...state.emails,[n]:m}; syncPersons(); save(); render(); renderWizard(); setTimeout(()=>{try{$("wname").focus();}catch(err){}},0); }
  if(e.target.id==="rform"){ e.preventDefault(); } });
$("sheet").addEventListener("change",async e=>{ if(e.target.id==="rf-photo"&&e.target.files&&e.target.files[0]){ readRecipeForm();
    try{ sheetCtx.draft.photo=await resizePhoto(e.target.files[0]); renderRecipeForm(); }catch(err){ toast("Impossible de lire cette photo"); } } });
$("sheet").addEventListener("input",e=>{ if(e.target.id==="rf-nom") $("stitle").textContent=e.target.value||"Recette"; });

// --- Avis ---
function setAvis(rid,n,v){ if(!n) return; const a={...(state.avis[rid]||{})}; if(a[n]===v) delete a[n]; else a[n]=v;
  const all={...state.avis}; if(Object.keys(a).length) all[rid]=a; else delete all[rid]; state.avis=all; save(); render(); if(modalCtx) renderModal(); }

// --- Clics dans la fiche repas (avis, galerie, mode cuisine, recette perso) ---
$("mbody").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b||!modalCtx) return; const D=b.dataset;
  if(D.avis){ const [i,v]=D.avis.split("|").map(Number); setAvis(modalCtx.id,state.family[i],v); return; }
  if(D.outtoggle){ toggleOut(+D.outtoggle); return; }
  if(D.gallery){ openSheet({type:"gallery",d:+D.gallery}); return; }
  if(D.swap){ const d=+D.swap, prev=state.week[d];
    const pool=RECETTES.filter(r=>!state.week.includes(r.id)&&!dislikesFor(r,d).length); const alt=(pool.length?pool:RECETTES.filter(r=>r.id!==prev));
    const pick=alt[Math.floor(Math.random()*alt.length)].id; replaceDay(d,pick); modalCtx.id=state.week[d]; renderModal(); return; }
  if(D.cookmode){ const {id,d}=modalCtx; openSheet({type:"cook",id,d,step:0,wake:true}); return; }
  if(D.editrec){ const r=BYID[D.editrec]; openSheet({type:"recipe",editId:r.id,draft:{nom:r.nom,acc:r.acc,t:r.t,pers:5,ing:r.ing.map(x=>[...x]),etapes:(r.etapes||[]).join("\n"),astuce:r.astuce||"",photo:r.photo,prix:r.prix||""},
      after:()=>{ if(modalCtx) renderModal(); }}); return; }
  if(D.delrec){ const id=D.delrec; if(state.weeks&&Object.values(state.weeks).some(w=>w.menu&&w.menu.includes(id))||state.week.includes(id)){ toast("Ce plat est au menu : remplacez-le d'abord"); return; }
    if(delArm!==id){ delArm=id; renderModal(); setTimeout(()=>{ if(delArm===id){ delArm=null; if(modalCtx) renderModal(); } },4000); return; }
    delArm=null; state.perso=state.perso.filter(p=>p.id!==id); const i=RECETTES.findIndex(r=>r.id===id); if(i>=0) RECETTES.splice(i,1); delete BYID[id];
    saveLocal(); deleteRecipeShared(id); closeMeal(); render(); toast("Recette supprimée"); return; }
});

// --- Divers boutons ---
$("tripsel").addEventListener("click",e=>{ const v=e.target.closest("[data-tripvue]"); if(v){ tripVue=+v.dataset.tripvue; renderCourses(); if(typeof renderApSugg==="function") renderApSugg(); return; } });
$("aisles").addEventListener("click",e=>{ const b=e.target.closest("[data-shop]"); if(b) openSheet({type:"shop",t:+b.dataset.shop,stop:0,wake:true}); });
$("members").addEventListener("click",e=>{ const b=e.target.closest("[data-gouts]"); if(b) openSheet({type:"gouts",i:+b.dataset.gouts}); });
let ensFilter="";
function renderStoreOrder(){
  $("storemode").value=state.storeMode;
  const custom=state.home&&!COMMUNES.some(([n])=>n===state.home.nom);
  if(state.home&&state.home.adresse&&!$("addr-cp").value){ $("addr-rue").value=state.home.adresse.rue||""; $("addr-cp").value=state.home.adresse.cp||""; }
  $("homesel").innerHTML=(custom?`<option value="__custom" selected>${esc(HOME.nom)}</option>`:"")+COMMUNES.map(([n])=>`<option value="${esc(n)}"${!custom&&HOME.nom===n?" selected":""}>${esc(n)}</option>`).join("");
  renderGkey();
  $("homenote").textContent=`Les distances et les frais de route sont calculés depuis ${HOME.nom}${HOME.precision==="exacte"?" (position exacte)":HOME.precision==="rue"?" (milieu de la rue)":" (centre de la localité : entrez votre rue pour plus de précision)"}. Ce réglage est propre à cet appareil.`;
  const n=state.storeOrder.length;
  $("sorder").innerHTML=state.storeOrder.map((id,i)=>{const m=MAGBYID(id);
    return `<li class="sitem"><span class="srank">${i+1}</span><span class="sinfo"><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}${i===0?" · magasin habituel":""}${m.perso?" · ajouté par vous":""}${inRayon(m)?"":` · <span class="rtwarn">à plus de ${rayonKm()} km : pas utilisé pour les courses</span>`}</small></span>
      <span class="sbtns"><button class="sbtn" data-sup="${i}" ${i===0?"disabled":""} aria-label="Monter ${esc(m.nom)}">↑</button><button class="sbtn" data-sdown="${i}" ${i===n-1?"disabled":""} aria-label="Descendre ${esc(m.nom)}">↓</button>
      <button class="sbtn wide" data-sdel="${id}" ${n<=1?"disabled":""}>Retirer</button></span></li>`}).join("");
  if(!$("as-ens").options.length) $("as-ens").innerHTML=Object.entries(ENS).filter(([k])=>k!=="autre").map(([k,l])=>`<option value="${k}">${l}</option>`).join("")+'<option value="autre">Autre enseigne</option>';
  const ens=[...new Set(MAGASINS.map(m=>m.ens))];
  $("ensfilter").innerHTML=[["","Toutes"],...ens.map(e=>[e,ENS[e]])].map(([k,l])=>`<button class="chip${ensFilter===k?" on":""}" data-ensf="${k}">${l}</button>`).join("");
  $("rayonchips").innerHTML=[10,12,15].map(k=>`<button class="chip${rayonKm()===k?" on":""}" data-rayon="${k}" type="button">${k} km</button>`).join("");
  $("savailtitle").textContent=`Magasins à moins de ${rayonKm()} km, du plus proche au plus loin`;
  const avail=MAGASINS.filter(m=>inRayon(m)&&!state.storeOrder.includes(m.id)&&(!ensFilter||m.ens===ensFilter)).sort((a,b)=>km(HOME,a)-km(HOME,b));
  $("savail").innerHTML=avail.length?avail.map(m=>`<div class="sitem avail"><span class="srank plus" aria-hidden="true">+</span><span class="sinfo"><b>${esc(m.nom)}</b><small>${esc(m.lieu)} · ≈ ${kmTxt(km(HOME,m))}${PROMOS.some(p=>p.mag===m.ens)?" · promos relevées":""}</small></span>
      <span class="sbtns"><button class="sbtn wide add" data-sadd="${m.id}">Ajouter</button></span></div>`).join("") : `<p class="note">Aucun autre magasin${ensFilter?" de cette enseigne":""} à moins de ${rayonKm()} km de votre domicile. Touchez « Trouver les vrais magasins autour de mon adresse » pour compléter la liste.</p>`;
  $("sordernote").textContent = state.storeMode==="fixe" ? `Toutes les courses se font chez ${MAGNOM[state.storeOrder[0]]}, sauf si vous choisissez un autre magasin dans l'onglet Courses.`
    : `Chaque rang de préférence vaut ${eur(PREF_EUR)} : un magasin moins bien classé n'est choisi que si ses promos compensent la différence et le trajet. Seuls vos magasins sont proposés.`;
}
function setHome(h){ HOME=h; state.home={...h}; saveLocal(); render();
  if((h.precision==="exacte"||h.precision==="rue")&&typeof chercherMagasinsOSM==="function"&&!(state.osmAt&&km(state.osmAt,h)<2)){ toast("Position enregistrée. Recherche des magasins autour…"); chercherMagasinsOSM(); return; }
  const far=state.storeOrder.length&&state.storeOrder.every(id=>km(HOME,MAGBYID(id))>8);
  if(far) toast("Vos magasins sont loin de cette adresse.",()=>pickNearest(),"Prendre les plus proches"); else toast("Trajets calculés depuis "+h.nom); }
// Garde le magasin le plus proche de chaque enseigne, jusqu'à 6, triés par distance
function pickNearest(){ const prev=[...state.storeOrder], seen=new Set();
  const list=MAGASINS.filter(inRayon).sort((a,b)=>km(HOME,a)-km(HOME,b)).filter(m=>{ if(seen.has(m.ens)) return false; seen.add(m.ens); return true; }).slice(0,6);
  if(!list.length){ toast("Aucun magasin connu dans votre rayon : touchez « Trouver les vrais magasins autour de mon adresse »"); return; }
  state.storeOrder=list.map(m=>m.id); state.tripStore=[null,null]; save(); render();
  toast(`Magasins les plus proches : ${list.slice(0,3).map(m=>MAGNOM[m.id]).join(", ")}…`,()=>{ state.storeOrder=prev; save(); render(); }); }
// --- Position précise : adresse -> coordonnées, et vrais magasins autour (OpenStreetMap) ---
// ---- Google Maps (clé du propriétaire, enregistrée dans la base de la famille) ----
let GKEY=null, gmLoad=null, gmToken=null;
// Google Maps abandonné : on n'utilise plus de clé et on efface celle qui aurait été gardée sur l'appareil
try{ localStorage.removeItem(KEY+"-gkey"); }catch(e){}
function chargerGoogle(){ if(!GKEY) return Promise.reject(new Error("pas de clé")); if(window.google&&google.maps&&google.maps.importLibrary) return Promise.resolve();
  if(gmLoad) return gmLoad;
  gmLoad=new Promise((ok,ko)=>{ window.__gmReady=()=>ok(); window.gm_authFailure=()=>{ GKEY_ERR=true; toast("Google Maps refuse la clé : vérifiez les restrictions de la clé (site et API autorisés)."); ko(new Error("auth")); };
    const sc=document.createElement("script"); sc.async=true; sc.onerror=()=>{ gmLoad=null; ko(new Error("load")); };
    sc.src="https://maps.googleapis.com/maps/api/js?"+new URLSearchParams({key:GKEY,v:"weekly",libraries:"places",language:"fr",region:"BE",loading:"async",callback:"__gmReady"});
    document.head.appendChild(sc); setTimeout(()=>ko(new Error("timeout")),12000); });
  return gmLoad; }
let GKEY_ERR=false;
async function adressesGoogle(q){ await chargerGoogle(); const {AutocompleteSuggestion,AutocompleteSessionToken}=await google.maps.importLibrary("places");
  if(!gmToken) gmToken=new AutocompleteSessionToken();
  const {suggestions}=await AutocompleteSuggestion.fetchAutocompleteSuggestions({input:q,includedRegionCodes:["be"],language:"fr",region:"be",sessionToken:gmToken,origin:{lat:HOME.lat,lng:HOME.lon}});
  return (suggestions||[]).map(x=>x.placePrediction).filter(Boolean).slice(0,6).map(pp=>({label:cleanTxt(pp.text&&pp.text.text||""),precis:(pp.types||[]).some(t=>["street_address","premise","subpremise"].includes(t)),
    resolve:async()=>{ const pl=pp.toPlace(); await pl.fetchFields({fields:["location","formattedAddress","types"]}); gmToken=null;
      return {label:cleanTxt(pl.formattedAddress||"").replace(/, Belgique$|, Belgium$/,""),lat:Math.round(pl.location.lat()*1e5)/1e5,lon:Math.round(pl.location.lng()*1e5)/1e5,precis:(pl.types||[]).some(t=>["street_address","premise","subpremise"].includes(t))}; }})); }
async function magasinsGoogle(R){ await chargerGoogle(); const {Place,SearchNearbyRankPreference}=await google.maps.importLibrary("places");
  const center={lat:HOME.lat,lng:HOME.lon}, out=[], vu=new Set();
  const garder=list=>(list||[]).forEach(pl=>{ if(!pl.location||vu.has(pl.id)) return; vu.add(pl.id); const nom=pl.displayName||"", txt=norm(nom);
    let b=OSM_BRANDS.find(([re])=>re.test(txt)); if(!b){ if(!(pl.types||[]).includes("supermarket")) return; b=[null,"autre"]; }
    const lat=Math.round(pl.location.lat()*1e5)/1e5, lon=Math.round(pl.location.lng()*1e5)/1e5; if(km(HOME,{lat,lon})>R/1000) return;
    const adr=cleanTxt(pl.formattedAddress||"").replace(/, Belgique$|, Belgium$/,"").replace(/\b\d{4} /,"");
    out.push({id:("g"+pl.id).replace(/[^A-Za-z0-9_-]/g,"").slice(0,90),ens:b[1],nom:(cleanTxt(nom)||ENS[b[1]]).slice(0,40),lieu:(adr||"Localisé sur la carte").slice(0,80),lat,lon}); });
  const champs=["id","displayName","location","formattedAddress","types"];
  // 20 résultats au plus par demande : les plus proches, puis une recherche par enseigne pour ne rien oublier
  const r1=await Place.searchNearby({fields:champs,locationRestriction:{center,radius:Math.min(R,50000)},includedPrimaryTypes:["supermarket","grocery_store"],maxResultCount:20,rankPreference:SearchNearbyRankPreference.DISTANCE,language:"fr",region:"be"});
  garder(r1.places);
  const enseignes=["Delhaize","Carrefour","Colruyt","Aldi","Lidl","Intermarché","OKay","Spar","Albert Heijn","Louis Delhaize"];
  await Promise.all(enseignes.map(async e=>{ try{ const r=await Place.searchByText({textQuery:e+" supermarché",fields:champs,locationBias:{center,radius:Math.min(R,50000)},maxResultCount:5,language:"fr",region:"be"}); garder(r.places); }catch(err){} }));
  return out; }
function setGoogleKey(k){ k=null; GKEY=null; gmLoad=null; GKEY_ERR=false; try{ k?localStorage.setItem(KEY+"-gkey",k):localStorage.removeItem(KEY+"-gkey"); }catch(e){} renderGkey(); }
function renderGkey(){ const b=$("gkeybox"); if(!b) return; b.hidden=!GKEY; if(!GKEY){ b.innerHTML=""; return; }
  b.innerHTML=`<b>Google Maps</b> <span class="bdg ${GKEY?"b-eco":"b-plaisir"}">${GKEY?"activé":"pas encore activé"}</span>
    <p class="note">${GKEY?"Les adresses et les magasins viennent de Google Maps. OpenStreetMap sert de secours.":"Sans clé, les adresses et les magasins viennent d'OpenStreetMap, moins complet."}</p>
    <div class="owner-only"><div class="addrow"><input id="gkey" type="text" autocomplete="off" spellcheck="false" placeholder="Clé Google Maps (commence par AIza)" value="${GKEY?esc(GKEY):""}" aria-label="Clé Google Maps"><button class="btn primary" type="button" id="gkeyok">Enregistrer</button></div>
    <p class="note">La clé est partagée avec la famille pour que tout le monde en profite. Limitez-la à votre site dans Google Cloud.</p></div>`; }
document.addEventListener("click",async e=>{ if(!e.target.closest("#gkeyok")) return; const k=$("gkey").value.trim();
  if(k&&!/^AIza[0-9A-Za-z_-]{30,}$/.test(k)){ toast("Cette clé ne ressemble pas à une clé Google Maps (elle commence par AIza)"); return; }
  setGoogleKey(k);
  if(DB){ try{ await DB.doc("validations/google").set({cle:k||null,maj:new Date().toISOString()}); toast(k?"Clé enregistrée et partagée avec la famille":"Clé retirée"); }catch(err){ toast("La clé est enregistrée sur cet appareil seulement"); } }
  else toast(k?"Clé enregistrée sur cet appareil":"Clé retirée");
  if(k){ try{ await chargerGoogle(); toast("Google Maps fonctionne"); state.osmAt=null; }catch(err){ if(!GKEY_ERR) toast("Google Maps ne répond pas : vérifiez la clé et les API activées"); } } });
function subscribeGoogle(){ if(!DB) return; DB.doc("validations/google").onSnapshot(snap=>{ if(!snap.exists) return; const d=snap.data(); const k=d&&typeof d.cle==="string"&&/^AIza[0-9A-Za-z_-]{30,}$/.test(d.cle)?d.cle:null; if(k!==GKEY) setGoogleKey(k); },()=>{}); }
// Recherche libre : Photon (OpenStreetMap, fait pour la saisie au fil de la frappe), puis Nominatim en secours
async function chercherAdresses(q){
  const out=[], add=(label,lat,lon,precis)=>{ lat=Math.round(+lat*1e5)/1e5; lon=Math.round(+lon*1e5)/1e5; if(!(lat>49.4&&lat<51.6&&lon>2.5&&lon<6.5)) return; if(!out.some(x=>km(x,{lat,lon})<0.03)) out.push({label,lat,lon,precis}); };
  const tm=ms=>{ const c=new AbortController(); setTimeout(()=>c.abort(),ms); return c.signal; };
  // 0) Google Maps quand la clé est réglée
  if(GKEY&&!GKEY_ERR){ try{ const g=await adressesGoogle(q); if(g.length) return g; }catch(e){} }
  // 1) Service officiel de la Région wallonne (adresses ICAR, registre officiel) : gratuit, sans clé
  try{ const r=await fetch("https://geoservices.wallonie.be/geocodeWS/geocode?"+new URLSearchParams({address:q,crs:"EPSG:4326"}),{signal:tm(6000)});
    if(r.ok){ const j=await r.json(); (j.candidates||[]).slice(0,6).forEach(c=>{ const g=c.geometry&&c.geometry.coordinates; if(!g) return; let [a,b]=g; if(a<40){ const t=a; a=b; b=t; } // [lon,lat] ou [lat,lon]
      const nm=o=>o&&(o.name||o.ident)?String(o.name||o.ident):""; const sc=String(c.score||"");
      const rue=[nm(c.street),c.house&&c.house.name].filter(Boolean).join(" "), lieu=[c.zone&&c.zone.ident,nm(c.city)].filter(Boolean).join(" ");
      add(([rue,lieu].filter(Boolean).join(", ")||q).replace(/</g,""), a, b, sc==="111"||!!(c.house&&c.house.name)); }); }
  }catch(e){}
  if(out.length) return out;
  // 2) Photon, puis 3) Nominatim (OpenStreetMap)
  try{ const r=await fetch("https://photon.komoot.io/api/?"+new URLSearchParams({q,limit:"7",lang:"fr",lat:String(HOME.lat),lon:String(HOME.lon),bbox:"2.5,49.45,6.45,51.55"}),{signal:tm(8000)});
    if(r.ok){ const j=await r.json(); (j.features||[]).forEach(f=>{ const p=f.properties||{}, c=f.geometry&&f.geometry.coordinates; if(!c||(p.countrycode&&p.countrycode!=="BE")) return;
      const rue=[p.street||(p.type==="street"?p.name:""),p.housenumber].filter(Boolean).join(" "), lieu=[p.postcode,p.city||p.district||p.locality||(p.type==="city"?p.name:"")].filter(Boolean).join(" ");
      add([rue||(p.type!=="city"?p.name:""),lieu].filter(Boolean).join(", ")||p.name, c[1], c[0], !!p.housenumber||p.type==="house"); }); }
  }catch(e){}
  if(!out.length){ try{ const r=await fetch("https://nominatim.openstreetmap.org/search?"+new URLSearchParams({q,format:"jsonv2",countrycodes:"be",limit:"6","accept-language":"fr",addressdetails:"1"}),{signal:tm(8000),headers:{Accept:"application/json"}});
    if(r.ok){ const j=await r.json(); (j||[]).forEach(x=>{ const a=x.address||{}; const rue=[a.road,a.house_number].filter(Boolean).join(" "), lieu=[a.postcode,a.village||a.town||a.city||a.municipality].filter(Boolean).join(" ");
      add([rue,lieu].filter(Boolean).join(", ")||x.display_name.split(",").slice(0,3).join(","), x.lat, x.lon, !!a.house_number); }); } }catch(e){} }
  return out; }
let addrTimer=null, addrSeq=0, addrRes=[];
$("addr-q").addEventListener("input",()=>{ clearTimeout(addrTimer); const q=$("addr-q").value.trim(), box=$("addr-sugg");
  if(q.length<4){ box.innerHTML=""; return; }
  addrTimer=setTimeout(async()=>{ const my=++addrSeq; box.innerHTML=`<p class="note">Recherche…</p>`; const l=await chercherAdresses(q); if(my!==addrSeq) return; addrRes=l;
    box.innerHTML=l.length?l.map((x,i)=>`<button type="button" class="addritem" data-addr="${i}" role="option"><b>${esc(x.label)}</b><small>${x.precis?"Adresse exacte":"Rue ou localité"}</small></button>`).join("")
      :`<p class="note">Aucune adresse trouvée. Vérifiez l'orthographe, ajoutez la localité, ou utilisez le code postal ci-dessous.</p>`; },450); });
$("addr-sugg").addEventListener("click",async e=>{ const b=e.target.closest("[data-addr]"); if(!b) return; let x=addrRes[+b.dataset.addr]; if(!x) return;
  if(x.resolve){ try{ b.disabled=true; x=await x.resolve(); }catch(err){ toast("Cette adresse n'a pas pu être localisée, essayez-en une autre"); b.disabled=false; return; } }
  $("addr-sugg").innerHTML=""; $("addr-q").value=""; $("homeaddr").open=false;
  setHome({nom:x.label.slice(0,80),lat:x.lat,lon:x.lon,precision:x.precis?"exacte":"rue"}); });
async function geocodeAdresse(rue,cp,ville){
  // d'abord la recherche libre (plus tolérante sur l'ordre rue / numéro), puis la recherche structurée
  try{ const l=await chercherAdresses(`${rue}, ${cp} ${ville}`); const ok=l.find(x=>x.precis)||l[0]; if(ok) return {lat:ok.lat,lon:ok.lon,exacte:ok.precis}; }catch(e){}
  const tries=[rue, rue.replace(/\s*\d+[a-zA-Z]?(\s*(bte|bt|boîte|bus)\s*\w+)?\s*$/i,"").replace(/^\d+[a-zA-Z]?,?\s*/,"")].filter((v,i,a)=>v&&a.indexOf(v)===i);
  for(const street of tries){
    const u="https://nominatim.openstreetmap.org/search?"+new URLSearchParams({format:"jsonv2",countrycodes:"be",limit:"1","accept-language":"fr",street,postalcode:cp,city:ville});
    const r=await fetch(u,{headers:{Accept:"application/json"}}); if(!r.ok) throw new Error("geocode "+r.status);
    const j=await r.json(); if(j&&j[0]) return {lat:Math.round(+j[0].lat*1e5)/1e5, lon:Math.round(+j[0].lon*1e5)/1e5, exacte:street===rue&&/\d/.test(rue)};
  }
  return null;
}
const OSM_BRANDS=[[/bio ?planet/,"bioplanet"],[/louis delhaize/,"louisdelhaize"],[/delhaize|proxy|shop ?& ?go/,"delhaize"],[/\baldi\b/,"aldi"],[/\blidl\b/,"lidl"],[/colruyt/,"colruyt"],[/carrefour/,"carrefour"],[/intermarche|\bitm\b/,"inter"],[/\bok ?ay\b/,"okay"],[/eurospar/,"eurospar"],[/\bspar\b/,"spar"],[/albert heijn|\bah\b/,"ah"],[/\bjumbo\b/,"jumbo"],[/\bs?match\b/,"match"],[/\bcora\b/,"cora"]];
async function overpass(q){
  // trois serveurs publics OpenStreetMap, 20 secondes maximum chacun
  for(const ep of ["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"]){
    const ctl=new AbortController(), tm=setTimeout(()=>ctl.abort(),20000);
    try{ const r=await fetch(ep,{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ctl.signal}); clearTimeout(tm); if(r.ok) return await r.json(); }catch(e){ clearTimeout(tm); }
  }
  throw new Error("overpass");
}
let osmBusy=false;
async function chercherMagasinsOSM(){
  if(osmBusy) return; if(HOME.precision!=="exacte"&&HOME.precision!=="rue") toast("Astuce : entrez votre rue dans « Entrer mon adresse » pour une recherche plus précise.");
  osmBusy=true; const btn=$("osmstores"); if(btn){ btn.disabled=true; btn.textContent="Recherche des magasins…"; }
  try{
    const R=rayonKm()*1000, a=`(around:${R},${HOME.lat},${HOME.lon})`;
    let gfound=null; if(GKEY){ try{ gfound=await magasinsGoogle(R); }catch(err){ gfound=null; } }
    const j=gfound?{elements:[]}:await overpass(`[out:json][timeout:25];(nwr["shop"="supermarket"]${a};nwr["shop"="convenience"]["brand"]${a};);out center tags 300;`);
    const found=[];
    (j.elements||[]).forEach(el=>{ const t=el.tags||{}, txt=norm((t.brand||"")+" "+(t.name||"")+" "+(t.operator||""));
      let b=OSM_BRANDS.find(([re])=>re.test(txt)); if(!b){ if(t.shop!=="supermarket"||!t.name) return; b=[null,"autre"]; }
      const lat=el.lat!=null?el.lat:el.center&&el.center.lat, lon=el.lon!=null?el.lon:el.center&&el.center.lon; if(typeof lat!=="number"||typeof lon!=="number") return;
      const rue=cleanTxt([t["addr:street"],t["addr:housenumber"]].filter(Boolean).join(" ")), ville=cleanTxt(t["addr:city"]||t["addr:place"]||"");
      found.push({id:"o"+el.type[0]+el.id, ens:b[1], nom:(cleanTxt(t.name||t.brand)||ENS[b[1]]).slice(0,40), lieu:([rue,ville].filter(Boolean).join(", ")||"Localisé sur la carte").slice(0,80), lat:Math.round(lat*1e5)/1e5, lon:Math.round(lon*1e5)/1e5}); });
    if(gfound) found.push(...gfound);
    // le même magasin est parfois dessiné deux fois (un point et le bâtiment) : on n'en garde qu'un
    for(let i=found.length-1;i>=0;i--){ if(found.some((g,k)=>k<i&&g.ens===found[i].ens&&km(g,found[i])<0.15)) found.splice(i,1); }
    if(!found.length){ toast(`Aucun supermarché trouvé à moins de ${rayonKm()} km de ${HOME.nom}. Vérifiez votre adresse.`); return; }
    // les magasins déjà connus reçoivent leur position exacte, les autres sont ajoutés
    const fix={...state.storeFix}, add=[]; let corr=0;
    found.forEach(f=>{ const twin=MAGASINS.filter(m=>!m.perso&&m.ens===f.ens&&!/^(o[nwr]\d|g[A-Za-z0-9_-]{6})/.test(m.id)&&km(m,f)<1.2).sort((x,y)=>km(x,f)-km(y,f))[0];
      if(twin){ if(!fix[twin.id]||km(fix[twin.id],f)>0.01){ fix[twin.id]={lat:f.lat,lon:f.lon,lieu:f.lieu!=="Localisé sur la carte"?f.lieu:twin.lieu}; corr++; } twin.lat=f.lat; twin.lon=f.lon; twin.osm=true; }
      else add.push(f); });
    state.storeFix=fix; state.osmAt={lat:HOME.lat,lon:HOME.lon};
    const keep=state.osmStores.filter(m=>!add.some(x=>x.id===m.id));
    state.osmStores=[...add,...keep].sort((x,y)=>km(HOME,x)-km(HOME,y)).slice(0,80);
    state.osmStores.forEach(m=>{ const ex=MAGASINS.find(x=>x.id===m.id); if(ex) Object.assign(ex,m,{osm:true}); else MAGASINS.push({...m,osm:true}); });
    save(); render();
    toast(`${found.length} magasins trouvés dans un rayon de ${rayonKm()} km${corr?`, dont ${corr} ${corr>1?"repositionnés":"repositionné"} exactement`:""}.`,()=>pickNearest(),"Prendre les plus proches");
  }catch(e){ toast(GKEY?"La recherche n'a pas abouti : vérifiez la clé Google Maps dans Mes magasins.":"Le service de carte OpenStreetMap ne répond pas pour le moment. Réessayez dans une minute."); }
  finally{ osmBusy=false; if(btn){ btn.disabled=false; btn.textContent="Trouver les vrais magasins autour de mon adresse"; } }
}
$("osmstores").onclick=chercherMagasinsOSM;
$("nearest").onclick=pickNearest;
// ajout manuel d'un magasin
async function fillVillesFor(cpId,selId){ const cp=$(cpId).value.trim(), sel=$(selId);
  if(!/^\d{4}$/.test(cp)){ sel.innerHTML='<option value="">Entrez d\'abord le code postal</option>'; return; }
  const d=await loadCP(); if(!d){ sel.innerHTML='<option value="">Liste indisponible, réessayez</option>'; return; }
  const hits=d.filter(x=>x[0]===cp); sel.innerHTML=hits.length? hits.map((x,i)=>`<option value="${i}">${esc(x[1])}</option>`).join("") : '<option value="">Code postal inconnu</option>'; }
$("as-cp").addEventListener("input",()=>fillVillesFor("as-cp","as-ville"));
$("addstore").addEventListener("submit",async e=>{ e.preventDefault();
  const ens=$("as-ens").value, cp=$("as-cp").value.trim(), rue=$("as-rue").value.trim();
  const d=await loadCP(); const hits=d?d.filter(x=>x[0]===cp):[]; const h=hits[+$("as-ville").value];
  if(!h){ toast("Indiquez le code postal et la localité du magasin"); return; }
  let g=null; if(rue){ try{ g=await geocodeAdresse(rue,cp,h[1]); }catch(err){} if(g&&km(g,{lat:h[2],lon:h[3]})>15) g=null; }
  const m={id:"c"+Date.now().toString(36),ens,nom:($("as-nom").value.trim()||ENS[ens]).slice(0,40),lieu:(rue?rue+", ":"")+h[1],lat:g?g.lat:h[2],lon:g?g.lon:h[3]};
  state.customStores=[...state.customStores,m]; MAGASINS.push({...m,perso:true}); state.storeOrder=[...state.storeOrder,m.id];
  ["as-nom","as-rue","as-cp"].forEach(id=>$(id).value=""); $("as-ville").innerHTML='<option value="">Entrez d\'abord le code postal</option>'; $("addstorebox").open=false;
  save(); render(); toast(m.nom+" ajouté à vos magasins"); });
$("homesel").onchange=e=>{ const c=COMMUNES.find(([n])=>n===e.target.value); if(c) setHome({nom:c[0],lat:c[1],lon:c[2]}); };
function parseCoords(t){ t=String(t||"").trim(); let m=t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/^(-?\d{1,2}[.,]\d+)\s*[,;\s]\s*(-?\d{1,2}[.,]\d+)$/);
  if(!m) return null; const lat=+String(m[1]).replace(",","."), lon=+String(m[2]).replace(",",".");
  return (lat>49.3&&lat<51.6&&lon>2.4&&lon<6.5)?{lat,lon}:null; }
$("homeset").onclick=()=>{ const v=$("homecoord").value, c=parseCoords(v);
  if(!c){ toast(/goo\.gl|maps\.app/.test(v)?"Ce lien court ne contient pas les coordonnées : copiez plutôt les chiffres affichés dans Google Maps":"Coordonnées non reconnues (exemple : 50.4760, 3.8830)"); return; }
  $("homecoord").value=""; setHome({nom:"Mon domicile",precision:"exacte",...c}); };
// --- adresse saisie à la main : code postal -> localités (données publiées avec la page) ---
let CP=null, cpLoading=null;
const norm = t => String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function loadCP(){ if(CP) return Promise.resolve(CP); if(!cpLoading) cpLoading=fetch("codes-postaux.json").then(r=>r.json()).then(d=>{CP=d;return d;}).catch(()=>{cpLoading=null; return null;}); return cpLoading; }
async function fillVilles(){ const cp=$("addr-cp").value.trim(), sel=$("addr-ville");
  if(!/^\d{4}$/.test(cp)){ sel.innerHTML='<option value="">Entrez d\'abord le code postal</option>'; return; }
  const d=await loadCP(); if(!d){ sel.innerHTML='<option value="">Liste indisponible, réessayez</option>'; return; }
  const hits=d.filter(x=>x[0]===cp);
  sel.innerHTML=hits.length? hits.map((x,i)=>`<option value="${i}">${esc(x[1])}</option>`).join("") : '<option value="">Code postal inconnu</option>';
  sel.dataset.cp=cp; }
$("addr-cp").addEventListener("input",fillVilles);
$("addr-cp").addEventListener("focus",()=>{ loadCP(); });
$("addrform").addEventListener("submit",async e=>{ e.preventDefault();
  const rue=$("addr-rue").value.trim(), cp=$("addr-cp").value.trim(), sel=$("addr-ville");
  if(!/^\d{4}$/.test(cp)){ toast("Entrez un code postal belge à 4 chiffres"); $("addr-cp").focus(); return; }
  const d=await loadCP(); if(!d){ toast("La liste des codes postaux n'a pas pu être chargée"); return; }
  const hits=d.filter(x=>x[0]===cp); const h=hits[+sel.value]; if(!h){ toast("Choisissez votre localité"); return; }
  const nom=(rue?rue+", ":"")+h[1]; let g=null;
  if(rue){ const b=e.submitter||$("addrform").querySelector("button[type=submit]"); b.disabled=true; b.textContent="Recherche de l'adresse…";
    try{ g=await geocodeAdresse(rue,cp,h[1]); }catch(err){ g=null; } b.disabled=false; b.textContent="Utiliser cette adresse"; }
  if(g&&km(g,{lat:h[2],lon:h[3]})<15){ setHome({nom, lat:g.lat, lon:g.lon, precision:g.exacte?"exacte":"rue", adresse:{rue,cp,ville:h[1]}}); }
  else { setHome({nom, lat:h[2], lon:h[3], precision:"localite", adresse:{rue,cp,ville:h[1]}}); if(rue) setTimeout(()=>toast("Adresse introuvable sur la carte : le trajet part du centre de "+h[1]+". Vérifiez l'orthographe de la rue."),2600); }
  $("homeaddr").open=false; });
$("outdef").addEventListener("click",e=>{ const b=e.target.closest("[data-outdef]"); if(!b) return; const d=+b.dataset.outdef, cur=new Set(state.outDefault);
  cur.has(d)?cur.delete(d):cur.add(d); state.outDefault=[...cur].sort(); save(); render();
  toast(`Soirs habituellement à l'extérieur : ${state.outDefault.length?state.outDefault.map(x=>JOURS[x].toLowerCase()).join(", "):"aucun"}. Une semaine peut toujours être modifiée depuis la fiche du jour.`); });
$("storemode").onchange=e=>{ state.storeMode=e.target.value; save(); render(); toast(state.storeMode==="fixe"?"Courses toujours chez "+MAGNOM[state.storeOrder[0]]:"Magasin le plus avantageux selon vos préférences"); };
$("sorder").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b||b.disabled) return; const D=b.dataset, o=[...state.storeOrder];
  if(D.sup){ const i=+D.sup; [o[i-1],o[i]]=[o[i],o[i-1]]; state.storeOrder=o; }
  else if(D.sdown){ const i=+D.sdown; [o[i+1],o[i]]=[o[i],o[i+1]]; state.storeOrder=o; }
  else if(D.sdel){ if(o.length<=1){ toast("Gardez au moins un magasin"); return; } const id=D.sdel; state.storeOrder=o.filter(x=>x!==id); state.tripStore=state.tripStore.map(x=>x===id?null:x); toast(MAGNOM[id]+" retiré de vos magasins"); }
  else return; save(); render(); });
$("rayonchips").addEventListener("click",e=>{ const b=e.target.closest("[data-rayon]"); if(!b) return; const before=rayonKm(); state.rayon=+b.dataset.rayon; save(); render();
  if(state.rayon>before&&typeof chercherMagasinsOSM==="function"){ state.osmAt=null; chercherMagasinsOSM(); } else toast(`Rayon de ${state.rayon} km`); });
$("savail").addEventListener("click",e=>{ const b=e.target.closest("[data-sadd]"); if(!b) return; const id=b.dataset.sadd; if(state.storeOrder.includes(id)) return;
  state.storeOrder=[...state.storeOrder,id]; save(); render(); toast(MAGNOM[id]+" ajouté en dernière position : remontez-le si besoin"); });
$("ensfilter").addEventListener("click",e=>{ const b=e.target.closest("[data-ensf]"); if(!b) return; ensFilter=b.dataset.ensf; renderStoreOrder(); });
$("newrecipe").onclick=()=>openSheet({type:"recipe",draft:newDraft()});
$("rewizard").onclick=()=>openSheet({type:"wizard",step:0});
let wizardChecked=false;
function maybeWizard(){ if(wizardChecked) return; wizardChecked=true; if(!state.onboarded&&!state.family.length&&!sheetCtx) openSheet({type:"wizard",step:0}); }

// ======================= Export de la liste : PDF, e-mail, message =======================
let DL=null; // capacité de téléchargement (null si indisponible)
function pdfSafe(t){ return String(t).replace(/[  ]/g," ").replace(/≈\s?/g,"env. ").replace(/→/g,"->").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,"...").replace(/✓/g,"x"); }
function exportTrips(){ return [0]; }
function exportItems(t,items){ const c=sheetCtx||{}; return c.onlyLeft? items.filter(i=>!state.checked[i.ck]) : items; }
function exportText(){
  const trips=coursesTrips();
  let txt=`Liste de courses · semaine du ${weekLabel()} (${totalCouverts()} couverts)\n`;
  exportTrips().forEach(t=>{ const all=trips[t], plan=planTrip(t,all), items=exportItems(t,all); if(!items.length) return;
    txt+=`\n== Courses de la semaine · ${fmtD(tripDate(t))} ==\n`;
    [plan.primary,plan.secondary].filter(Boolean).forEach(mag=>{ const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return;
      txt+=`\n>> ${MAGNOM[mag]}\n`+ORDRE.map(ray=>{const its=si.filter(i=>i.ray===ray); return its.length? RAYONS[ray]+"\n"+its.map(i=>`- ${i.n} : ${qtyOf(i)}${state.checked[i.ck]?" (acheté)":""}`).join("\n")+"\n":""}).join(""); }); });
  return txt+`\nÀ vérifier au placard : huile, sel, poivre, ail, vinaigrette, sauce soja.\n${APP_URL}`;
}
function buildPdf(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210, M=16, BOT=282, ACC=[46,122,76], WARM=[184,110,11], MUT=[93,106,96], INK=[30,42,33];
  let y=M; const T=pdfSafe;
  const need=h=>{ if(y+h>BOT){ doc.addPage(); y=M; } };
  doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...INK); doc.text("Liste de courses",M,y+6); y+=11;
  doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(...MUT);
  doc.text(T(`Semaine du ${weekLabel()} · ${totalCouverts()} couverts · budget estimé ${eur(weekCost(state.gamme))} (gamme ${GAMMES[state.gamme].nom.toLowerCase()})`),M,y); y+=8;
  // menus de la semaine
  doc.setDrawColor(220,227,214); doc.setFillColor(245,247,241); const mh=7*5.2+6; doc.roundedRect(M,y,W-2*M,mh,2,2,"FD"); let yy=y+6;
  doc.setFontSize(9.5); state.week.forEach((id,d)=>{ doc.setFont("helvetica","bold"); doc.setTextColor(...ACC); doc.text(T(`${JOURS[d]} ${fmtShort(dayOffset(d))}`),M+4,yy);
    doc.setFont("helvetica","normal"); doc.setTextColor(...INK); doc.text(T(`${BYID[id].nom} · ${headcount(d)} à table${state.cooks[d]?" · "+state.cooks[d]+" cuisine":""}`),M+34,yy); yy+=5.2; });
  y+=mh+8;
  const trips=coursesTrips();
  exportTrips().forEach(t=>{ const all=trips[t], plan=planTrip(t,all), items=exportItems(t,all); if(!items.length) return;
    need(16); doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(T(`Courses de la semaine · ${fmtD(tripDate(t))}`),M,y); y+=3;
    doc.setDrawColor(...ACC); doc.setLineWidth(0.6); doc.line(M,y,W-M,y); y+=6;
    [plan.primary,plan.secondary].filter(Boolean).forEach(mag=>{ const si=items.filter(i=>plan.assign[i.k]===mag); if(!si.length) return; const m=MAGBYID(mag);
      need(12); doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...ACC); doc.text(T(m.nom),M,y);
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...MUT); doc.text(T(`${m.lieu} · ${si.length} article${si.length>1?"s":""}`),M+doc.getTextWidth(T(m.nom))*12/9+4,y); y+=6;
      ORDRE.forEach(ray=>{ const its=si.filter(i=>i.ray===ray); if(!its.length) return;
        need(10); doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text(T(RAYONS[ray].toUpperCase()),M,y); y+=5;
        its.forEach(i=>{ const pr=promosFor(i.n).find(p=>p.mag===ensOf(mag)&&validOn(p,tripDate(t))); const h=pr?9:6.5; need(h);
          const done=!!state.checked[i.ck];
          doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.rect(M,y-3.4,4,4);
          if(done){ doc.setDrawColor(...ACC); doc.setLineWidth(0.7); doc.line(M+0.8,y-1.4,M+1.8,y-0.4); doc.line(M+1.8,y-0.4,M+3.4,y-2.8); }
          doc.setFont("helvetica",done?"normal":"normal"); doc.setFontSize(11); doc.setTextColor(...(done?MUT:INK)); doc.text(T(i.n),M+7,y);
          doc.setFont("helvetica","bold"); doc.text(T(qtyOf(i)),W-M,y,{align:"right"});
          if(done){ const w=doc.getTextWidth(T(i.n)); doc.setDrawColor(...MUT); doc.setLineWidth(0.2); doc.line(M+7,y-1.3,M+7+w,y-1.3); }
          if(pr){ doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...WARM); doc.text(T(`Promo ${eur(pr.prix)}${pr.avant?" au lieu de "+eur(pr.avant):""} jusqu'au ${fmtShort(isoDate(pr.au))}`),M+7,y+3.6); }
          y+=h; });
        y+=2; });
      y+=3; });
    y+=4; });
  need(14); doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(...MUT);
  doc.text(T("À vérifier au placard : huile, sel, poivre, ail, vinaigrette, sauce soja."),M,y); y+=5;
  doc.text(T("Recettes et liste à jour : "+APP_URL),M,y);
  const n=doc.getNumberOfPages(); for(let k=1;k<=n;k++){ doc.setPage(k); doc.setFontSize(8); doc.setTextColor(...MUT);
    doc.text(T(`Menus de la semaine · créé le ${new Date().toLocaleDateString("fr-BE")} · page ${k}/${n}`),W/2,292,{align:"center"}); }
  return doc.output("blob");
}
function mailtoHref(){
  const to=state.family.map(n=>state.emails[n]).filter(Boolean).join(",");
  let body=exportText(); if(body.length>1800) body=body.slice(0,1800)+"\n... (liste complète dans l'application)\n"+APP_URL;
  return "mailto:"+encodeURIComponent(to).replace(/%2C/g,",")+"?subject="+encodeURIComponent("Liste de courses · semaine du "+weekLabel())+"&body="+encodeURIComponent(body);
}
function renderExport(){ const c=sheetCtx; c.kind=c.kind||"courses"; if(c.kind==="menu") return renderExportMenu(); c.which=c.which||"both";
  const trips=coursesTrips(), cnt=t=>exportItems(t,trips[t]).length;
  const mails=state.family.map(n=>state.emails[n]).filter(Boolean);
  $("seyebrow").textContent=`Semaine du ${weekLabel()}`; $("stitle").textContent="Exporter et envoyer"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`${exportKindChips()}<div class="wfield"><span>Quelle liste ?</span>
    <label class="xcheck"><input type="checkbox" id="xleft"${c.onlyLeft?" checked":""}> Seulement les articles qui restent à acheter</label>
    <p class="note">${exportTrips().map(t=>`${cnt(t)} article${cnt(t)>1?"s":""}`).join(" · ")}</p>
    <div class="xopt"><div><b>En PDF</b><small>Un document imprimable, avec les cases à cocher, classé par magasin et par rayon. Sur téléphone, le menu de partage s'ouvre : choisissez Mail, Messages ou WhatsApp.</small></div>
      <button class="btn primary big" data-xpdf="1"${DL&&window.jspdf?"":" disabled"}>Créer le PDF</button>
      ${DL&&window.jspdf?"":`<small class="xwarn">L'export PDF n'est pas disponible dans cette vue. Ouvrez l'application depuis claude.ai ou l'app Claude.</small>`}</div>
    <div class="xopt"><div><b>Par e-mail</b><small>${mails.length?`À ${mails.length} membre${mails.length>1?"s":""} de la famille : ${esc(mails.join(", "))}.`:"Ajoutez les adresses dans l'onglet Famille pour les remplir automatiquement."} Si votre messagerie ne s'ouvre pas, utilisez le PDF ou copiez le texte.</small></div>
      <a class="btn big" href="${esc(mailtoHref())}" target="_blank" rel="noopener" data-xmail="1">Préparer l'e-mail</a></div>
    <div class="xopt"><div><b>Par message</b><small>Copie la liste en texte, prête à coller dans un SMS, WhatsApp ou Messenger.</small></div>
      <button class="btn big" data-xcopy="1">Copier le texte</button></div>
    <textarea class="copybox" id="xtext" readonly hidden aria-label="Liste en texte"></textarea>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`;
}
async function exportPdf(btn){
  if(!DL||!window.jspdf){ toast("Export PDF indisponible ici"); return; }
  btn.disabled=true; btn.textContent="Création du PDF…";
  try{ const blob=buildPdf(); const res=await DL.save({filename:`courses-semaine-${curIso()}.pdf`,data:blob});
    toast(res&&res.status==="shared"?"PDF partagé":"PDF téléchargé : joignez-le à un e-mail ou un message"); }
  catch(e){ const code=e&&e.code; if(code==="declined") toast("Export annulé"); else if(code==="rate_limited") toast("Un export est déjà en cours, réessayez dans un instant"); else toast("Le PDF n'a pas pu être créé"); }
  btn.disabled=false; btn.textContent="Créer le PDF";
}
function exportKindChips(){ const k=sheetCtx.kind; return `<div class="gfilters">${[["courses","Liste de courses"],["menu","Menu de la semaine"]].map(([v,l])=>`<button class="chip${k===v?" on":""}" data-xkind="${v}">${l}</button>`).join("")}</div>`; }
// ---- Export du menu de la semaine ----
function menuRows(){ return state.week.map((id,d)=>{ const r=BYID[id], abs=state.family.filter(n=>(state.absents[n]||[]).includes(d));
  return {d,r,date:dayOffset(d),hc:headcount(d),cook:state.cooks[d],abs,inv:state.invites[d]||0,cost:recipeCost(r,undefined,d),out:isOut(d)}; }); }
function menuText(){
  const {ok,wait}=approvalStats();
  let t=`Menus du soir · semaine du ${weekLabel()}\nStatut : ${state.statut==="valide"?"menu validé":"proposition à discuter"}${limiteTxt()?` · réponse attendue avant ${limiteTxt()}`:""}\n\n`;
  menuRows().forEach(x=>{ if(x.out){ t+=`${JOURS[x.d]} ${fmtShort(x.date)} : repas à l'extérieur\n`; return; } t+=`${JOURS[x.d]} ${fmtShort(x.date)} : ${x.r.nom}${x.r.acc?" (avec "+x.r.acc.toLowerCase()+")":""}\n   ${x.r.t} min · ${x.hc} couvert${x.hc>1?"s":""}${x.abs.length?" · absents : "+x.abs.join(", "):""}${x.inv?" · invités : "+x.inv:""} · cuisine : ${x.cook||"à définir"}\n`; });
  t+=`\n${totalCouverts()} couverts dans la semaine · budget estimé ${eur(weekCost(state.gamme))}\n`;
  if(state.family.length) t+=`\nOnt validé : ${ok.length?ok.join(", "):"personne pour l'instant"}\nEn attente : ${wait.length?wait.join(", "):"personne"}\n`;
  if(sheetCtx&&sheetCtx.withRecipes) menuRows().filter(x=>!x.out).forEach(x=>{ t+=`\n--- ${x.r.nom} (${JOURS[x.d]}, ${x.hc} pers.) ---\nIngrédients : ${x.r.ing.map(([n,q,u])=>n+" "+fmt(scale(q,x.d),u)).join(", ")}\n${getSteps(x.r.id).map((s,i)=>(i+1)+". "+s).join("\n")}\n`; });
  return t+`\n${APP_URL}`;
}
// Photo d'un plat en data URL pour le PDF (photos publiées avec la page ou recette de famille)
async function photoData(id){ try{ const src=photoSrc(id); if(src.startsWith("data:image/jpeg")) return src; if(src.startsWith("data:")) return null;
  const blob=await (await fetch(src)).blob(); return await new Promise(res=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>res(null); fr.readAsDataURL(blob); }); }catch(e){ return null; } }
async function buildMenuPdf(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"});
  const ACC=[46,122,76], ACCS=[226,240,230], WARM=[184,110,11], WARMS=[251,235,210], MUT=[93,106,96], INK=[30,42,33], LINE=[220,227,214], BG=[245,247,241]; const T=pdfSafe;
  const PW=297, PH=210, M=12, GAP=5, COLS=4, top=31, bottom=PH-11;
  const bw=(PW-2*M-(COLS-1)*GAP)/COLS, bh=(bottom-top-GAP)/2;
  // en-tête
  doc.setFont("helvetica","bold"); doc.setFontSize(19); doc.setTextColor(...INK); doc.text("Menus de la semaine",M,M+5);
  doc.setFont("helvetica","normal"); doc.setFontSize(10.5); doc.setTextColor(...MUT);
  doc.text(T(`Semaine du ${weekLabel()} · ${totalCouverts()} couverts · budget estimé ${eur(weekCost(state.gamme))}`),M,M+11.5);
  const stT=T(state.statut==="valide"?"Menu validé":"Proposition à discuter"); doc.setFont("helvetica","bold"); doc.setFontSize(10);
  const sw=doc.getTextWidth(stT)+8; doc.setFillColor(...(state.statut==="valide"?ACCS:WARMS)); doc.roundedRect(PW-M-sw,M,sw,7,3.5,3.5,"F");
  doc.setTextColor(...(state.statut==="valide"?ACC:WARM)); doc.text(stT,PW-M-sw+4,M+4.9);
  if(limiteTxt()){ doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...MUT); doc.text(T(`Réponse attendue avant ${limiteTxt()}`),PW-M,M+12,{align:"right"}); }
  const rows=menuRows(), photos=await Promise.all(rows.map(x=>x.out?null:photoData(x.r.id)));
  rows.forEach((x,i)=>{ const col=i%COLS, row=Math.floor(i/COLS), X=M+col*(bw+GAP), Y=top+row*(bh+GAP);
    const today=x.date.getTime()===TODAY.getTime();
    doc.setDrawColor(...(today?ACC:LINE)); doc.setLineWidth(today?0.8:0.3); doc.setFillColor(...(x.out?BG:[255,255,255])); doc.roundedRect(X,Y,bw,bh,3,3,"FD");
    // bandeau du jour
    doc.setFillColor(...(x.out?MUT:ACC)); doc.roundedRect(X,Y,bw,9,3,3,"F"); doc.rect(X,Y+5,bw,4,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(10.5); doc.setTextColor(255,255,255); doc.text(T(JOURS[x.d]),X+4,Y+6.2);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(T(fmtShort(x.date)),X+bw-4,Y+6.2,{align:"right"});
    let y=Y+9;
    if(x.out){ doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(...MUT); doc.text(T("Repas à l'extérieur"),X+bw/2,Y+bh/2,{align:"center"});
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(T("Pas de cuisine ni de courses"),X+bw/2,Y+bh/2+6,{align:"center"}); return; }
    const ph=photos[i], ih=26;
    if(ph){ try{ doc.addImage(ph,"JPEG",X+0.3,y,bw-0.6,ih,undefined,"FAST"); y+=ih; }catch(e){} }
    y+=5;
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...INK);
    const nom=doc.splitTextToSize(T(x.r.nom),bw-8).slice(0,2); doc.text(nom,X+4,y); y+=nom.length*4.6;
    if(x.r.acc){ doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); const acc=doc.splitTextToSize(T("avec "+x.r.acc.toLowerCase()),bw-8).slice(0,1); doc.text(acc,X+4,y); y+=4.2; }
    // pied de case : cuisinier, couverts, durée
    const fy=Y+bh-12;
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(X+4,fy-3,X+bw-4,fy-3);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text("Cuisine",X+4,fy+0.5);
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...(x.cook?INK:MUT)); doc.text(T(x.cook||"à définir"),X+4,fy+5.5);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...MUT); doc.text("Couverts",X+bw-4,fy+0.5,{align:"right"});
    doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(...ACC); doc.text(String(x.hc),X+bw-4,fy+6,{align:"right"});
    const extra=[`${x.r.t} min`, x.abs.length?"absent : "+x.abs.join(", "):"", x.inv?`+${x.inv} invité${x.inv>1?"s":""}`:""].filter(Boolean).join(" · ");
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(doc.splitTextToSize(T(extra),bw-8).slice(0,2),X+4,Math.min(y+1,fy-5));
  });
  // 8e case : résumé et validations
  { const X=M+3*(bw+GAP), Y=top+bh+GAP; doc.setFillColor(...BG); doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.roundedRect(X,Y,bw,bh,3,3,"FD");
    let y=Y+8; doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...INK); doc.text("La semaine en bref",X+4,y); y+=6;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...INK);
    [`${homeDays().length} soirs à la maison`,`${totalCouverts()} couverts`,`Budget ≈ ${eur(weekCost(state.gamme))}`].forEach(l=>{ doc.text(T(l),X+4,y); y+=4.6; });
    if(state.family.length){ const {ok}=approvalStats(); y+=2; doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text(T(`Validations ${ok.length}/${state.family.length}`),X+4,y); y+=5;
      doc.setFontSize(9); state.family.slice(0,9).forEach(n=>{ const a=approvalOf(n), okk=a&&!a.ancienne;
        doc.setFillColor(...(okk?ACC:LINE)); doc.circle(X+5.5,y-1.2,1.6,"F"); doc.setFont("helvetica",okk?"bold":"normal"); doc.setTextColor(...(okk?INK:MUT));
        doc.text(T(n+(okk?"":a&&a.ancienne?" (ancienne version)":" (en attente)")),X+9,y); y+=4.4; }); }
    if(limiteTxt()){ doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...WARM); doc.text(doc.splitTextToSize(T("Réponse avant "+limiteTxt()),bw-8),X+4,Y+bh-8); } }
  // pages de recettes (portrait)
  if(sheetCtx&&sheetCtx.withRecipes){ const W=210, M2=16, BOT=282; let y;
    const need=h=>{ if(y+h>BOT){ doc.addPage("a4","portrait"); y=M2; } };
    rows.filter(x=>!x.out).forEach(x=>{ doc.addPage("a4","portrait"); y=M2;
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...ACC); doc.text(T(`${JOURS[x.d].toUpperCase()} ${fmtShort(x.date)} · ${x.hc} COUVERTS${x.cook?" · CUISINE : "+x.cook.toUpperCase():""}`),M2,y); y+=8;
      doc.setFontSize(18); doc.setTextColor(...INK); doc.text(T(x.r.nom),M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(...MUT); doc.text(T(`${x.r.t} min${x.r.acc?" · avec "+x.r.acc.toLowerCase():""} · coût estimé ${eur(x.cost)}`),M2,y); y+=9;
      doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.setTextColor(...INK); doc.text("Ingrédients",M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10.5); x.r.ing.forEach(([n,q,u])=>{ need(6); doc.setTextColor(...INK); doc.text(T(n),M2+2,y); doc.text(T(fmt(scale(q,x.d),u)),W-M2,y,{align:"right"}); y+=5.5; });
      y+=4; doc.setFont("helvetica","bold"); doc.setFontSize(12); doc.text("Préparation",M2,y); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(10.5); getSteps(x.r.id).forEach((st,i)=>{ const lines=doc.splitTextToSize(T(st),W-2*M2-10); need(lines.length*5+3);
        doc.setFont("helvetica","bold"); doc.setTextColor(...ACC); doc.text(String(i+1)+".",M2,y); doc.setFont("helvetica","normal"); doc.setTextColor(...INK); doc.text(lines,M2+8,y); y+=lines.length*5+3; });
      if(x.r.astuce){ y+=2; need(10); doc.setFont("helvetica","italic"); doc.setTextColor(...WARM); doc.text(doc.splitTextToSize(T("Astuce : "+x.r.astuce),W-2*M2),M2,y); } }); }
  const n=doc.getNumberOfPages(); for(let k=1;k<=n;k++){ doc.setPage(k); const w=doc.internal.pageSize.getWidth(), h=doc.internal.pageSize.getHeight();
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(T(`Menus de la semaine · créé le ${new Date().toLocaleDateString("fr-BE")} · page ${k}/${n}`),w/2,h-5,{align:"center"}); }
  return doc.output("blob");
}
function menuMailto(){ const to=state.family.map(n=>state.emails[n]).filter(Boolean).join(",");
  let body=menuText(); if(body.length>1800) body=body.slice(0,1800)+"\n... (détails dans l'application)\n"+APP_URL;
  return "mailto:"+encodeURIComponent(to).replace(/%2C/g,",")+"?subject="+encodeURIComponent("Menus de la semaine du "+weekLabel())+"&body="+encodeURIComponent(body); }
function renderExportMenu(){ const c=sheetCtx, mails=state.family.map(n=>state.emails[n]).filter(Boolean), {ok,wait}=approvalStats();
  $("seyebrow").textContent=`Semaine du ${weekLabel()}`; $("stitle").textContent="Exporter et envoyer"; $("sextra").innerHTML="";
  $("sbody").innerHTML=`${exportKindChips()}
    <p class="note">Le menu jour par jour avec le plat, qui cuisine, le nombre de couverts, les absents et invités${state.family.length?`, puis qui a validé (${ok.length}/${state.family.length})`:""}${limiteTxt()?` et la date limite de réponse (${esc(limiteTxt())})`:""}.</p>
    <label class="xcheck"><input type="checkbox" id="xrec"${c.withRecipes?" checked":""}> Ajouter les recettes détaillées (ingrédients et étapes, une page par repas)</label>
    <div class="xopt"><div><b>En PDF</b><small>À imprimer ou à envoyer. Sur téléphone, le menu de partage s'ouvre : choisissez Mail, Messages ou WhatsApp.</small></div>
      <button class="btn primary big" data-xpdfmenu="1"${DL&&window.jspdf?"":" disabled"}>Créer le PDF</button>
      ${DL&&window.jspdf?"":`<small class="xwarn">L'export PDF n'est pas disponible dans cette vue. Ouvrez l'application depuis claude.ai ou l'app Claude.</small>`}</div>
    <div class="xopt"><div><b>Par e-mail</b><small>${mails.length?`À ${mails.length} membre${mails.length>1?"s":""} de la famille.`:"Ajoutez les adresses dans l'onglet Famille pour les remplir automatiquement."}${wait.length?` Pensez à relancer : ${esc(wait.join(", "))}.`:""}</small></div>
      <a class="btn big" href="${esc(menuMailto())}" target="_blank" rel="noopener" data-xmail="1">Préparer l'e-mail</a></div>
    <div class="xopt"><div><b>Par message</b><small>Le menu en texte, prêt à coller dans un SMS ou WhatsApp.</small></div>
      <button class="btn big" data-xcopymenu="1">Copier le texte</button></div>
    <textarea class="copybox" id="xtext" readonly hidden aria-label="Menu en texte"></textarea>`;
  $("sfoot").innerHTML=`<button class="btn primary big" data-sclose="1">Terminé</button>`; }
async function exportMenuPdf(btn){
  if(!DL||!window.jspdf){ toast("Export PDF indisponible ici"); return; }
  btn.disabled=true; btn.textContent="Création du PDF…";
  try{ const pdf=await buildMenuPdf(); const res=await DL.save({filename:`menu-semaine-${curIso()}.pdf`,data:pdf}); toast(res&&res.status==="shared"?"PDF partagé":"PDF téléchargé : joignez-le à un e-mail ou un message"); }
  catch(e){ const code=e&&e.code; toast(code==="declined"?"Export annulé":code==="rate_limited"?"Un export est déjà en cours, réessayez dans un instant":"Le PDF n'a pas pu être créé"); }
  btn.disabled=false; btn.textContent="Créer le PDF"; }
function handleExportClick(D,T){
  const c=sheetCtx;
  if(D.xkind){ c.kind=D.xkind; renderExport(); return true; }
  if(D.xpdfmenu){ exportMenuPdf(T); return true; }
  if(D.xcopymenu){ const txt=menuText(), box=$("xtext"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Menu copié : collez-le dans votre message"),()=>{box.hidden=false;box.focus();box.select();}); }catch(err){ box.hidden=false; box.focus(); box.select(); } return true; }
  if(D.xwhich){ c.which=D.xwhich; renderExport(); return true; }
  if(D.xpdf){ exportPdf(T); return true; }
  if(D.xcopy){ const txt=exportText(), box=$("xtext"); box.value=txt;
    try{ navigator.clipboard.writeText(txt).then(()=>toast("Liste copiée : collez-la dans votre message"),()=>{box.hidden=false;box.focus();box.select();toast("Sélectionnez le texte puis copiez-le");}); }catch(err){ box.hidden=false; box.focus(); box.select(); }
    return true; }
  if(D.xmail){ toast("Ouverture de votre messagerie…"); return false; }
  return false;
}
$("sheet").addEventListener("change",e=>{ if(!sheetCtx||sheetCtx.type!=="export") return; if(e.target.id==="xleft"){ sheetCtx.onlyLeft=e.target.checked; renderExport(); } if(e.target.id==="xrec"){ sheetCtx.withRecipes=e.target.checked; renderExport(); } });
$("export").onclick=()=>openSheet({type:"export",kind:"courses",which:"both",onlyLeft:true});

// ===================== Retours sur les repas et bilan =====================
// Échelle à 5 visages (échelle hédonique utilisée pour les enfants et les cantines),
// « à refaire ? » et quelques mots à cocher pour savoir quoi corriger.
const NOTES=[[1,"😖","Pas aimé du tout"],[2,"😕","Pas trop"],[3,"😐","Moyen"],[4,"🙂","Bon"],[5,"😋","Délicieux"]];
const REFAIRE=[["oui","À refaire"],["peut","Pourquoi pas"],["non","Plus jamais"]];
const MOTS=["Parfait comme ça","Trop salé","Fade","Trop épicé","Trop gras","Pas assez cuit","Trop cuit","Portion trop petite","Trop de restes","Trop long à faire"];
let RETOURS={}, SEMAINES={}, unsubRetours=null, unsubSemaines=null;
try{ const loc=JSON.parse(localStorage.getItem(KEY+"-retours")||"{}"); if(loc&&typeof loc==="object") RETOURS=loc; }catch(e){}
function saveRetoursLocal(){ try{ localStorage.setItem(KEY+"-retours",JSON.stringify(RETOURS)); }catch(e){} }
const slugNom = n => norm(n).replace(/ /g,"-").slice(0,30)||"x";
const retourId = (iso,d,n) => `${iso}_${d}_${slugNom(n)}`;
function cleanRetour(r){ if(!r||typeof r!=="object") return null; const note=+r.note; if(!(note>=1&&note<=5)) return null;
  if(typeof r.plat!=="string"||typeof r.semaine!=="string"||!/^\d{4}-\d\d-\d\d$/.test(r.semaine)) return null;
  return {semaine:r.semaine,jour:Math.max(0,Math.min(6,+r.jour||0)),plat:r.plat,nom:propre(r.nom,30),note:Math.round(note),
    refaire:["oui","peut","non"].includes(r.refaire)?r.refaire:null,mots:Array.isArray(r.mots)?r.mots.filter(m=>MOTS.includes(m)).slice(0,6):[],
    com:propre(r.com,200),quand:typeof r.quand==="string"?r.quand.slice(0,40):null,cuisinier:propre(r.cuisinier,30)||null}; }
function subscribeRetours(){ if(!DB) return; if(unsubRetours) unsubRetours();
  unsubRetours=DB.collection("retours").onSnapshot(q=>{ let ch=false;
    q.docChanges().forEach(c=>{ if(c.type==="removed"){ delete RETOURS[c.doc.id]; ch=true; return; } const r=cleanRetour(c.doc.data()); if(r){ RETOURS[c.doc.id]=r; ch=true; } });
    if(ch){ saveRetoursLocal(); renderRetours(); if(sheetCtx&&(sheetCtx.type==="bilan"||sheetCtx.type==="retour")) renderSheet(); } },()=>{});
  // toutes les semaines partagées, pour retrouver les repas déjà mangés
  if(unsubSemaines) unsubSemaines();
  unsubSemaines=DB.collection("semaines").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SEMAINES[c.doc.id]; else SEMAINES[c.doc.id]=c.doc.data(); }); renderRetours(); },()=>{});
}
// Repas déjà servis ces 14 derniers jours (le soir même à partir de 19 h)
function repasPasses(jours=14){
  const src={...state.weeks, ...SEMAINES}; src[curIso()]={...(src[curIso()]||{}),menu:state.week,cuisiniers:state.cooks,absents:state.absents,exterieur:state.exterieur};
  const now=new Date(), lim=new Date(TODAY); lim.setDate(lim.getDate()-jours); const out=[];
  Object.entries(src).forEach(([iso,w])=>{ if(!/^\d{4}-\d\d-\d\d$/.test(iso)||!w||!Array.isArray(w.menu)) return; const mon=isoDate(iso);
    const ext=outList(cleanDays(w.exterieur)); const cooks=Array.isArray(w.cuisiniers)?w.cuisiniers:(Array.isArray(w.cooks)?w.cooks:[]);
    w.menu.forEach((plat,d)=>{ if(!BYID[plat]||ext.includes(d)) return; const date=new Date(mon); date.setDate(mon.getDate()+d);
      if(date<lim) return; const soir=new Date(date); soir.setHours(19,0,0,0); if(soir>now) return;
      const abs=w.absents&&typeof w.absents==="object"?w.absents:{}; const pres=state.family.filter(n=>!(Array.isArray(abs[n])&&abs[n].includes(d)));
      out.push({iso,d,date,plat,pres,cuisinier:cooks[d]||null}); }); });
  return out.sort((a,b)=>b.date-a.date);
}
const retoursDu = (iso,d) => Object.values(RETOURS).filter(r=>r.semaine===iso&&r.jour===d);
async function enregistrerRetour(iso,d,nom,patch){
  const id=retourId(iso,d,nom), rp=repasPasses(21).find(x=>x.iso===iso&&x.d===d); if(!rp) return;
  const prev=RETOURS[id]||{semaine:iso,jour:d,plat:rp.plat,nom,note:null,refaire:null,mots:[],com:""};
  const next={...prev,...patch,plat:rp.plat,nom,cuisinier:rp.cuisinier,quand:new Date().toISOString(),par:ME||null};
  if(!next.note){ RETOURS[id]=next; renderSheet(); return; } // on attend la note avant d'enregistrer
  RETOURS[id]=cleanRetour(next); saveRetoursLocal(); renderRetours(); renderSheet();
  if(DB){ try{ await DB.collection("retours").doc(id).set({...cleanRetour(next),par:ME||null}); }catch(e){ toast("L'avis n'a pas pu être partagé, il reste sur cet appareil"); } }
}
// ---- Calculs du bilan ----
const moy = a => a.length? a.reduce((s,x)=>s+x,0)/a.length : null;
const ecart = a => { if(a.length<2) return 0; const m=moy(a); return Math.sqrt(moy(a.map(x=>(x-m)**2))); };
const n1 = v => v==null?"–":v.toLocaleString("fr-BE",{minimumFractionDigits:1,maximumFractionDigits:1});
function analyse(){
  const all=Object.values(RETOURS).filter(r=>r&&r.note&&BYID[r.plat]); const G=moy(all.map(r=>r.note))||3.5, K=2;
  const parPlat={}; all.forEach(r=>{ (parPlat[r.plat]=parPlat[r.plat]||[]).push(r); });
  const plats=Object.entries(parPlat).map(([id,l])=>{ const notes=l.map(r=>r.note), n=notes.length, m=moy(notes);
    const servi=new Set(l.map(r=>r.semaine+"-"+r.jour)).size, ref=l.filter(r=>r.refaire), oui=ref.filter(r=>r.refaire==="oui").length, non=ref.filter(r=>r.refaire==="non").length;
    const mots={}; l.forEach(r=>r.mots.forEach(w=>{ if(w!=="Parfait comme ça") mots[w]=(mots[w]||0)+1; }));
    const topMots=Object.entries(mots).sort((a,b)=>b[1]-a[1]).filter(([,c])=>c>=2||n<=3).slice(0,2).map(([w])=>w);
    const score=(n*m+K*G)/(n+K); // moyenne « prudente » : un seul avis ne suffit pas à classer un plat
    let cout=null; try{ const r=BYID[id]; const x=recipeCost(r,state.gamme,null)/Math.max(1,state.family.length||5); cout=isFinite(x)&&x>0?x:null; }catch(e){}
    return {id,nom:BYID[id].nom,n,m,score,servi,oui,non,refTot:ref.length,ecart:ecart(notes),topMots,cout,l}; });
  plats.forEach(p=>{ p.cat = p.n<2 ? "tot" : (p.ecart>=1.3&&p.n>=3) ? "divise" : p.score>=3.9 ? "sur" : p.score<=2.6 ? (p.servi<3?"retester":"retirer") : "ameliorer"; });
  const semaines={}; all.forEach(r=>{ (semaines[r.semaine]=semaines[r.semaine]||[]).push(r.note); });
  const tendance=Object.keys(semaines).sort().slice(-8).map(k=>({iso:k,m:moy(semaines[k]),n:semaines[k].length}));
  const passes=repasPasses(28), attendus=passes.reduce((s,p)=>s+p.pres.length,0), recus=passes.reduce((s,p)=>s+retoursDu(p.iso,p.d).filter(r=>r.note).length,0);
  const personnes=state.family.map(n=>{ const l=all.filter(r=>r.nom===n); const byP={}; l.forEach(r=>{ (byP[r.plat]=byP[r.plat]||[]).push(r.note); });
    const pl=Object.entries(byP).map(([id,v])=>({id,m:moy(v)})).sort((a,b)=>b.m-a.m);
    const mots={}; l.forEach(r=>r.mots.forEach(w=>{ mots[w]=(mots[w]||0)+1; }));
    const att=passes.filter(p=>p.pres.includes(n)).length, rec=passes.filter(p=>p.pres.includes(n)&&RETOURS[retourId(p.iso,p.d,n)]&&RETOURS[retourId(p.iso,p.d,n)].note).length;
    return {n,count:l.length,m:moy(l.map(r=>r.note)),top:pl.filter(x=>x.m>=4).slice(0,2),bas:pl.filter(x=>x.m<=2).slice(-2).reverse(),mot:Object.entries(mots).sort((a,b)=>b[1]-a[1])[0],part:att?rec/att:null}; });
  const coms=all.filter(r=>r.com).sort((a,b)=>String(b.quand).localeCompare(String(a.quand))).slice(0,6);
  const refTot=all.filter(r=>r.refaire), pctOui=refTot.length?refTot.filter(r=>r.refaire==="oui").length/refTot.length:null;
  return {all,G,plats,tendance,part:attendus?recus/attendus:null,recus,attendus,personnes,coms,pctOui};
}
// ---- Hit-parade : chaque avis compte comme un vote ----
function classement(avant){ const lim=avant?Date.now()-7*864e5:Infinity;
  const all=Object.values(RETOURS).filter(r=>r&&r.note&&BYID[r.plat]&&(!avant||(r.quand&&new Date(r.quand).getTime()<lim)));
  if(!all.length) return []; const G=moy(all.map(r=>r.note)), K=2, by={};
  all.forEach(r=>{ (by[r.plat]=by[r.plat]||[]).push(r); });
  return Object.entries(by).map(([id,l])=>{ const m=moy(l.map(r=>r.note)), ref=l.filter(r=>r.refaire);
    return {id,nom:BYID[id].nom,votes:l.length,m,score:(l.length*m+K*G)/(l.length+K),fans:[...new Set(l.filter(r=>r.note>=4).map(r=>r.nom))],
      pctOui:ref.length?ref.filter(r=>r.refaire==="oui").length/ref.length:null}; })
    .sort((a,b)=>b.score-a.score||b.votes-a.votes).map((x,i)=>({...x,rang:i+1}));
}
function hitParade(max=10){ const now=classement(false), prev=classement(true), pr={}; prev.forEach(x=>{ pr[x.id]=x.rang; });
  return now.slice(0,max).map(x=>({...x,avant:pr[x.id]||null})); }
function htmlHitParade(l,compact){ const med=["🥇","🥈","🥉"], aHisto=l.some(x=>x.avant!=null);
  return `<ol class="hp${compact?" compact":""}">${l.map(x=>{ const mv=!aHisto?"":x.avant==null?`<span class="hpmv new">nouveau</span>`:x.avant>x.rang?`<span class="hpmv up" title="${x.avant-x.rang} place${x.avant-x.rang>1?"s":""} gagnée${x.avant-x.rang>1?"s":""}">▲ ${x.avant-x.rang}</span>`:x.avant<x.rang?`<span class="hpmv down" title="${x.rang-x.avant} place${x.rang-x.avant>1?"s":""} perdue${x.rang-x.avant>1?"s":""}">▼ ${x.rang-x.avant}</span>`:`<span class="hpmv same" title="Même place que la semaine dernière">=</span>`;
    return `<li class="hprow"><span class="hprank">${x.rang<=3?med[x.rang-1]:x.rang}</span>${compact?"":`<img src="${photoSrc(x.id)}" alt="" data-cache-err="1">`}<span class="hpinfo"><b>${esc(x.nom)}</b><small>${n1(x.m)}/5 · ${x.votes} vote${x.votes>1?"s":""}${!compact&&x.pctOui!=null?` · ${Math.round(x.pctOui*100)} % à refaire`:""}${!compact&&x.fans.length?` · fans : ${x.fans.map(esc).join(", ")}`:""}</small></span>${mv}</li>`; }).join("")}</ol>`; }
// Influence sur les propositions de menus : bonus aux valeurs sûres, pause d'un mois pour les plats à retirer
function bonusRetours(r){ const l=Object.values(RETOURS).filter(x=>x.plat===r.id&&x.note); if(!l.length) return 0;
  const G=3.5, K=2, s=(l.length*moy(l.map(x=>x.note))+K*G)/(l.length+K);
  const dernier=l.map(x=>x.quand).sort().pop(), recent=dernier&&(Date.now()-new Date(dernier))<28*864e5;
  if(s<=2.6&&l.length>=2&&recent) return -4; return (s-3.5)*0.9; }
// ---- Affichage : invitation à noter (onglet Menu) et résumé (onglet Famille) ----
function renderRetours(){
  const box=$("retoursbox"), fam=$("retoursfam"); if(!box||!fam) return;
  const passes=repasPasses(4).filter(p=>p.pres.length), aNoter=passes.filter(p=>retoursDu(p.iso,p.d).filter(r=>r.note).length<p.pres.length).slice(0,3);
  if(!state.family.length||!aNoter.length){ box.hidden=true; }
  else { box.hidden=false; box.innerHTML=`<div class="rthead"><h2>C'était comment ?</h2><span class="note">Notez les derniers repas : les plats aimés reviendront plus souvent.</span></div>
    <div class="rtlist">${aNoter.map(p=>{ const nb=retoursDu(p.iso,p.d).filter(r=>r.note).length;
      return `<button class="rtitem" data-retour="${p.iso}|${p.d}"><img src="${photoSrc(p.plat)}" alt="" data-cache-err="1"><span><small>${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}</small><b>${esc(BYID[p.plat].nom)}</b><small>${nb?`${nb} avis sur ${p.pres.length}`:"Pas encore noté"}</small></span><span class="rtgo">Noter</span></button>`; }).join("")}</div>`; }
  const A=analyse();
  fam.innerHTML=`<div class="phead"><h2>Retours sur les repas</h2><button class="btn primary" data-bilan="1" data-tip="Classement des plats, goûts de chacun et conseils tirés des avis">Voir le bilan</button></div>
    ${A.all.length?`<div class="rtkpis"><div><b>${n1(A.G)}</b><small>note moyenne sur 5</small></div><div><b>${A.all.length}</b><small>avis donnés</small></div><div><b>${A.part==null?"–":Math.round(A.part*100)+" %"}</b><small>de participation (4 semaines)</small></div></div>`
      :`<p>Après chaque souper, chacun note le plat en un geste. Le bilan montre les valeurs sûres, les plats à ajuster et ceux qui divisent la famille.</p>`}
    ${A.all.length?`<h3 class="shopray">Le podium</h3>${htmlHitParade(hitParade(3),true)}`:""}
    <div class="actions"><button class="btn" data-retourslist="1">Noter un repas</button></div>`;
}
// ---- Fenêtre : noter un repas ----
function renderRetourSheet(){ const c=sheetCtx;
  if(c.list){ const l=repasPasses(14);
    $("seyebrow").textContent="Retours"; $("stitle").textContent="Noter un repas"; $("sextra").innerHTML="";
    $("sbody").innerHTML=l.length?`<div class="rtlist">${l.map(p=>{ const nb=retoursDu(p.iso,p.d).filter(r=>r.note).length;
      return `<button class="rtitem" data-retour="${p.iso}|${p.d}"><img src="${photoSrc(p.plat)}" alt="" data-cache-err="1"><span><small>${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}</small><b>${esc(BYID[p.plat].nom)}</b><small>${nb?`${nb} avis sur ${p.pres.length}`:"Pas encore noté"}</small></span><span class="rtgo">${nb>=p.pres.length?"Voir":"Noter"}</span></button>`; }).join("")}</div>`
      :`<p class="note">Aucun repas des deux dernières semaines pour l'instant. Les repas apparaissent ici le soir même, à partir de 19 h.</p>`;
    $("sfoot").innerHTML=`<button class="btn" data-bilan="1">Voir le bilan</button>`; return; }
  const p=repasPasses(21).find(x=>x.iso===c.iso&&x.d===c.d); if(!p){ closeSheet(); return; }
  const r=BYID[p.plat];
  $("seyebrow").textContent=`${JOURS[(p.date.getDay()+6)%7]} ${fmtShort(p.date)}`; $("stitle").textContent=r.nom; $("sextra").innerHTML="";
  $("sbody").innerHTML=`<p class="note">Chacun note pour lui, sur son téléphone ou ici. Une seule note suffit, le reste est facultatif.</p>
    ${p.pres.map(n=>{ const v=RETOURS[retourId(p.iso,p.d,n)]||{}, o=c.open===n||(!v.note&&!c.open);
      return `<section class="rtperson${v.note?" done":""}">
        <div class="rtname"><b>${esc(n)}</b>${v.note?`<span>${NOTES[v.note-1][1]} ${NOTES[v.note-1][2]}${v.refaire?" · "+REFAIRE.find(x=>x[0]===v.refaire)[1]:""}</span>`:""}</div>
        <div class="rtfaces" role="group" aria-label="Note de ${esc(n)}">${NOTES.map(([k,e,l])=>`<button class="rtface${v.note===k?" on":""}" data-rnote="${k}" data-rn="${esc(n)}" aria-label="${l}" title="${l}"><span>${e}</span><small>${l}</small></button>`).join("")}</div>
        ${v.note?`<div class="rtmore"${o||c.open===n?"":""}>
          <div class="gfilters">${REFAIRE.map(([k,l])=>`<button class="chip${v.refaire===k?" on":""}" data-rref="${k}" data-rn="${esc(n)}">${l}</button>`).join("")}</div>
          <div class="gfilters wrapchips">${MOTS.map(w=>`<button class="chip${(v.mots||[]).includes(w)?" on":""}" data-rmot="${esc(w)}" data-rn="${esc(n)}">${w}</button>`).join("")}</div>
          <div class="addrow"><input type="text" maxlength="200" data-rcom="${esc(n)}" value="${esc(v.com||"")}" placeholder="Un mot pour le cuisinier (facultatif)" aria-label="Commentaire de ${esc(n)}"><button class="btn" data-rcomok="${esc(n)}">OK</button></div>
        </div>`:""}
      </section>`; }).join("")}`;
  $("sfoot").innerHTML=`<button class="btn" data-retourslist="1">Autres repas</button><button class="btn primary" data-bilan="1">Voir le bilan</button>`;
}
// ---- Fenêtre : bilan ----
const CATS=[["sur","Les valeurs sûres","Bien notés par presque tout le monde : à garder dans la rotation."],
  ["ameliorer","À ajuster","Corrects, mais un détail revient dans les avis : il suffit souvent de changer la recette."],
  ["divise","Divise la famille","Adoré par les uns, pas aimé par les autres : à servir quand les amateurs sont là, ou avec une variante."],
  ["retester","À retester","Mal notés, mais servis moins de 3 fois. Les études montrent qu'un enfant accepte souvent un plat après 8 à 10 essais : changez un ingrédient et reproposez-le dans quelques semaines."],
  ["retirer","À retirer pour un temps","Mal notés à plusieurs reprises : ils ne seront plus proposés pendant un mois."],
  ["tot","Pas encore assez d'avis","Un seul avis : trop tôt pour juger."]];
function renderBilan(){ const A=analyse();
  $("seyebrow").textContent="Retours sur les repas"; $("stitle").textContent="Bilan des repas"; $("sextra").innerHTML="";
  $("sfoot").innerHTML=`<button class="btn" data-retourslist="1">Noter un repas</button>`;
  if(!A.all.length){ $("sbody").innerHTML=`<p>Pas encore d'avis. Après le souper, touchez « C'était comment ? » dans l'onglet Menu : chacun choisit un visage, c'est tout.</p>
    <p class="note">Le bilan apparaît dès les premiers avis. Il devient vraiment parlant après 2 ou 3 semaines.</p>`; return; }
  const maxM=5, reco=[];
  const surs=A.plats.filter(p=>p.cat==="sur").sort((a,b)=>b.score-a.score), adj=A.plats.filter(p=>p.cat==="ameliorer"&&p.topMots.length), ret=A.plats.filter(p=>p.cat==="retester");
  if(surs.length) reco.push(`Proposer plus souvent : <b>${surs.slice(0,3).map(p=>esc(p.nom)).join(", ")}</b>.`);
  adj.slice(0,2).forEach(p=>reco.push(`${esc(p.nom)} : souvent « ${esc(p.topMots[0].toLowerCase())} ». Adaptez la recette avant de le reproposer.`));
  if(ret.length) reco.push(`Retester plus tard, avec une variante : <b>${ret.slice(0,2).map(p=>esc(p.nom)).join(", ")}</b>.`);
  if(A.part!=null&&A.part<0.5) reco.push(`Seulement ${Math.round(A.part*100)} % des repas sont notés : rappelez à chacun que noter prend 2 secondes.`);
  const bonPasCher=A.plats.filter(p=>p.cout&&p.n>=2&&p.score>=3.6).sort((a,b)=>(b.score/b.cout)-(a.score/a.cout)).slice(0,3);
  $("sbody").innerHTML=`
    <div class="rtkpis"><div><b>${n1(A.G)}</b><small>note moyenne sur 5</small></div><div><b>${A.pctOui==null?"–":Math.round(A.pctOui*100)+" %"}</b><small>« à refaire »</small></div><div><b>${A.part==null?"–":Math.round(A.part*100)+" %"}</b><small>participation (4 semaines)</small></div><div><b>${A.all.length}</b><small>avis</small></div></div>
    <section class="rtsec"><h3>Hit-parade des plats</h3><p class="note">Chaque avis compte comme un vote. Le classement tient compte du nombre de votes ; les flèches comparent à la semaine dernière.</p>${htmlHitParade(hitParade(10),false)}</section>
    ${reco.length?`<section class="rtsec"><h3>Ce que je vous conseille</h3><ul class="rtreco">${reco.map(t=>`<li>${t}</li>`).join("")}</ul></section>`:""}
    ${A.tendance.length>1?`<section class="rtsec"><h3>Évolution par semaine</h3><div class="rttrend">${A.tendance.map(t=>`<div class="rtbar"><i style="height:${Math.round(t.m/maxM*100)}%"></i><b>${n1(t.m)}</b><small>${fmtShort(isoDate(t.iso))}</small></div>`).join("")}</div></section>`:""}
    ${CATS.map(([k,t,d])=>{ const l=A.plats.filter(p=>p.cat===k).sort((a,b)=>b.score-a.score); if(!l.length) return "";
      return `<section class="rtsec"><h3>${t} <span class="badge">${l.length}</span></h3><p class="note">${d}</p>
        <div class="rtplats">${l.map(p=>`<div class="rtplat"><img src="${photoSrc(p.id)}" alt="" data-cache-err="1"><span><b>${esc(p.nom)}</b>
          <small>${n1(p.m)}/5 · ${p.n} avis · servi ${p.servi} fois${p.refTot?` · ${Math.round(p.oui/p.refTot*100)} % à refaire`:""}${p.cout?` · ${eur(p.cout)}/pers.`:""}</small>
          ${p.topMots.length?`<small class="rtwarn">Souvent : ${p.topMots.map(esc).join(", ").toLowerCase()}</small>`:""}
          ${k==="divise"?`<small>${p.l.filter(r=>r.note>=4).map(r=>esc(r.nom)).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"–"} aiment · ${p.l.filter(r=>r.note<=2).map(r=>esc(r.nom)).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"–"} n'aiment pas</small>`:""}</span>
          <span class="rtscore" style="--p:${Math.round(p.m/5*100)}%">${n1(p.m)}</span></div>`).join("")}</div></section>`; }).join("")}
    ${bonPasCher.length?`<section class="rtsec"><h3>Bons et pas chers</h3><p class="note">Le meilleur rapport entre plaisir et prix par personne.</p><ol class="rtreco">${bonPasCher.map(p=>`<li><b>${esc(p.nom)}</b> : ${n1(p.m)}/5 pour ${eur(p.cout)} par personne</li>`).join("")}</ol></section>`:""}
    <section class="rtsec"><h3>Les goûts de chacun</h3><div class="rtpeople">${A.personnes.map(p=>`<div class="rtpers"><b>${esc(p.n)}</b>
      <small>${p.count?`${p.count} avis · moyenne ${n1(p.m)}/5`:"Pas encore d'avis"}${p.part!=null?` · note ${Math.round(p.part*100)} % de ses repas`:""}</small>
      ${p.top.length?`<small>Adore : ${p.top.map(x=>esc(BYID[x.id].nom)).join(", ")}</small>`:""}${p.bas.length?`<small>N'aime pas : ${p.bas.map(x=>esc(BYID[x.id].nom)).join(", ")}</small>`:""}
      ${p.mot&&p.mot[1]>=2&&p.mot[0]!=="Parfait comme ça"?`<small>Remarque souvent : ${esc(p.mot[0].toLowerCase())}</small>`:""}</div>`).join("")}</div></section>
    ${A.coms.length?`<section class="rtsec"><h3>Derniers commentaires</h3>${A.coms.map(r=>`<blockquote class="rtcom">« ${esc(r.com)} »<small>${esc(r.nom)} · ${esc(BYID[r.plat].nom)} · ${fmtShort(isoDate(r.semaine))}</small></blockquote>`).join("")}</section>`:""}
    <p class="note">Méthode : la note d'un plat est une moyenne prudente, qui tient compte du nombre d'avis, pour qu'un seul avis ne suffise pas à classer un plat. Les avis ne sont pas regroupés par cuisinier.</p>`;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-retour],[data-bilan],[data-retourslist],[data-rnote],[data-rref],[data-rmot],[data-rcomok]"); if(!b) return; const D=b.dataset;
  if(D.retour){ const [iso,d]=D.retour.split("|"); const ctx={type:"retour",iso,d:+d}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  if(D.bilan){ const ctx={type:"bilan"}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  if(D.retourslist){ const ctx={type:"retour",list:true}; sheetCtx?(sheetCtx=ctx,renderSheet(),$("sbody").scrollTop=0):openSheet(ctx); return; }
  const c=sheetCtx; if(!c||c.type!=="retour"||c.list) return; const n=D.rn;
  if(D.rnote){ enregistrerRetour(c.iso,c.d,n,{note:+D.rnote}); return; }
  const v=RETOURS[retourId(c.iso,c.d,n)]||{};
  if(D.rref){ enregistrerRetour(c.iso,c.d,n,{refaire:v.refaire===D.rref?null:D.rref}); return; }
  if(D.rmot){ const s=new Set(v.mots||[]); s.has(D.rmot)?s.delete(D.rmot):s.add(D.rmot); enregistrerRetour(c.iso,c.d,n,{mots:[...s]}); return; }
  if(D.rcomok!=null){ const inp=[...document.querySelectorAll("[data-rcom]")].find(x=>x.dataset.rcom===n); if(inp){ enregistrerRetour(c.iso,c.d,n,{com:inp.value.trim()}); toast("Commentaire enregistré"); } }
});



// ===================== Liste de courses : habituels, quantités, « j'en ai déjà », ticket réel =====================
let PLACARD={}, DEJA_LA=[];
// Les ajouts gardent l'identifiant de l'appareil : on affiche le prénom correspondant
const NOMS_PAR={}; let nomsDemandes=false;
function nomDe(par){ if(!/^[0-9a-f-]{20,}$/.test(par)) return par; if(NOMS_PAR[par]) return NOMS_PAR[par];
  if(!nomsDemandes&&USER&&USER.profiles){ nomsDemandes=true; const ids=[...new Set((state.extras||[]).map(x=>x.par).filter(x=>/^[0-9a-f-]{20,}$/.test(x)))];
    USER.profiles(ids).then(ps=>{ Object.entries(ps||{}).forEach(([id,p])=>{ if(p&&p.name) NOMS_PAR[id]=p.name; }); nomsDemandes=false; if(Object.keys(NOMS_PAR).length) renderCourses(); }).catch(()=>{ nomsDemandes=false; }); }
  return "un membre de la famille"; }
function subscribePlacard(){ if(!DB) return; DB.doc("famille/placard").onSnapshot(snap=>{ const d=snap.exists?snap.data():{}; const r={};
  if(d&&d.noms&&typeof d.noms==="object") Object.entries(d.noms).slice(0,200).forEach(([k,v])=>{ const n=propre(k,40); if(n) r[n]=typeof v==="string"?v.slice(0,10):""; });
  PLACARD=r; try{ localStorage.setItem(KEY+"-placard",JSON.stringify(r)); }catch(e){} renderCourses(); },()=>{}); }
try{ PLACARD=JSON.parse(localStorage.getItem(KEY+"-placard")||"{}")||{}; }catch(e){ PLACARD={}; }
async function majPlacard(n,garder){ const r={...PLACARD}; if(garder) r[n]=isoOf(TODAY); else delete r[n]; PLACARD=r;
  try{ localStorage.setItem(KEY+"-placard",JSON.stringify(r)); }catch(e){} renderCourses();
  if(DB){ try{ await DB.doc("famille/placard").set({noms:r}); }catch(e){ toast("Le changement n'a pas pu être partagé"); } } }
// Les courses habituelles : produits ajoutés le plus souvent, toutes semaines confondues
function habituels(){ const c=new Map(), add=(n,ray,qt,poids)=>{ const k=norm(n); if(!k) return; const o=c.get(k)||{n,ray,qt:"",c:0}; o.c+=poids; if(qt&&!o.qt) o.qt=qt; c.set(k,o); };
  Object.entries({...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})}).forEach(([iso,w])=>{ if(iso===curIso()) return; (w.extras||w.ajouts||[]).forEach(x=>x&&x.n&&add(x.n,x.ray,x.qt,2)); });
  (state.extras||[]).forEach(x=>add(x.n,x.ray,x.qt,0.5));
  Object.values(HISTO).forEach(h=>add(h.n,h.ray,h.qt,Math.min(3,(h.c||0)/2)));
  let l=[...c.values()].filter(x=>x.c>=1).sort((a,b)=>b.c-a.c).slice(0,14);
  if(l.length<6) ["Lait","Pain","Œufs","Yaourts","Beurre","Bananes","Pommes","Café","Eau plate","Papier toilette"].forEach(n=>{ if(l.length<12&&!l.some(x=>norm(x.n)===norm(n))) { const p=produitsConnus().find(x=>norm(x.n)===norm(n)); l.push({n,ray:p?p.ray:"epi",qt:"",c:0}); } });
  return l; }
function renderHabituels(){ const box=$("habituels"); if(!box) return; const l=habituels(), dans=new Set((state.extras||[]).map(x=>norm(x.n)));
  box.innerHTML=`<span class="habtitle">Courses habituelles</span>`+l.map((x,i)=>{ const ok=dans.has(norm(x.n));
    return `<button type="button" class="chip${ok?" on":""}" data-hab="${i}" ${ok?'aria-pressed="true"':""} data-tip="${ok?"Déjà dans la liste":"Ajouter à la liste"+(x.qt?" ("+esc(x.qt)+")":"")}">${ok?"✓":"+"} ${esc(x.n)}</button>`; }).join("");
  box._l=l; }
// Panneau « déjà à la maison » sous la liste
function renderDejaLa(){ const box=$("dejala"); if(!box) return; const autres=Object.keys(PLACARD).filter(n=>!DEJA_LA.some(x=>x.n===n));
  if(!DEJA_LA.length&&!autres.length){ box.hidden=true; return; } box.hidden=false;
  box.innerHTML=`<summary>Déjà à la maison <span class="badge">${DEJA_LA.length}</span></summary>
    <p class="note">Ces ingrédients ne sont plus mis sur la liste, cette semaine comme les suivantes. Touchez « Remettre » quand il faut en racheter.</p>
    <div class="dejalist">${DEJA_LA.map(x=>`<div><span><b>${esc(x.n)}</b><small>pour ${[...x.pour].join(", ").toLowerCase()}</small></span><button type="button" class="chip edit-only" data-remettre="${esc(x.n)}">Remettre sur la liste</button></div>`).join("")}
    ${autres.map(n=>`<div><span><b>${esc(n)}</b><small>pas utilisé cette semaine</small></span><button type="button" class="chip edit-only" data-remettre="${esc(n)}">Remettre</button></div>`).join("")}</div>`; }
// Modifier une quantité directement dans la liste
let qtOuvert=null;
function ouvrirQt(btn){ const k=btn.dataset.qedit; qtOuvert=k; const it=coursesTrips()[0].find(i=>i.k===k); if(!it) return;
  const cur=qtyOf(it), m=String(cur).match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  const span=btn.parentNode; span.innerHTML=`<span class="qtedit"><input type="text" inputmode="decimal" value="${esc(m?m[1]:cur)}" aria-label="Nouvelle quantité" maxlength="10"><select aria-label="Unité">${["","g","kg","cl","L","pièce(s)","paquet(s)","bouteille(s)","boîte(s)"].map(u=>`<option${m&&(m[2]===u||(u==="pièce(s)"&&!m[2]&&!it.x))?" selected":""} value="${u}">${u||"—"}</option>`).join("")}</select><button type="button" class="chip on" data-qok="${esc(k)}">OK</button>${state.qtEdit&&state.qtEdit[k]&&!it.x?`<button type="button" class="chip" data-qreset="${esc(k)}">Recette</button>`:""}</span>`;
  const inp=span.querySelector("input"); inp.focus(); inp.select();
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); span.querySelector("[data-qok]").click(); } if(e.key==="Escape"){ qtOuvert=null; renderCourses(); } }); }
function validerQt(k,span){ const it=coursesTrips()[0].find(i=>i.k===k); if(!it) return; const v=span.querySelector("input").value.trim(), u=span.querySelector("select").value;
  let q=v; const m=v.match(/^(\d+(?:[.,]\d+)?)$/); if(m&&u){ let n=parseFloat(m[1].replace(",",".")), un=u; if(un==="g"&&n>=1000){ n/=1000; un="kg"; } if(un==="cl"&&n>=100){ n/=100; un="L"; } q=`${String(Math.round(n*100)/100).replace(".",",")} ${un}`; }
  q=propre(q,20);
  if(it.x){ const x=(state.extras||[]).find(y=>y.id===it.id); if(x) x.qt=q; }
  else { state.qtEdit={...(state.qtEdit||{})}; if(q) state.qtEdit[k]=q; else delete state.qtEdit[k]; }
  qtOuvert=null; save(); renderCourses(); toast(q?`${it.n} : ${q}`:`${it.n} : quantité effacée`); }
// Photos de tickets : lues par la mise à jour du lundi et du mercredi, elles alimentent la base des prix réels
let TICKETS_PH={};
function cleanTicketPh(x){ if(!x||typeof x!=="object") return null; const r=x.resultat&&typeof x.resultat==="object"?x.resultat:{};
  const jr=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):"";
  return {semaine:jr(x.semaine),quand:typeof x.quand==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(x.quand)?x.quand:"",par:propre(x.par,30),mag:typeof x.mag==="string"?x.mag.replace(/[<>"'`]/g,"").slice(0,40):"",
    lie:!!x.lie,statut:["attente","analyse","illisible"].includes(x.statut)?x.statut:"attente",aPhoto:typeof x.photo==="string",
    res:{total:+r.total>0?Math.round(+r.total*100)/100:null,articles:+r.articles>0?Math.round(+r.articles):null,magasin:propre(r.magasin,50),date:jr(r.date),reconnus:+r.reconnus>=0?Math.round(+r.reconnus):null,note:propre(r.note,200)}}; }
function subscribeTicketsPh(){ if(!DB) return; DB.collection("tickets").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete TICKETS_PH[c.doc.id]; else { const v=cleanTicketPh(c.doc.data()); if(v) TICKETS_PH[c.doc.id]=v; } }); if(state.tab==="courses") renderTicket(); },()=>{}); }
function compresserTicket(file){ return new Promise((ok,ko)=>{ const img=new Image(), url=URL.createObjectURL(file);
  img.onload=()=>{ URL.revokeObjectURL(url); const essai=(max,q)=>{ const m=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement("canvas");
      c.width=Math.round(img.naturalWidth*m); c.height=Math.round(img.naturalHeight*m); const x=c.getContext("2d"); x.filter="grayscale(1) contrast(1.15)"; x.drawImage(img,0,0,c.width,c.height); return c.toDataURL("image/jpeg",q); };
    for(const [max,q] of [[2000,0.6],[1800,0.5],[1600,0.45],[1400,0.4],[1200,0.4]]){ const d=essai(max,q); if(d.length<370000) return ok(d); } ko(new Error("trop lourde")); };
  img.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error("image")); }; img.src=url; }); }
async function envoyerTicketPhoto(file){ if(!DB){ toast("L'envoi de photos demande le partage avec la famille"); return; }
  let photo; try{ photo=await compresserTicket(file); }catch(e){ toast("Cette photo n'a pas pu être préparée : essayez de la recadrer sur le ticket"); return; }
  const v=parseFloat((($("tk-montant")||{}).value||"").replace(",",".").replace(/[^\d.]/g,"")), mag=($("tk-mag")||{}).value||"", nom=(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  const id=curIso()+"-"+Date.now().toString(36);
  try{ await DB.collection("tickets").doc(id).set({semaine:curIso(),photo,quand:new Date().toISOString(),par:nom,mag,lie:v>0,statut:"attente"}); }
  catch(e){ toast("La photo n'a pas pu être envoyée. Réessayez dans un instant."); return; }
  if(v>0&&v<5000){ state.tickets=[...(state.tickets||[]),{montant:Math.round(v*100)/100,mag,quand:new Date().toISOString(),estime:Math.round(weekCost(state.gamme)*100)/100,par:nom}]; save(); }
  toast("Photo du ticket envoyée : elle sera lue lundi ou mercredi"); renderTicket(); }
document.addEventListener("change",e=>{ if(e.target.id!=="tk-photo") return; const f=e.target.files&&e.target.files[0]; if(f) envoyerTicketPhoto(f); e.target.value=""; });
document.addEventListener("click",async e=>{ const b=e.target.closest("[data-tphdel]"); if(!b) return; try{ await DB.collection("tickets").doc(b.dataset.tphdel).delete(); toast("Photo de ticket supprimée"); }catch(err){ toast("Seul le propriétaire peut supprimer une photo de ticket"); } });
// Ticket de caisse réel
function renderTicket(){ const box=$("ticketbox"); if(!box) return;
  const ph=Object.entries(TICKETS_PH).filter(([,x])=>x.semaine===curIso()).sort((a,b)=>String(b[1].quand).localeCompare(String(a[1].quand)));
  const est=weekCost(state.gamme), tk=state.tickets||[], tot=tk.reduce((s,x)=>s+x.montant,0)+ph.filter(([,x])=>!x.lie&&x.res.total).reduce((s,[,x])=>s+x.res.total,0);
  const hist=Object.entries({...state.weeks,...(typeof SEMAINES==="object"?SEMAINES:{})}).map(([iso,w])=>{ const t=cleanTickets(w.tickets); return {iso,reel:t.reduce((s,x)=>s+x.montant,0),est:t.find(x=>x.estime)?t.find(x=>x.estime).estime:null}; })
    .filter(x=>x.reel>0&&/^\d{4}-\d\d-\d\d$/.test(x.iso)); const hm=new Map(hist.map(x=>[x.iso,x])); if(tot>0) hm.set(curIso(),{iso:curIso(),reel:tot,est});
  const h=[...hm.values()].sort((a,b)=>a.iso.localeCompare(b.iso)).slice(-8), max=Math.max(1,...h.map(x=>Math.max(x.reel,x.est||0)));
  const ecart=tot>0?tot-est:null, moisCle=isoOf(TODAY).slice(0,7), mois=[...hm.values()].filter(x=>x.iso.slice(0,7)===moisCle).reduce((s,x)=>s+x.reel,0);
  box.innerHTML=`<summary>Ticket de caisse <span class="badge">${tot>0?eur(tot):"à noter"}</span></summary>
    <p class="note">Notez le montant réel après les courses : l'application compare au budget estimé (${eur(est)} cette semaine, gamme ${GAMMES[state.gamme].nom.toLowerCase()}).</p>${Object.keys(PRIX_REELS).length?`<p class="note">Base des prix réels : ${Object.keys(PRIX_REELS).length} ingrédients chiffrés d'après vos tickets.</p>`:""}
    <form class="addrow" id="ticketform"><input id="tk-montant" type="text" inputmode="decimal" placeholder="Montant payé (ex. 87,45)" aria-label="Montant du ticket en euros" maxlength="9"><select id="tk-mag" aria-label="Magasin">${(()=>{ let pm=""; try{ pm=MAGNOM[planTrip(0,coursesTrips()[0]).primary]; }catch(e){} return orderedStores().map(m=>`<option value="${esc(m.nom)}"${m.nom===pm?" selected":""}>${esc(m.nom)}</option>`).join(""); })()}<option value="">Autre</option></select><button class="btn primary edit-only" type="submit">Noter</button></form>
    <label class="btn tkphoto edit-only" data-tip="Photographiez le ticket entier : il sera lu lundi ou mercredi pour enrichir la base des prix réels">📷 Photo du ticket<input id="tk-photo" type="file" accept="image/*" capture="environment" hidden></label>
    ${ph.length?`<div class="tklist">${ph.map(([id,x])=>`<div><span><b>${x.statut==="analyse"?`Ticket lu${x.res.total?" : "+eur(x.res.total):""}`:x.statut==="illisible"?"Ticket illisible":"Photo en attente de lecture"}</b>
      <small>${esc(x.res.magasin||x.mag||"")}${x.res.date?" · "+new Date(x.res.date).toLocaleDateString("fr-BE"):x.quand?" · envoyée le "+new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.res.articles?` · ${x.res.articles} articles`:""}${x.res.reconnus!=null?`, ${x.res.reconnus} ajoutés à la base des prix`:""}${x.statut==="attente"?" · lecture lundi ou mercredi":""}${x.par?" · "+esc(x.par):""}</small>${x.res.note?`<small>${esc(x.res.note)}</small>`:""}</span>
      <button type="button" class="sbtn owner-only" data-tphdel="${esc(id)}" aria-label="Supprimer cette photo de ticket">×</button></div>`).join("")}</div>`:""}
    ${tk.length?`<div class="tklist">${tk.map((x,i)=>`<div><span><b>${eur(x.montant)}</b><small>${esc(x.mag||"Magasin")} · ${x.quand?new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.par?" · "+esc(x.par):""}</small></span><button type="button" class="sbtn edit-only" data-tkdel="${i}" aria-label="Supprimer ce ticket">×</button></div>`).join("")}</div>
      <p class="tkecart ${ecart>0?"plus":"moins"}">Total ${eur(tot)} · estimé ${eur(est)} · ${ecart>0?`${eur(ecart)} de plus que prévu`:`${eur(-ecart)} de moins que prévu`}${ecart>0&&(state.extras||[]).length?` (dont ${state.extras.length} produits ajoutés hors recettes)`:""}</p>`:""}
    ${h.length?`<h3 class="shopray">Semaine après semaine</h3><div class="tkbars">${h.map(x=>`<div class="tkbar" title="Réel ${eur(x.reel)}${x.est?", estimé "+eur(x.est):""}"><span class="tkcols"><i class="r" style="height:${Math.round(x.reel/max*100)}%"></i>${x.est?`<i class="e" style="height:${Math.round(x.est/max*100)}%"></i>`:""}</span><b>${Math.round(x.reel)} €</b><small>${fmtShort(isoDate(x.iso))}</small></div>`).join("")}</div>
      <p class="note"><i class="leg r"></i> réel <i class="leg e"></i> estimé · ce mois-ci : ${eur(mois)} dépensés</p>`:""}`; }
document.addEventListener("submit",e=>{ if(e.target.id!=="ticketform") return; e.preventDefault(); const v=parseFloat(($("tk-montant").value||"").replace(",",".").replace(/[^\d.]/g,""));
  if(!(v>0&&v<5000)){ toast("Indiquez le montant du ticket, par exemple 87,45"); return; }
  const nom=(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  state.tickets=[...(state.tickets||[]),{montant:Math.round(v*100)/100,mag:$("tk-mag").value,quand:new Date().toISOString(),estime:Math.round(weekCost(state.gamme)*100)/100,par:nom}];
  save(); renderTicket(); toast(`Ticket de ${eur(v)} noté`); });
document.addEventListener("click",e=>{
  const h=e.target.closest("[data-hab]"); if(h){ const x=($("habituels")._l||[])[+h.dataset.hab]; if(!x) return; if((state.extras||[]).some(y=>norm(y.n)===norm(x.n))){ toast(`${x.n} est déjà dans la liste`); return; } ajouterProduit(x.n,x.ray,x.qt||""); return; }
  const q=e.target.closest("[data-qedit]"); if(q){ e.preventDefault(); e.stopPropagation(); if(document.body.classList.contains("readonly")) return; ouvrirQt(q); return; }
  const ok=e.target.closest("[data-qok]"); if(ok){ e.preventDefault(); e.stopPropagation(); validerQt(ok.dataset.qok,ok.closest(".qtedit")); return; }
  const rs=e.target.closest("[data-qreset]"); if(rs){ e.preventDefault(); e.stopPropagation(); const k=rs.dataset.qreset; state.qtEdit={...(state.qtEdit||{})}; delete state.qtEdit[k]; qtOuvert=null; save(); renderCourses(); toast("Quantité de la recette rétablie"); return; }
  if(e.target.closest(".qtedit")){ e.preventDefault(); e.stopPropagation(); return; }
  const dj=e.target.closest("[data-deja]"); if(dj){ e.preventDefault(); e.stopPropagation(); const n=dj.dataset.deja; majPlacard(n,true); toast(`${n} : noté comme déjà à la maison`,()=>majPlacard(n,false),"Annuler"); return; }
  const re=e.target.closest("[data-remettre]"); if(re){ const n=re.dataset.remettre; majPlacard(n,false); toast(`${n} remis sur la liste`); return; }
  const td=e.target.closest("[data-tkdel]"); if(td){ state.tickets=(state.tickets||[]).filter((_,i)=>i!==+td.dataset.tkdel); save(); renderTicket(); toast("Ticket supprimé"); return; }
},true);

// ===================== Propositions de recettes par la famille =====================
// Un lien, une envie en quelques mots, ou la photo d'une recette : la tâche du lundi et du mercredi en fait une recette de la bibliothèque.
let SUGG={}, unsubSugg=null, suggForm={type:"lien",photo:null};
function cleanSugg(x){ if(!x||typeof x!=="object") return null; const st=["attente","ajoutee","refusee"].includes(x.statut)?x.statut:"attente";
  return {nom:propre(x.nom,30),type:["lien","envie","photo"].includes(x.type)?x.type:"envie",texte:propre(x.texte,600),
    url:typeof x.url==="string"&&/^https?:\/\/[^\s"<>]{3,400}$/.test(x.url)?x.url:"",photo:typeof x.photo==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.photo)&&x.photo.length<380000?x.photo:null,
    quand:typeof x.quand==="string"?x.quand.slice(0,40):"",statut:st,recette:typeof x.recette==="string"&&/^[a-z0-9]{2,40}$/.test(x.recette)?x.recette:null,note:propre(x.note,300)}; }
function subscribeSugg(){ if(!DB) return; if(unsubSugg) unsubSugg();
  unsubSugg=DB.collection("suggestions").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SUGG[c.doc.id]; else { const v=cleanSugg(c.doc.data()); if(v) SUGG[c.doc.id]=v; } }); if(state.tab==="envies") renderEnvies(); },()=>{}); }
function compresserPhoto(file){ return new Promise((ok,ko)=>{ const img=new Image(), url=URL.createObjectURL(file);
  img.onload=()=>{ let w=img.naturalWidth, h=img.naturalHeight, m=Math.min(1,1400/Math.max(w,h)); const c=document.createElement("canvas"); c.width=Math.round(w*m); c.height=Math.round(h*m);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); let q=0.75, d=c.toDataURL("image/jpeg",q);
    while(d.length>330000&&q>0.3){ q-=0.1; d=c.toDataURL("image/jpeg",q); } if(d.length>370000){ const c2=document.createElement("canvas"); c2.width=Math.round(c.width*0.7); c2.height=Math.round(c.height*0.7); c2.getContext("2d").drawImage(c,0,0,c2.width,c2.height); d=c2.toDataURL("image/jpeg",0.6); }
    ok(d); }; img.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error("image")); }; img.src=url; }); }
function htmlSuggestions(){ const qui=envQui||(window.__acces&&window.__acces()&&window.__acces().nom)||"";
  const T=[["lien","🔗 Un lien internet"],["envie","💬 Une envie, une idée"],["photo","📷 La photo d'une recette"]], f=suggForm;
  const liste=Object.entries(SUGG).sort((a,b)=>String(b[1].quand).localeCompare(String(a[1].quand)));
  return `<div class="panel" id="suggbox"><h2>Proposer une recette</h2>
    <p>Un plat que vous aimeriez manger ? Donnez un lien vers une recette, décrivez votre envie (« des lasagnes végétariennes », « un plat thaï pas trop épicé ») ou photographiez une page de livre. Les propositions sont ajoutées à la bibliothèque le lundi ou le mercredi.</p>
    <div class="gfilters wrapchips">${T.map(([k,l])=>`<button class="chip${f.type===k?" on":""}" data-sgtype="${k}" type="button">${l}</button>`).join("")}</div>
    <form class="addrform" id="suggform" autocomplete="off">
      ${f.type==="lien"?`<label class="wfield">Lien de la recette<input id="sg-url" type="url" inputmode="url" maxlength="400" placeholder="https://www.exemple.be/recette-de-…" required></label>`:""}
      ${f.type==="photo"?`<label class="wfield">Photo de la recette<input id="sg-photo" type="file" accept="image/*" capture="environment"></label>${f.photo?`<img class="sgprev" src="${f.photo}" alt="Aperçu de la photo">`:""}`:""}
      <label class="wfield">${f.type==="envie"?"Votre envie":"Un mot sur cette recette (facultatif)"}<textarea id="sg-texte" rows="3" maxlength="600" placeholder="${f.type==="envie"?"Ex. : un gratin de chicons, des wraps végétariens, quelque chose avec du saumon…":"Ex. : on l'a mangée chez mamie, sans les champignons pour les enfants"}"${f.type==="envie"?" required":""}></textarea></label>
      <label class="wfield">Proposé par<select id="sg-nom" class="pick">${state.family.map(n=>`<option${n===qui?" selected":""}>${esc(n)}</option>`).join("")}<option value="">Quelqu'un de la famille</option></select></label>
      <button class="btn primary edit-only" type="submit">Envoyer la proposition</button>
    </form>
    ${liste.length?`<h3 class="shopray">Propositions de la famille (${liste.length})</h3><div class="sglist">${liste.map(([id,x])=>{ const r=x.recette&&BYID[x.recette];
      const st=x.statut==="ajoutee"?`<span class="bdg b-eco">Ajoutée</span>`:x.statut==="refusee"?`<span class="bdg b-plaisir">Pas retenue</span>`:`<span class="bdg b-moyen">En attente</span>`;
      return `<div class="sgitem">${x.photo?`<img src="${x.photo}" alt="">`:`<span class="sgicon" aria-hidden="true">${x.type==="lien"?"🔗":"💬"}</span>`}<span class="sginfo"><b>${esc(x.texte||x.url||"Photo d'une recette")}</b>
        <small>${st} ${esc(x.nom||"Quelqu'un")} · ${x.quand?new Date(x.quand).toLocaleDateString("fr-BE"):""}${x.url?` · <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">voir le lien</a>`:""}</small>
        ${r?`<small>Devenue : <button class="link" data-openrec="${r.id}" type="button">${esc(r.nom)}</button></small>`:x.statut==="ajoutee"?`<small>La recette arrive à la prochaine mise à jour.</small>`:""}${x.note?`<small>${esc(x.note)}</small>`:""}</span>
        <button class="sbtn owner-only" data-sgdel="${esc(id)}" type="button" aria-label="Supprimer cette proposition">×</button></div>`; }).join("")}</div>`:""}
  </div>`; }
document.addEventListener("click",async e=>{ const o=e.target.closest("#suggbox [data-openrec]"); if(o){ openMeal(o.dataset.openrec,null); return; }
  const o2=e.target.closest("[data-openrec2]"); if(o2){ openMeal(o2.dataset.openrec2,null); return; }
  const b=e.target.closest("[data-sgtype],[data-sgdel]"); if(!b) return;
  if(b.dataset.sgtype){ suggForm={type:b.dataset.sgtype,photo:null}; renderEnvies(); return; }
  if(b.dataset.sgdel){ const id=b.dataset.sgdel; if(!DB) { delete SUGG[id]; renderEnvies(); return; } try{ await DB.collection("suggestions").doc(id).delete(); toast("Proposition supprimée"); }catch(err){ toast("Seul le propriétaire peut supprimer une proposition"); } } });
document.addEventListener("change",async e=>{ if(e.target.id!=="sg-photo") return; const f=e.target.files&&e.target.files[0]; if(!f) return;
  try{ suggForm.photo=await compresserPhoto(f); renderEnvies(); const s=$("suggbox"); if(s) s.scrollIntoView({block:"start"}); }catch(err){ toast("Cette photo n'a pas pu être lue"); } });
document.addEventListener("submit",async e=>{ if(e.target.id!=="suggform") return; e.preventDefault();
  const f=suggForm, texte=($("sg-texte")||{}).value||"", url=(($("sg-url")||{}).value||"").trim(), nom=($("sg-nom")||{}).value||"";
  if(f.type==="lien"&&!/^https?:\/\/\S{3,}$/.test(url)){ toast("Collez le lien complet de la recette (il commence par https://)"); return; }
  if(f.type==="photo"&&!f.photo){ toast("Choisissez d'abord une photo"); return; }
  if(f.type==="envie"&&texte.trim().length<3){ toast("Décrivez votre envie en quelques mots"); return; }
  const doc=cleanSugg({nom,type:f.type,texte,url,photo:f.photo,quand:new Date().toISOString(),statut:"attente"}); const id=Date.now().toString(36)+"-"+slugNom(nom||"famille");
  if(!DB){ SUGG[id]=doc; suggForm={type:f.type,photo:null}; renderEnvies(); toast("Proposition notée sur cet appareil (partage non activé)"); return; }
  try{ await DB.collection("suggestions").doc(id).set(doc); suggForm={type:f.type,photo:null}; toast("Merci ! Votre proposition sera ajoutée lundi ou mercredi"); }
  catch(err){ toast("La proposition n'a pas pu être envoyée. Réessayez dans un instant."); } });

// ===================== Envies : sondage, goûts de chacun et plannings suggérés =====================
const ENVIE=[[1,"😍","J'en ai envie"],[0,"😐","Bof"],[-1,"🙅","Non merci"]];
const PREF_VEGE=[[0,"Jamais"],[1,"1 soir"],[2,"2 soirs ou plus"]];
const PREF_NEW=[["classiques","Nos classiques"],["unpeu","Un peu de nouveau"],["beaucoup","Beaucoup de nouveautés"]];
const PREF_PIQ=[["non","Pas épicé"],["unpeu","Un peu"],["oui","J'aime le piquant"]];
let SONDAGE={}, unsubSondage=null;
try{ const loc=JSON.parse(localStorage.getItem(KEY+"-sondage")||"{}"); if(loc&&typeof loc==="object") SONDAGE=loc; }catch(e){}
const saveSondageLocal=()=>{ try{ localStorage.setItem(KEY+"-sondage",JSON.stringify(SONDAGE)); }catch(e){} };
function cleanSondage(x){ if(!x||typeof x!=="object"||typeof x.nom!=="string") return null; const env={};
  if(x.envies&&typeof x.envies==="object") Object.entries(x.envies).forEach(([k,v])=>{ if(BYID[k]&&[1,0,-1].includes(v)) env[k]=v; });
  const p=x.prefs&&typeof x.prefs==="object"?x.prefs:{};
  return {nom:propre(x.nom,30),envies:env,quand:typeof x.quand==="string"?x.quand:null,
    prefs:{cuisines:Array.isArray(p.cuisines)?p.cuisines.filter(c=>CUISINES[c]):[],vege:[0,1,2].includes(p.vege)?p.vege:null,
      nouveautes:PREF_NEW.some(([k])=>k===p.nouveautes)?p.nouveautes:null,piquant:PREF_PIQ.some(([k])=>k===p.piquant)?p.piquant:null}}; }
function subscribeSondage(){ if(!DB) return; if(unsubSondage) unsubSondage();
  unsubSondage=DB.collection("sondage").onSnapshot(q=>{ q.docChanges().forEach(c=>{ if(c.type==="removed") delete SONDAGE[c.doc.id]; else { const v=cleanSondage(c.doc.data()); if(v) SONDAGE[c.doc.id]=v; } });
    saveSondageLocal(); if(state.tab==="envies") renderEnvies(); },()=>{}); }
const sondageDe = n => SONDAGE[slugNom(n)] || {nom:n,envies:{},prefs:{cuisines:[],vege:null,nouveautes:null,piquant:null},quand:null};
let envWrite={};
function majSondage(n,fn){ const cur=JSON.parse(JSON.stringify(sondageDe(n))); fn(cur); cur.nom=n; cur.quand=new Date().toISOString();
  const id=slugNom(n); SONDAGE[id]=cleanSondage(cur); saveSondageLocal(); renderEnvies();
  if(DB){ clearTimeout(envWrite[id]); envWrite[id]=setTimeout(()=>{ DB.collection("sondage").doc(id).set(SONDAGE[id]).catch(()=>toast("Réponse gardée sur cet appareil : le partage a échoué")); },600); } }
// ---- Ce que l'on sait des goûts de chacun ----
function servisIds(){ const s=new Set(); Object.values({...state.weeks,...SEMAINES}).forEach(w=>{ if(w&&Array.isArray(w.menu)) w.menu.forEach(id=>s.add(id)); }); Object.values(RETOURS).forEach(r=>s.add(r.plat)); return s; }
function profil(n){ const sd=sondageDe(n), mine=Object.values(RETOURS).filter(r=>r.nom===n&&r.note&&BYID[r.plat]);
  const parC={}, parP={}; mine.forEach(r=>{ const x=BYID[r.plat]; if(x.c)(parC[x.c]=parC[x.c]||[]).push(r.note); if(x.p)(parP[x.p]=parP[x.p]||[]).push(r.note); });
  Object.entries(sd.envies).forEach(([id,v])=>{ const x=BYID[id]; if(x&&x.c&&v!==0)(parC[x.c]=parC[x.c]||[]).push(v>0?4.5:1.5); });
  const cuis=Object.fromEntries(Object.entries(parC).map(([k,v])=>[k,moy(v)])), prot=Object.fromEntries(Object.entries(parP).map(([k,v])=>[k,moy(v)]));
  const nbAvis=Object.keys(state.avis).filter(id=>(state.avis[id]||{})[n]).length;
  return {sd,mine,cuis,prot,signaux:mine.length+Object.keys(sd.envies).length+nbAvis+(sd.prefs.cuisines.length?3:0)}; }
const PIQUANT=new Set(["chili","sincarne","fajitas","tacos","couscous","kefta","arrabbiata","curry","dahl","pouletcurry"]);
// Affinité d'une personne pour un plat : retours (le plus fiable), goûts déclarés, sondage, cuisines et viandes aimées
function affinite(n,r,P){ P=P||profil(n); let a=0, w=0;
  const notes=P.mine.filter(x=>x.plat===r.id).map(x=>x.note); if(notes.length){ a+=(moy(notes)-3)*1.1*Math.min(1,notes.length/2+0.3); w++; }
  const av=(state.avis[r.id]||{})[n]; if(av){ a+=av*0.9; w++; }
  const e=P.sd.envies[r.id]; if(e!=null){ a+=e===1?0.9:e===-1?-1.2:-0.1; w++; }
  if(r.c&&P.sd.prefs.cuisines.includes(r.c)) a+=0.4; if(r.c&&P.cuis[r.c]!=null) a+=(P.cuis[r.c]-3)*0.25; if(r.p&&P.prot[r.p]!=null) a+=(P.prot[r.p]-3)*0.2;
  if((state.exclus[n]||[]).some(x=>r.ing.some(([i])=>i===x))) a-=2.5;
  if(P.sd.prefs.piquant==="non"&&PIQUANT.has(r.id)) a-=0.5; if(P.sd.prefs.piquant==="oui"&&PIQUANT.has(r.id)) a+=0.3;
  return a; }
function scoreFamille(r,profs){ const fam=state.family; if(!fam.length) return 0; profs=profs||Object.fromEntries(fam.map(n=>[n,profil(n)]));
  const v=fam.map(n=>affinite(n,r,profs[n])); return moy(v)+Math.min(0,Math.min(...v)+1)*0.6; }
// préférences de groupe : nouveautés et soirs sans viande (moyenne des réponses)
function prefsGroupe(){ const l=state.family.map(n=>sondageDe(n).prefs); const nv=l.map(p=>({classiques:0,unpeu:1,beaucoup:2})[p.nouveautes]).filter(x=>x!=null), vg=l.map(p=>p.vege).filter(x=>x!=null);
  return {nouveautes:nv.length?moy(nv):1,vege:vg.length?Math.round(moy(vg)):null}; }
// ---- Plannings suggérés pour les semaines à venir ----
let PLANS={}, envCible=1, envQui=null;
try{ envQui=localStorage.getItem(KEY+"-moi"); }catch(e){}
function genPlans(off){ const profs=Object.fromEntries(state.family.map(n=>[n,profil(n)])), fam={}; RECETTES.forEach(r=>{ fam[r.id]=scoreFamille(r,profs); });
  const servis=servisIds(), G=prefsGroupe(), avoid=new Set(state.week);
  const novel=r=>!servis.has(r.id), cost=r=>{ try{ return r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0)/5; }catch(e){ return 2; } };
  const vegeBonus=r=>G.vege&&(r.p==="vege"||r.p==="oeufs")?0.6*G.vege:0;
  const defs=[
    {k:"famille",t:"Le préféré de la famille",d:"Les plats qui plaisent au plus grand nombre, d'après les retours et le sondage.",x:r=>fam[r.id]*2.2+vegeBonus(r)},
    {k:"decouverte",t:"Découverte",d:`Deux ou trois plats jamais servis, choisis parmi ceux qui font envie.`,x:r=>fam[r.id]*1.4+(novel(r)?1.2+0.6*G.nouveautes:0)+vegeBonus(r)},
    {k:"budget",t:"Petit budget",d:"Surtout des plats économiques, sans renoncer à ce que la famille aime.",x:r=>fam[r.id]*1.2-cost(r)*1.3+vegeBonus(r),mix:{plaisir:0,moyen:1}}];
  return defs.map(D=>{ const menu=proposeMenu({extra:D.x,mix:D.mix,avoid,out:outList(null)}); return {...D,menu}; }); }
function evalPlan(menu){ const home=[0,1,2,3,4,5,6].filter(d=>!outList(null).includes(d)), profs=Object.fromEntries(state.family.map(n=>[n,profil(n)]));
  let ok=0, tot=0, cout=0; const rows=home.map(d=>{ const r=BYID[menu[d]], aff=state.family.map(n=>[n,affinite(n,r,profs[n])]);
    aff.forEach(([,a])=>{ tot++; if(a>-0.2) ok++; }); try{ cout+=r.ing.reduce((s,[n,q,u,ray])=>s+itemCost(n,u,q,ray,"eco"),0); }catch(e){}
    return {d,r,fans:aff.filter(([,a])=>a>=0.6).map(([n])=>n),contre:aff.filter(([,a])=>a<=-0.8).map(([n])=>n)}; });
  return {rows,satis:tot?ok/tot:null,cout}; }
function renderEnvies(){ const box=$("view-envies"); if(!box) return;
  const fam=state.family; if(!envQui||!fam.includes(envQui)) envQui=fam.find(n=>window.__acces&&window.__acces()&&norm(window.__acces().nom)===norm(n))||null;
  if(!fam.length){ box.innerHTML=`<div class="panel"><h2>Envies</h2><p>Ajoutez d'abord les membres de la famille dans l'onglet Famille : chacun pourra ensuite répondre au sondage.</p></div>`; return; }
  const repondu=fam.filter(n=>Object.keys(sondageDe(n).envies).length>=5||sondageDe(n).prefs.cuisines.length);
  const lundi=o=>{ const m=new Date(BASE_MONDAY); m.setDate(m.getDate()+7*o); return m; };
  const key=envCible+"|"+state.family.join(","); if(!PLANS[key]) PLANS[key]=genPlans(envCible);
  // --- 1. Le sondage ---
  let html=`<div class="panel"><div class="phead"><h2>Sondage des envies</h2><span class="st ${repondu.length===fam.length?"on":"soon"}">${repondu.length}/${fam.length} ont répondu</span></div>
    <p>Chacun dit ce qui lui fait envie. Les réponses, avec les avis donnés après les repas, guident les menus proposés.</p>
    <div class="wfield">Qui répond ?<div class="gfilters">${fam.map(n=>`<button class="chip${envQui===n?" on":""}" data-envqui="${esc(n)}">${esc(n)}${repondu.includes(n)?" ✓":""}</button>`).join("")}</div></div>
    <div class="actions"><button class="btn" id="envinvite">Copier l'invitation au sondage</button></div>`;
  if(envQui){ const sd=sondageDe(envQui), p=sd.prefs;
    const q=(lab,k,opts,cur)=>`<div class="envq"><b>${lab}</b><div class="gfilters wrapchips">${opts.map(([v,l])=>`<button class="chip${cur===v?" on":""}" data-envpref="${k}" data-v="${v}">${l}</button>`).join("")}</div></div>`;
    html+=`<h3 class="shopray">${esc(envQui)}, vos préférences</h3>
      <div class="envq"><b>Les cuisines que vous aimez</b><div class="gfilters wrapchips">${Object.entries(CUISINES).map(([k,l])=>`<button class="chip${p.cuisines.includes(k)?" on":""}" data-envcuis="${k}">${l}</button>`).join("")}</div></div>
      ${q("Soirs sans viande par semaine","vege",PREF_VEGE,p.vege)}${q("Nouveautés","nouveautes",PREF_NEW,p.nouveautes)}${q("Épicé","piquant",PREF_PIQ,p.piquant)}`;
    // 8 plats à la fois : d'abord ceux sur lesquels on ne sait encore rien
    const P=profil(envQui), servis=servisIds();
    const inconnus=RECETTES.filter(r=>sd.envies[r.id]==null&&!(state.avis[r.id]||{})[envQui]&&!P.mine.some(x=>x.plat===r.id));
    const tri=inconnus.map(r=>({r,s:(servis.has(r.id)?0:1)+(r.c&&p.cuisines.includes(r.c)?0.5:0)+((r.id.charCodeAt(0)*7+r.id.length*13+(envCible))%10)/10})).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.r);
    const nbRep=Object.keys(sd.envies).length;
    html+=`<h3 class="shopray">Ces plats vous font-ils envie ? <span class="badge">${nbRep} réponse${nbRep>1?"s":""}</span></h3>
      ${tri.length?`<div class="envgrid">${tri.map(r=>`<div class="envcard"><img src="${photoSrc(r.id)}" alt="" loading="lazy" data-cache-err="1"><div class="envtxt"><b>${esc(r.nom)}</b><small><span class="bdg b-${budgetOf(r)}">${BUDGETS[budgetOf(r)].court}</span> ${r.t} min${r.c?" · "+CUISINES[r.c]:""}${servis.has(r.id)?"":" · jamais servi"}</small></div>
        <div class="envbtns">${ENVIE.map(([v,e,l])=>`<button class="envbtn" data-envie="${r.id}" data-v="${v}" title="${l}" aria-label="${l} : ${esc(r.nom)}"><span>${e}</span><small>${l}</small></button>`).join("")}</div></div>`).join("")}</div>
        <p class="note">Chaque réponse fait apparaître un nouveau plat. Revenez quand vous voulez : les nouvelles recettes de la bibliothèque s'ajoutent ici.</p>`
      :`<p class="note">Vous avez donné votre avis sur toutes les recettes. Merci !</p>`}
      ${nbRep?`<details class="homeadv"><summary>Revoir mes réponses (${nbRep})</summary><div class="envmine">${Object.entries(sd.envies).map(([id,v])=>`<span class="chip on" data-envreset="${id}">${ENVIE.find(x=>x[0]===v)[1]} ${esc(BYID[id].nom)} ×</span>`).join("")}</div><p class="note">Touchez une réponse pour l'effacer.</p></details>`:""}`;
  } else html+=`<p class="note">Choisissez votre prénom pour répondre.</p>`;
  html+=`</div>`;
  html+=htmlSuggestions();
  // --- 2. Les goûts de chacun ---
  // Ce que disent les réponses au sondage, tous ensemble
  const votes={}; fam.forEach(n=>Object.entries(sondageDe(n).envies).forEach(([id,v])=>{ if(!BYID[id]) return; (votes[id]=votes[id]||{plus:[],moins:[]}); if(v===1) votes[id].plus.push(n); if(v===-1) votes[id].moins.push(n); }));
  const unan=Object.entries(votes).filter(([,v])=>v.plus.length>=Math.min(3,Math.max(2,repondu.length-1))&&!v.moins.length).sort((a,b)=>b[1].plus.length-a[1].plus.length);
  const divise=Object.entries(votes).filter(([,v])=>v.plus.length&&v.moins.length).sort((a,b)=>(b[1].plus.length+b[1].moins.length)-(a[1].plus.length+a[1].moins.length));
  const rejet=Object.entries(votes).filter(([,v])=>v.moins.length>=2&&v.moins.length>v.plus.length);
  const pasRep=fam.filter(n=>!repondu.includes(n));
  if(Object.keys(votes).length) html+=`<div class="panel"><h2>Ce que dit le sondage</h2>
    <p class="note">${repondu.length} réponse${repondu.length>1?"s":""} sur ${fam.length}${pasRep.length?` · pas encore répondu : ${pasRep.map(esc).join(", ")}`:""}. Les menus proposés en tiennent compte.</p>
    ${unan.length?`<h3 class="shopray">Font l'unanimité</h3><div class="envmine">${unan.slice(0,12).map(([id,v])=>`<button class="chip on" data-openrec2="${id}" type="button">😍 ${esc(BYID[id].nom)} · ${v.plus.length}</button>`).join("")}</div>`:""}
    ${divise.length?`<h3 class="shopray">Divisent la famille</h3><div class="sondiv">${divise.slice(0,8).map(([id,v])=>`<div><b>${esc(BYID[id].nom)}</b><small>👍 ${v.plus.map(esc).join(", ")} · 👎 ${v.moins.map(esc).join(", ")}</small></div>`).join("")}</div><p class="note">À servir quand les amateurs sont là, ou avec une variante.</p>`:""}
    ${rejet.length?`<h3 class="shopray">À éviter</h3><p>${rejet.map(([id,v])=>`${esc(BYID[id].nom)} (${v.moins.map(esc).join(", ")})`).join(" · ")}</p>`:""}
  </div>`;
  html+=`<div class="panel"><h2>Les goûts de chacun</h2><p class="note">Ce profil se précise à chaque avis et chaque réponse au sondage.</p><div class="rtpeople">${fam.map(n=>{ const P=profil(n);
    const cu=Object.entries(P.cuis).filter(([,m])=>m>=3.8).sort((a,b)=>b[1]-a[1]).map(([k])=>CUISINES[k]); P.sd.prefs.cuisines.forEach(c=>{ if(!cu.includes(CUISINES[c])) cu.push(CUISINES[c]); });
    const aff=RECETTES.map(r=>({r,a:affinite(n,r,P)})).sort((a,b)=>b.a-a.a), top=aff.filter(x=>x.a>=0.8).slice(0,3), bas=aff.filter(x=>x.a<=-0.8).slice(-3).reverse();
    const fiab=P.signaux>=25?"bien connu":P.signaux>=8?"en cours":"à découvrir";
    return `<div class="rtpers"><b>${esc(n)} <span class="bdg ${P.signaux>=25?"b-eco":P.signaux>=8?"b-moyen":"b-plaisir"}">Profil ${fiab}</span></b>
      <small>${P.signaux} indice${P.signaux>1?"s":""} : ${P.mine.length} avis sur des repas, ${Object.keys(P.sd.envies).length} réponses au sondage</small>
      ${cu.length?`<small>Cuisines aimées : ${cu.slice(0,4).join(", ")}</small>`:""}
      ${top.length?`<small>Envies : ${top.map(x=>esc(x.r.nom)).join(", ")}</small>`:""}
      ${bas.length?`<small class="rtwarn">À éviter : ${bas.map(x=>esc(x.r.nom)).join(", ")}</small>`:""}
      ${P.sd.prefs.vege!=null?`<small>Sans viande : ${PREF_VEGE.find(x=>x[0]===P.sd.prefs.vege)[1].toLowerCase()} par semaine</small>`:""}</div>`; }).join("")}</div></div>`;
  // --- 3. Plannings suggérés ---
  html+=`<div class="panel"><div class="phead"><h2>Plannings suggérés</h2><button class="btn" id="envregen" data-tip="Calcule trois nouveaux plannings">Autres suggestions</button></div>
    <div class="gfilters">${[1,2,3].map(o=>`<button class="chip${envCible===o?" on":""}" data-envweek="${o}">Semaine du ${fmtShort(lundi(o))}</button>`).join("")}</div>
    <p class="note">Trois façons d'organiser la semaine, selon les goûts connus aujourd'hui. Chaque planning respecte les règles de budget et de variété.</p>
    <div class="plans">${PLANS[key].map((pl,i)=>{ const E=evalPlan(pl.menu);
      return `<article class="plan"><div class="planhead"><b>${pl.t}</b><span class="planstats">${E.satis!=null?`${Math.round(E.satis*100)} % d'assiettes appréciées`:""} · ≈ ${eur(E.cout)}</span></div><p class="note">${pl.d}</p>
        <ol class="planlist">${E.rows.map(x=>`<li><span class="pday">${JOURS[x.d].slice(0,3)}</span><span class="pinfo"><b>${esc(x.r.nom)}</b><small><span class="bdg b-${budgetOf(x.r)}">${BUDGETS[budgetOf(x.r)].court}</span>${x.r.c?" "+CUISINES[x.r.c]:""}${x.fans.length?` · plaira à ${x.fans.map(esc).join(", ")}`:""}</small>${x.contre.length?`<small class="rtwarn">${x.contre.map(esc).join(", ")} : pas trop envie</small>`:""}</span></li>`).join("")}</ol>
        <div class="actions"><button class="btn primary edit-only" data-envuse="${i}">Utiliser pour la semaine du ${fmtShort(lundi(envCible))}</button></div></article>`; }).join("")}</div></div>`;
  box.innerHTML=html;
}
document.addEventListener("click",e=>{ const b=e.target.closest("[data-envqui],[data-envpref],[data-envcuis],[data-envie],[data-envreset],[data-envweek],#envregen,[data-envuse],#envinvite"); if(!b) return; const D=b.dataset;
  if(D.envqui){ envQui=D.envqui; try{ localStorage.setItem(KEY+"-moi",envQui); }catch(err){} renderEnvies(); return; }
  if(D.envpref){ const k=D.envpref, v=k==="vege"?+D.v:D.v; majSondage(envQui,s=>{ s.prefs[k]=s.prefs[k]===v?null:v; }); PLANS={}; return; }
  if(D.envcuis){ majSondage(envQui,s=>{ const c=new Set(s.prefs.cuisines); c.has(D.envcuis)?c.delete(D.envcuis):c.add(D.envcuis); s.prefs.cuisines=[...c]; }); PLANS={}; return; }
  if(D.envie){ majSondage(envQui,s=>{ s.envies[D.envie]=+D.v; }); PLANS={}; return; }
  if(D.envreset){ majSondage(envQui,s=>{ delete s.envies[D.envreset]; }); PLANS={}; return; }
  if(D.envweek){ envCible=+D.envweek; renderEnvies(); return; }
  if(b.id==="envregen"){ PLANS={}; renderEnvies(); toast("Nouvelles suggestions"); return; }
  if(b.id==="envinvite"){ const t=`Petit sondage pour les menus : dites quels plats vous font envie (2 minutes) !\n${(window.INVITE_URL||APP_URL).replace(/#.*$/,"")}#envies`;
    try{ navigator.clipboard.writeText(t).then(()=>toast("Invitation copiée : collez-la dans WhatsApp ou un SMS"),()=>toast(t)); }catch(err){ toast(t); } return; }
  if(D.envuse!=null){ const pl=PLANS[envCible+"|"+state.family.join(",")]; if(!pl) return; const menu=pl[+D.envuse].menu, prev=state.weekOffset;
    goWeek(envCible); state.week=[...menu]; state.statut="proposition"; save(); render(); setTab("menu");
    toast(`Planning « ${pl[+D.envuse].t} » placé sur la semaine du ${weekLabel()}`,()=>{ goWeek(prev); },"Revenir"); }
});

// ===================== Données mises à jour par la tâche du lundi et du mercredi =====================
const PRIX_REELS={}; // ingrédients dont le prix vient de vos tickets
// donnees/promos.json : promos relevées dans les folders ; donnees/recettes.json : nouvelles recettes de la bibliothèque
const txtOk = (v,max) => typeof v==="string" ? cleanTxt(v).slice(0,max) : "";
function accepterRecette(x){
  if(!x||typeof x!=="object"||typeof x.id!=="string"||!/^[a-z][a-z0-9]{2,30}$/.test(x.id)||BYID[x.id]) return null;
  const ing=(Array.isArray(x.ing)?x.ing:[]).filter(i=>Array.isArray(i)&&typeof i[0]==="string").slice(0,15)
    .map(([n,q,u,ray])=>[txtOk(n,40),Math.max(0,+q||0),typeof u==="string"?txtOk(u,12):"",RAYKEYS.includes(ray)?ray:"epi"]).filter(i=>i[0]);
  const etapes=(Array.isArray(x.etapes)?x.etapes:[]).map(e=>txtOk(e,400)).filter(Boolean).slice(0,8);
  if(ing.length<2||etapes.length<2) return null;
  return {id:x.id,nom:txtOk(x.nom,60)||"Recette",acc:txtOk(x.acc,60),t:Math.max(5,Math.min(30,+x.t||30)),
    b:["eco","moyen","plaisir"].includes(x.b)?x.b:undefined,p:PROT[x.p]?x.p:undefined,f:FECU[x.f]?x.f:undefined,c:CUISINES[x.c]?x.c:undefined,
    astuce:txtOk(x.astuce,200),ing,etapes,nouveau:true,
    source:x.source&&typeof x.source.url==="string"&&/^https:\/\//.test(x.source.url)?{titre:txtOk(x.source.titre,80),url:x.source.url.slice(0,300)}:null,
    ajoute:typeof x.ajoute==="string"&&/^\d{4}-\d\d-\d\d$/.test(x.ajoute)?x.ajoute:null, proposePar:propre(x.propose_par,30)||null};
}
async function chargerDonnees(){
  const lire=async f=>{ try{ const r=await fetch(f+"?v="+Date.now(),{cache:"no-store"}); return r.ok?await r.json():null; }catch(e){ return null; } };
  const [P,R,X]=await Promise.all([lire("donnees/promos.json"),lire("donnees/recettes.json"),lire("donnees/prix.json")]); let ch=false;
  if(X&&Array.isArray(X.releves)){ const lim=new Date(TODAY); lim.setDate(lim.getDate()-120); const par={};
    X.releves.slice(-5000).forEach(r=>{ if(!r||typeof r.ing!=="string"||!(+r.prixUnitaire>0)||!["kg","L","u"].includes(r.unite)||!/^\d{4}-\d\d-\d\d$/.test(r.date||"")||isoDate(r.date)<lim) return;
      const k=r.ing+"|"+r.unite; (par[k]=par[k]||[]).push({p:+r.prixUnitaire,mag:ENS[r.mag]?r.mag:null}); });
    Object.entries(par).forEach(([k,l])=>{ const [ing,un]=k.split("|"); const ref=PRIX[ing]; if(ref&&ref[1]!==un) return;
      const v=l.map(x=>x.p).sort((a,b)=>a-b), med=v[Math.floor(v.length/2)]; PRIX[ing]=[Math.round(med*100)/100,un]; PRIX_REELS[ing]={n:l.length,mags:[...new Set(l.map(x=>x.mag).filter(Boolean))]}; ch=true; }); }
  if(P&&Array.isArray(P.promos)){
    const l=P.promos.filter(x=>x&&ENS[x.mag]&&typeof x.ing==="string"&&+x.prix>0&&/^\d{4}-\d\d-\d\d$/.test(x.du||"")&&/^\d{4}-\d\d-\d\d$/.test(x.au||""))
      .slice(0,400).map(x=>({mag:x.mag,produit:txtOk(x.produit,80),prix:+x.prix,avant:+x.avant>0?+x.avant:null,du:x.du,au:x.au,ing:txtOk(x.ing,40)}));
    if(l.length){ PROMOS.length=0; PROMOS.push(...l); if(typeof P.releve==="string") RELEVE=txtOk(P.releve,40); ch=true; }
  }
  if(R&&Array.isArray(R.recettes)){
    if(R.prix&&typeof R.prix==="object") Object.entries(R.prix).forEach(([k,v])=>{ if(!PRIX[k]&&Array.isArray(v)&&+v[0]>0&&["kg","L","u"].includes(v[1])) PRIX[k]=[+v[0],v[1]]; });
    R.recettes.slice(0,1500).forEach(x=>{ const r=accepterRecette(x); if(!r) return; RECETTES.push(r); BYID[r.id]=r; ETAPES[r.id]=r.etapes; ch=true; });
  }
  if(ch){ render(); if(state.tab==="envies"&&typeof renderEnvies==="function") renderEnvies(); }
}
chargerDonnees();

// ===================== Visite guidée (première ouverture sur un appareil) =====================
const VISITE=[
 {sel:null,t:"Bienvenue !",p:"Voici une visite rapide de l'application des menus de la famille. Elle dure une minute. Vous pourrez la revoir dans Réglages, rubrique Aide."},
 {sel:"#acompleter",t:"Ce qu'il reste à faire",p:"Les soirs sans cuisinier ou sans repas prévu s'affichent ici. Choisissez qui cuisine directement dans la liste. Tant qu'il manque quelque chose, le menu ne peut pas être validé."},
 {sel:"#weekbar .wtop",t:"La semaine",p:"Les flèches passent d'une semaine à l'autre. Vous pouvez préparer jusqu'à trois semaines à l'avance."},
 {sel:"#share",t:"Prévenir la famille",p:"Prépare un message avec le menu et le lien de l'application, à envoyer par WhatsApp ou SMS."},
 {sel:"#weekbar .appr",t:"Chacun valide",p:"Chaque membre indique qu'il est d'accord avec le menu. Le propriétaire peut fixer une date limite de réponse, puis valider le menu final."},
 {sel:"#days .day",t:"Les repas",p:"Touchez un jour pour voir la recette, les courses du plat, changer de plat, choisir qui cuisine ou noter une absence. Les étiquettes Éco, Moyen et Plaisir indiquent le budget."},
 {sel:"#tab-courses",t:"Les courses",p:"La liste se fait toute seule, groupée par magasin et par rayon, en deux passages par semaine. Le mode magasin permet de cocher en avançant dans les rayons."},
 {sel:"#tab-famille",t:"La famille",p:"Qui est là chaque soir, qui cuisine, les goûts de chacun, et les avis donnés après les repas."},
 {sel:"#tab-envies",t:"Vos envies",p:"Répondez au sondage : dites quels plats vous font envie. Les menus proposés en tiennent compte, et des plannings sont suggérés pour les semaines suivantes."},
 {sel:"#tab-reglages",t:"Les réglages",p:"Votre adresse et vos magasins, les jours de courses, les recettes de la famille et l'accès des membres."},
 {sel:null,t:"C'est parti !",p:"Passez la souris sur un bouton (ou gardez le doigt appuyé sur mobile) pour savoir à quoi il sert. Bon appétit !"}];
let visite=null;
function visiteFin(){ if(!visite) return; visite.els.forEach(e=>e.remove()); visite=null; try{ localStorage.setItem(KEY+"-visite","1"); }catch(e){} document.removeEventListener("keydown",visiteClavier,true); window.removeEventListener("resize",visitePlacer); }
function visiteClavier(e){ if(!visite) return; if(e.key==="Escape"){ e.stopPropagation(); visiteFin(); } if(e.key==="ArrowRight"||e.key==="Enter"){ e.preventDefault(); visiteAller(visite.i+1); } if(e.key==="ArrowLeft") visiteAller(visite.i-1); }
function visiteEtapes(){ return VISITE.filter(x=>{ if(!x.sel) return true; const el=document.querySelector(x.sel); return el&&el.offsetParent!==null&&el.getClientRects().length; }); }
function visitePlacer(){ if(!visite) return; const x=visite.etapes[visite.i], [voile,trou,bulle]=visite.els; const el=x.sel&&document.querySelector(x.sel);
  if(el){ const r=el.getBoundingClientRect(), m=6; Object.assign(trou.style,{left:(r.left-m)+"px",top:(r.top-m)+"px",width:(r.width+2*m)+"px",height:(r.height+2*m)+"px",opacity:1});
    const bh=bulle.offsetHeight, bw=bulle.offsetWidth; let y=r.bottom+14; if(y+bh>innerHeight-10) y=Math.max(10,r.top-bh-14); if(y<10) y=10;
    bulle.style.left=Math.max(12,Math.min(innerWidth-bw-12,r.left+r.width/2-bw/2))+"px"; bulle.style.top=y+"px"; }
  else { Object.assign(trou.style,{left:(innerWidth/2)+"px",top:(innerHeight/2)+"px",width:"0px",height:"0px"}); bulle.style.left=Math.max(12,(innerWidth-bulle.offsetWidth)/2)+"px"; bulle.style.top=Math.max(20,(innerHeight-bulle.offsetHeight)/2)+"px"; } }
function visiteAller(i){ if(!visite) return; if(i<0) return; if(i>=visite.etapes.length){ visiteFin(); return; } visite.i=i; const x=visite.etapes[i], bulle=visite.els[2], n=visite.etapes.length;
  bulle.innerHTML=`<h3>${x.t}</h3><p>${x.p}</p><div class="tour-pied"><small>${i+1} / ${n}</small><span class="actions">${i>0?`<button class="btn" data-tour="prev" type="button">Précédent</button>`:`<button class="btn" data-tour="fin" type="button">Passer</button>`}<button class="btn primary" data-tour="next" type="button">${i===n-1?"Terminer":"Suivant"}</button></span></div>`;
  const el=x.sel&&document.querySelector(x.sel); if(el){ const r=el.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-90) window.scrollBy({top:r.top-innerHeight/3,behavior:"instant"}); }
  requestAnimationFrame(visitePlacer); setTimeout(()=>{ const b=bulle.querySelector('[data-tour="next"]'); if(b) b.focus(); },50); }
function lancerVisite(){ if(visite) return; if(sheetCtx) closeSheet(); if(modalCtx) closeMeal(); setTab("menu"); window.scrollTo(0,0);
  const voile=document.createElement("div"), trou=document.createElement("div"), bulle=document.createElement("div");
  voile.className="tour-voile"; trou.className="tour-trou"; bulle.className="tour-bulle"; bulle.setAttribute("role","dialog"); bulle.setAttribute("aria-label","Visite guidée");
  document.body.append(voile,trou,bulle); visite={i:0,els:[voile,trou,bulle],etapes:visiteEtapes()};
  voile.addEventListener("click",()=>visiteAller(visite.i+1));
  bulle.addEventListener("click",e=>{ const b=e.target.closest("[data-tour]"); if(!b) return; const a=b.dataset.tour; if(a==="next") visiteAller(visite.i+1); else if(a==="prev") visiteAller(visite.i-1); else visiteFin(); });
  document.addEventListener("keydown",visiteClavier,true); window.addEventListener("resize",visitePlacer); visiteAller(0); }
let visiteEssais=0;
function peutEtreVisite(){ let fait=null; try{ fait=localStorage.getItem(KEY+"-visite"); }catch(e){ return; } if(fait) return;
  const g=document.getElementById("gate"); if((g&&!g.hidden)||sheetCtx||modalCtx||!state.family.length){ if(++visiteEssais<40) setTimeout(peutEtreVisite,3000); return; }
  lancerVisite(); }
$("retour-visite").onclick=()=>lancerVisite();
setTimeout(peutEtreVisite,2500);

// démarrage du partage (silencieux si la page n'est pas partagée)
(async()=>{
  try{
    if(!window.claude||!window.claude.use) { setSync("local"); setTimeout(maybeWizard,300); return; }
    const [db,u,dl]=await Promise.all([window.claude.use("db"),window.claude.use("user"),window.claude.use("downloads")]);
    DL=dl; if(sheetCtx&&sheetCtx.type==="export") renderExport();
    USER=u; if(!db){ setSync("local"); setTimeout(maybeWizard,300); return; }
    DB=db; ME=u?await u.id():null;
    const c=u?await u.can("data.write"):null; CAN_WRITE=c;
    window.__dbReady=true;
    IS_OWNER = u ? await u.isOwner() : true; if(!IS_OWNER) document.body.classList.add("notowner");
    DB.doc("validations/menus").onSnapshot(snap=>{ const dd=snap.exists?snap.data():{}; VALID=(dd.semaines&&typeof dd.semaines==="object")?{...dd.semaines}:{}; LIMITES=(dd.limites&&typeof dd.limites==="object")?{...dd.limites}:{}; applyValidation(); saveLocal(); render(); },()=>{});
    if(c===false){ document.body.classList.add("readonly"); }
    subscribeRecettes(); subscribeGouts(); subscribeWeek(); subscribeFamily(); subscribeRetours(); subscribeSondage(); subscribeSugg(); subscribeGoogle(); subscribePlacard(); subscribeTicketsPh();
    setTimeout(maybeWizard,1500);
  }catch(e){ setSync("local"); setTimeout(maybeWizard,300); }
})();
$("reset").onclick=()=>{state.week=state.weekOffset===0?[...DEFAUT]:proposeMenu();state.persons=state.family.length||5;state.checked={};state.cooks=Array(7).fill(null);state.picking=null;save();render();toast("Menu proposé rétabli");};

// ---- Ajout manuel de produits à la liste de courses, avec aide à la saisie ----
const CATALOGUE = {
 fl:["Pommes","Poires","Bananes","Oranges","Clémentines","Citrons","Kiwis","Raisins","Fraises","Avocats","Concombre","Salade","Tomates cerises","Ail","Échalotes","Persil","Ciboulette","Basilic","Radis","Brocoli","Chou-fleur","Melon","Ananas","Mangues","Myrtilles"],
 bou:["Jambon","Saucisson","Salami","Pâté","Filet de dinde","Filet de poulet","Haché","Américain","Boulettes","Poulet entier","Côtelettes de porc","Steaks"],
 cre:["Lait","Beurre","Margarine","Yaourts","Yaourts aux fruits","Fromage blanc","Skyr","Crème fraîche","Œufs","Gouda","Emmental râpé","Brie","Fromage à tartiner","Desserts lactés","Lait d'avoine","Crème soja"],
 bl:["Pain","Pain gris","Pain blanc","Baguette","Pistolets","Croissants","Couques","Pain de mie","Cramique","Sandwichs"],
 epi:["Café","Café en grains","Dosettes de café","Thé","Sucre","Farine","Sel","Poivre","Huile d'olive","Huile de tournesol","Vinaigre","Moutarde","Mayonnaise","Ketchup","Confiture","Choco","Miel","Céréales","Flocons d'avoine","Biscuits","Speculoos","Gaufres","Chocolat","Chips","Cacahuètes","Riz","Pâtes","Sauce tomate","Thon","Maïs","Compote","Bouillon","Épices","Levure","Cacao","Lait UHT","Croquettes pour chat","Croquettes pour chien"],
 boi:["Eau plate","Eau pétillante","Jus d'orange","Jus de pomme","Limonade","Soda","Coca","Ice tea","Sirop","Bière","Vin","Bières spéciales","Vin rouge","Vin blanc","Vin rosé","Chocolat chaud"],
 sur:["Frites surgelées","Glace","Légumes surgelés","Pizza surgelée","Poisson pané","Épinards surgelés","Croquettes de pommes de terre","Fruits rouges surgelés"],
 dro:["Papier toilette","Essuie-tout","Mouchoirs","Liquide vaisselle","Tablettes lave-vaisselle","Sel lave-vaisselle","Lessive","Adoucissant","Sacs poubelle","Éponges","Papier aluminium","Film alimentaire","Sacs congélation","Dentifrice","Brosses à dents","Shampoing","Après-shampoing","Gel douche","Savon","Déodorant","Coton-tiges","Cotons démaquillants","Rasoirs","Serviettes hygiéniques","Couches","Lingettes","Produit WC","Nettoyant multi-usage","Eau de Javel","Piles","Ampoules"]
};
const HKEY="menus-courses-historique";
let HISTO={}; try{ HISTO=JSON.parse(localStorage.getItem(HKEY)||"{}")||{}; }catch(e){ HISTO={}; }
function noteHisto(n,ray,qt){ const k=norm(n); const h=HISTO[k]||{n,c:0}; h.n=n; h.ray=ray; h.c=(h.c||0)+1; if(qt) h.qt=qt; HISTO[k]=h;
  const keys=Object.keys(HISTO); if(keys.length>300) keys.sort((a,b)=>(HISTO[a].c||0)-(HISTO[b].c||0)).slice(0,keys.length-300).forEach(k=>delete HISTO[k]);
  try{ localStorage.setItem(HKEY,JSON.stringify(HISTO)); }catch(e){} }
// tous les produits connus : historique, ajouts de la famille, ingrédients des recettes, catalogue de base
function produitsConnus(){ const m=new Map(), put=(n,ray,c)=>{ const k=norm(n); if(!k) return; const o=m.get(k); if(o){ o.c=Math.max(o.c,c); return; } m.set(k,{n,ray:RAYONS[ray]?ray:"epi",c}); };
  Object.values(HISTO).forEach(h=>put(h.n,h.ray,10+(h.c||0)));
  Object.values(state.weeks||{}).forEach(w=>(w.extras||[]).forEach(x=>put(x.n,x.ray,8)));
  (state.extras||[]).forEach(x=>put(x.n,x.ray,8));
  RECETTES.forEach(r=>r.ing.forEach(([n,,,ray])=>put(n,ray,2)));
  Object.entries(CATALOGUE).forEach(([ray,l])=>l.forEach(n=>put(n,ray,1)));
  CATALOGUE.boi.forEach(n=>{ const o=m.get(norm(n)); if(o) o.ray="boi"; });
  return [...m.values()]; }
// « 2 kg pommes », « pommes 2 kg », « café x2 » : sépare la quantité du nom
const UNITES="kg|g|gr|l|cl|ml|x|pc|pcs|pièces?|paquets?|boîtes?|boites?|bouteilles?|pots?|sachets?|barquettes?|tranches?|rouleaux?|packs?|bacs?|filets?";
function lireSaisie(txt){ let t=String(txt||"").replace(/\s+/g," ").trim(), qt="", m;
  if((m=t.match(new RegExp("^(\\d+(?:[.,]\\d+)?)\\s*("+UNITES+")?\\.?\\s+(?:de |d')?(.+)$","i")))){ qt=(m[1]+(m[2]?" "+m[2]:"")).trim(); t=m[3]; }
  else if((m=t.match(new RegExp("^(.+?)\\s+(?:x\\s*)?(\\d+(?:[.,]\\d+)?)\\s*("+UNITES+")?$","i")))){ qt=(m[2]+(m[3]?" "+m[3]:"")).trim(); t=m[1]; }
  t=t.charAt(0).toUpperCase()+t.slice(1); return {n:t,qt}; }
function chercherProduits(q){ const k=norm(q); if(!k) return [];
  return produitsConnus().map(p=>{ const pn=norm(p.n); let sc=-1;
      if(pn===k) sc=100; else if(pn.startsWith(k)) sc=60; else if(pn.split(" ").some(w=>w.startsWith(k))) sc=40; else if(pn.includes(k)) sc=20;
      return {...p,sc:sc<0?-1:sc+p.c}; }).filter(p=>p.sc>=0).sort((a,b)=>b.sc-a.sc||a.n.localeCompare(b.n,"fr")).slice(0,6); }
let apRayon=null; // saisie en attente du choix d'un rayon
function dejaPrevu(n,t){ const k=norm(n); return coursesTrips()[t].find(i=>norm(i.n)===k); }
function renderApTrip(){ const box=$("aptrip"); if(!box) return; const t=tripVue===null?tripAuto():tripVue;
  box.hidden=true; box.innerHTML=""; }
function renderApSugg(){ const box=$("apsugg"), inp=$("apname"); if(!box||!inp) return;
  const t=tripVue===null?tripAuto():tripVue;
  if(apRayon){ box.hidden=false;
    box.innerHTML=`<p class="aphint">Dans quel rayon ranger <b>${esc(apRayon.n)}</b> ?</p><div class="aprays">${ORDRE.map(r=>`<button type="button" class="chip" data-apray="${r}">${RAYONS[r]}</button>`).join("")}</div>`; return; }
  const {n}=lireSaisie(inp.value), res=chercherProduits(n);
  if(!n||!res.length){ box.hidden=!n; box.innerHTML=n?`<p class="aphint">Nouveau produit : touchez « Ajouter » puis choisissez son rayon.</p>`:""; return; }
  box.hidden=false;
  box.innerHTML=res.map((p,i)=>{ const d=dejaPrevu(p.n,t);
    return `<button type="button" class="apitem" role="option" data-apick="${i}"><b>${esc(p.n)}</b><small>${RAYONS[p.ray]}${d?` · déjà dans la liste${d.x?"":" pour les repas ("+esc(qtyOf(d))+")"}`:""}</small></button>`; }).join("");
  box._res=res; }
function ajouterProduit(n,ray,qt){
  const t=tripVue===null?tripAuto():tripVue, k=norm(n);
  const dbl=(state.extras||[]).find(x=>x.t===t&&norm(x.n)===k);
  if(dbl){ if(qt){ dbl.qt=qt; save(); renderCourses(); toast(`${dbl.n} : quantité mise à jour`); } else toast(`${dbl.n} est déjà dans la liste`); viderSaisie(); return; }
  const prevu=dejaPrevu(n,t);
  state.extras=[...(state.extras||[]),{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n,qt:qt||"",ray,t,par:ME||""}];
  noteHisto(n,ray,qt); save(); renderCourses(); viderSaisie();
  toast(prevu?`${n} ajouté : il était déjà prévu pour les repas (${qtyOf(prevu)}), vérifiez la quantité`:`${n} ajouté à la liste`); }
function viderSaisie(){ apRayon=null; $("apname").value=""; $("apqty").value=""; if($("apunit")) $("apunit").value=""; renderApSugg(); }
// quantité saisie + unité choisie (g, kg, cl, L, pièces…) ; « 1500 g » devient « 1,5 kg »
function qteSaisie(){ let q=($("apqty").value||"").trim().replace(/\s+/g," "); const u=$("apunit")?$("apunit").value:"";
  if(!q) return ""; const m=q.match(/^(\d+(?:[.,]\d+)?)$/);
  if(m&&u){ let v=parseFloat(m[1].replace(",",".")), un=u;
    if(un==="g"&&v>=1000){ v=v/1000; un="kg"; } if(un==="cl"&&v>=100){ v=v/100; un="L"; }
    return `${String(Math.round(v*100)/100).replace(".",",")} ${un}`; }
  return q; }
function validerSaisie(){ const inp=$("apname"), lu=lireSaisie(inp.value); if(!lu.n) return;
  const qt=qteSaisie()||lu.qt, connu=produitsConnus().find(p=>norm(p.n)===norm(lu.n));
  if(connu){ ajouterProduit(connu.n,connu.ray,qt); return; }
  const res=chercherProduits(lu.n);
  apRayon={n:lu.n,qt}; renderApSugg(); }
if($("addprod")){
  $("addprod").addEventListener("submit",e=>{ e.preventDefault(); validerSaisie(); });
  $("apname").addEventListener("input",()=>{ apRayon=null; renderApSugg(); });
  $("apname").addEventListener("focus",renderApSugg);
  $("apsugg").addEventListener("click",e=>{
    const p=e.target.closest("[data-apick]"); if(p){ const it=$("apsugg")._res[+p.dataset.apick], lu=lireSaisie($("apname").value); ajouterProduit(it.n,it.ray,qteSaisie()||lu.qt); $("apname").focus(); return; }
    const r=e.target.closest("[data-apray]"); if(r&&apRayon){ ajouterProduit(apRayon.n,r.dataset.apray,apRayon.qt); $("apname").focus(); } });
  $("aptrip").addEventListener("click",e=>{ const b=e.target.closest("[data-aptrip]"); if(!b) return; tripVue=+b.dataset.aptrip; renderCourses(); renderApSugg(); });
  document.addEventListener("click",e=>{ if(!e.target.closest("#addprod")&&!$("apsugg").hidden&&!apRayon){ $("apsugg").hidden=true; } });
}
// retirer un produit ajouté à la main
$("aisles").addEventListener("click",e=>{ const b=e.target.closest("[data-xdel]"); if(!b) return; e.preventDefault(); e.stopPropagation();
  const id=b.dataset.xdel, x=(state.extras||[]).find(y=>y.id===id); if(!x) return;
  state.extras=state.extras.filter(y=>y.id!==id); Object.keys(state.checked).forEach(k=>{ if(k.endsWith("|x|"+id)) delete state.checked[k]; });
  save(); renderCourses();
  toast(`${x.n} retiré de la liste`,()=>{ state.extras=[...state.extras,x]; save(); renderCourses(); },"Annuler"); });

{ const h=location.hash.slice(1); if(VUES.includes(h)) state.tab=h; }
render(); setTab(state.tab);
