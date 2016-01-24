#! /usr/bin/env node

var json2csv = require("json2csv"),
	MPGScraper = require('../MPGScraper/scraper'),
	bunyan = require('bunyan'),
	fs = require('fs'),
	program = require('commander');

var fixtuxeStatistcisRetrieval = function(initIndex, endIndex, format){
	var iterGame = function(result, index, results, fixturesStats, finalCallback){
		var scoreDetailUrl = result.scoreDetailUrl;
		if (scoreDetailUrl){
			MPGScraper.call("FIXTURE_STATISTICS_PAGE", scoreDetailUrl, function(table){
				var computedResults = [];
				for(var playerId in table){
					var localResult = table[playerId];
					localResult.playerId = playerId;
					localResult.fixture = result.fixture;
					localResult.homeTeam = result.homeTeam;
					localResult.awayTeam = result.awayTeam;
					computedResults.push(localResult);
				}
				fixturesStats = fixturesStats.concat(computedResults);

				if(index+1<results.length){
					iterGame(results[index+1], index +1, results, fixturesStats,finalCallback);
				}else{
					if(finalCallback) finalCallback(fixturesStats);
				}
			}, function(err){
				console.log(err);
			});
		}else{
			if(index+1<results.length){
				iterGame(results[index+1], index +1, results, fixturesStats,finalCallback);
			}else{
				if(finalCallback) finalCallback(fixturesStats);
			}
		}
		
	};
	var iterFixtures = function(i, endIndex, globalFixturesStats){
		var baseUrl = "http://www.monpetitgazon.com/calendrier-resultat-championnat.php?num=";
		var url = baseUrl + i;
		MPGScraper.call("FIXTURES_PAGE", url, function(results){
			results.fixturesResults.forEach(function(result, index, results){
				result.fixture = i;
			});

			iterGame(results.fixturesResults[0], 0,results.fixturesResults, globalFixturesStats,function(globalFixturesStats){
				if(i+1<=endIndex){
					iterFixtures(i+1,endIndex, globalFixturesStats);
				}else{
					if (format === "csv"){
						var fields = [
							"playerId",
							"name",
							"note",
							"goals",
							"goal_assist",
							"is_home",
							"homeTeam",
							"awayTeam",
							"fixture"
						];

						json2csv({data: globalFixturesStats, fields: fields, del: ";"}, function(err, csv){
							if(!err){
								fs.writeFile(__dirname+"/../target/fixture_"+initIndex+"_"+endIndex+".csv", csv, function(err) {
									if(err) {
										return console.log(err);
									}
									console.log("The file was saved!");
								});
							}else{
								console.log(err);
							}
							
						});
					}else{
						fs.writeFile(__dirname+"/../target/fixture_"+initIndex+"_"+endIndex+".json", JSON.stringify(globalFixturesStats), function(err) {
							if(err) {
								return console.log(err);
							}
							console.log("The file was saved!");
						});
					}
				}
			});
		}, function(err){
			console.log(err, i, endIndex);
		});

	};

	iterFixtures(initIndex, endIndex, []);
};


program
	.arguments('action')
	.option('-s, --start <startIndex>', 'Première journée à récupérer')
	.option('-e, --end <endIndex>', 'Dernière journée à récupérer')
	.option('-f, --format <formatoutput>', 'format du fichier de sortit, json ou csv')
	.option('-o, --output <fileoutput>', 'Chemin du fichier à savegarder')
	.action(function(action){
		var FIXTURE_STATISTICS_PAGE = "fixtures_stats";
		var ACTION_LIST = ["FIXTURE_STATISTICS_PAGE"];
		if (action === FIXTURE_STATISTICS_PAGE){
			var startIndex = parseInt(program.start);
			var endIndex = parseInt(program.end);
			var format = ( program.format === "json") ? "json" : "csv";
			fixtuxeStatistcisRetrieval(startIndex, endIndex, format);
		}
	})
	.parse(process.argv);