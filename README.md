# NexFootballStatistics

##Prérequis
Nodejs

##Installation
```
npm install bunyan -g
npm install
```
##Utilisation des scripts
```
node scripts/csvscraper.js fixtures_stats --start <fixtureStart> --end <fixtureEnd> | bunyan
```

Ce script va récupérer toutes les statistiques de tous les joueurs qui ont joués entre les journée fixtureStart et fixtureEnd.
Le fichier enregistré est un fichier csv. Pour le moment, le dossier d'enregistrement est /target.
Le fichier csv généré contient les informations suivants:
 - nom fichier : fixture_\<fixtureStart\>_\<fixtureEnd\>.csv
 - collonnes :
  - playerId: entier - identifiant unique du joueur,
  - name: string - nom de famille du joueur,
  - note: entier - note MPG du joueur,
  - goals: entier - nombre de buts dans le match,
  - goal_assist: entier - nombre de passes décisives dans le match,
  - is_home: 0 ou 1, 1 indique que le joueur jouait à domicile,
  - homeTeam: string - équipe à domicile,
  - awayTeam: string - equipe à l'extérieur,
  - fixture: entier - numéro de journée.


