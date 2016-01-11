var json2csv = require("json2csv"),
	fs = require('fs');;

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
//var MPGCrawler = require('./MPGScraper/crawler');
//MPGScraper.getStatisticsFrom('http://www.monpetitgazon.com/DetailMatchChampionnat2.php?idmatch=805452');
//MPGScraper.getResultTableFromFixtureUrl("http://www.monpetitgazon.com/calendrier-resultat-championnat.php?num=16");
//MPGScraper.getPlayersFromTeam("http://blog.monpetitgazon.com/team/?filter_category=ajaccio");
//MPGScraper.getPlayerStatistics('http://blog.monpetitgazon.com/player/brechet-6586/')

//MPGCrawler.getAllFixturesResults();

(function(initIndex, endIndex){
	var iterGame = function(result, index, results, fixturesStats, finalCallback){
		var scoreDetailUrl = result.scoreDetailUrl;
		MPGScraper.call("FIXTURE_STATISTICS_PAGE", scoreDetailUrl, function(table){
			var computedResults = [];
			for(playerId in table){
				var localResult = table[playerId];
				localResult["playerId"] = playerId;
				localResult["fixture"] = result.fixture;
				localResult["homeTeam"] = result.homeTeam;
				localResult["awayTeam"] = result.awayTeam;
				computedResults.push(localResult);
			}
			fixturesStats = fixturesStats.concat(computedResults);

			if(index+1<results.length){
				iterGame(results[index+1], index +1, results, fixturesStats,finalCallback)
			}else{
				if(finalCallback) finalCallback(fixturesStats);
			}
		}, function(err){
			console.log(err)
		})
	}
	var iterFixtures = function(i, endIndex, globalFixturesStats){
		var baseUrl = "http://www.monpetitgazon.com/calendrier-resultat-championnat.php?num=";
		var url = baseUrl + i;
		MPGScraper.call("FIXTURES_PAGE", url, function(results){
			results.fixturesResults.forEach(function(result, index, results){
				result.fixture = i;
			});

			iterGame(results.fixturesResults[0], 0,results.fixturesResults, globalFixturesStats,function(globalFixturesStats){
				if(i+1<=endIndex){
					iterFixtures(i+1,endIndex, globalFixturesStats)
				}else{
					var fields = [
						"playerId",
						"name",
						"note",
						"goals",
						"goal_assist",
						"homeTeam",
						"awayTeam",
						"fixture"
					]

					json2csv({data: globalFixturesStats, fields: fields, del: ";"}, function(err, csv){
						if(!err){
							fs.writeFile("./target/fixture_"+i+"_"+endIndex+".json", JSON.stringify(globalFixturesStats), function(err) {
								if(err) {
									return console.log(err);
								}
								console.log("The file was saved!");
							});
							fs.writeFile("./target/fixture_"+initIndex+"_"+endIndex+".csv", csv, function(err) {
								if(err) {
									return console.log(err);
								}
								console.log("The file was saved!");
							});
						}else{
							console.log(err)
						}
						
					})
				}
			})
		}, function(err){
			console.log(err, i, endIndex);
		})

	};

	iterFixtures(initIndex, endIndex, []);
})(1, 20)