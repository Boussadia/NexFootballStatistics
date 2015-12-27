/*var NexSportsFrScraper = require('./NexSportsFrScraper');

var next = function(){
	NexSportsFrScraper.db.league.find({type: "TEAM"}, function(err, teams){
		var iterFuncTeams = function(i, length, teams){
			var team = teams[i];
			if (i<length){
				NexSportsFrScraper.getAndSaveTeamPlayers(team.url, function(){
					NexSportsFrScraper.db.league.find({teamUrl: team.url}, function(err, players){
						var iterFuncPlayer = function(j, playersLength, players){
							var player = players[j];
							if (j<playersLength){
								if (player.statsUrl) NexSportsFrScraper.getAndSavePlayerStats(player.statsUrl, function(){
									iterFuncPlayer(j+1, playersLength, players);
								});
								if (!player.statsUrl) iterFuncPlayer(j+1, playersLength, players);

							}else{
								iterFuncTeams(i+1, length, teams);
							}
						};
						iterFuncPlayer(0, players.length, players);
					});
				});
			}
		};
		iterFuncTeams(0, teams.length, teams);
	});
};

NexSportsFrScraper.getAndSaveTeams(next);*/

var MPGScraper = require('./MPGScraper/scraper');
var MPGCrawler = require('./MPGScraper/crawler');
//MPGScraper.getStatisticsFrom('http://www.monpetitgazon.com/DetailMatchChampionnat2.php?idmatch=805452');
//MPGScraper.getResultTableFromFixtureUrl("http://www.monpetitgazon.com/calendrier-resultat-championnat.php?num=16");
//MPGScraper.getPlayersFromTeam("http://blog.monpetitgazon.com/team/?filter_category=ajaccio");
//MPGScraper.getPlayerStatistics('http://blog.monpetitgazon.com/player/brechet-6586/')

MPGCrawler.getAllFixturesResults();