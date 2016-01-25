#! /usr/bin/env node

var json2csv = require("json2csv"),
	MPGScraper = require('../MPGScraper/scraper'),
	bunyan = require('bunyan'),
	fs = require('fs'),
	program = require('commander');


var SCRIPTS = (function(json2csv, MPGScraper, bunyan, fs){
	var fixtuxeStatistcisRetrieval = function(initIndex, endIndex){
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
						var fields = [
							"name",
							"note",
							"is_home",
							"homeTeam",
							"awayTeam",
							"fixture",
							"second_goal_assist",
							"goals",
							"att_obox_goal",
							"att_freekick_goal",
							"accurate_cross",
							"won_corners",
							"won_contest",
							"big_chance_created",
							"total_att_assist",
							"goal_assist",
							"accurate_through_ball",
							"penalty_won",
							"ontarget_scoring_att",
							"was_fouled",
							"fouled_final_third",
							"bad_cross",
							"big_chance_missed",
							"bad_through_ball",
							"att_pen_target",
							"att_pen_miss",
							"att_pen_post",
							"blocked_scoring_att",
							"six_yard_block",
							"shot_off_target",
							"total_offside",
							"overrun",
							"unsuccessful_touch",
							"blocked_cross",
							"effective_blocked_cross",
							"effective_clearance",
							"clearance_off_line",
							"offside_provoked",
							"shield_ball_oop",
							"last_man_tackle",
							"won_tackle",
							"duel_won",
							"interceptions_in_box",
							"interception_won",
							"outfielder_block",
							"poss_won_att_3rd",
							"poss_won_mid_3rd",
							"poss_won_def_3rd",
							"clean_sheet",
							"own_goals",
							"goal_conceded",
							"lost_corners",
							"bad_clearance",
							"error_lead_to_goal",
							"error_lead_to_shot",
							"bad_contest",
							"fouls",
							"yellow_card",
							"red_card",
							"penalty_conceded",
							"dispossessed",
							"duel_lost",
							"dangerous_play",
							"stand_catch",
							"dive_catch",
							"good_high_claim",
							"punches",
							"stand_save",
							"dangerous_save",
							"dive_save",
							"penalty_save",
							"gk_smother",
							"accurate_keeper_sweeper",
							"saved_ibox",
							"saved_obox",
							"six_second_violation",
							"bad_keeper_throws",
							"bad_keeper_sweeper",
							"cross_not_claimed",
							"bonus_def",
							"bonus_large_victory",
							"touches_ball_bonus",
							"ball_recovery",
							"accurate_pass_percentage",
							"large_defeat"

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
					}
				});
			}, function(err){
				console.log(err, i, endIndex);
			});

		};

		iterFixtures(initIndex, endIndex, []);
	};

	var playerStats = function(playerURL, successCallback, errorCallback){
		MPGScraper.call("BLOG_PLAYER_PAGE", playerURL, function(player){
			if(successCallback) successCallback(player);
		}, function(err){
			if(errorCallback) errorCallback(err);
		});
	};


	var teamPlayersStats = function(teamBlogURL, successCallback, errorCallback){
		MPGScraper.call("BLOG_TEAM_PAGE", teamBlogURL, function(players){
			if(successCallback) successCallback(players);
		}, function(err){
			if(errorCallback) errorCallback(err);
		});
	};

	var playersStats = function(successCallback, errorCallback){
		var playersResult = [];

		MPGScraper.call("TEAM_PAGE", "http://blog.monpetitgazon.com/", function(teams){

			var iterTeams = function(team, index, teams, endCallback){
				var teamUrl = team.teaURL;
				teamPlayersStats(teamUrl, function(players){
					iterPlayer(players[0], 0, players, function(){
						console.log("HAHAHAHAHAHAHAHA");
						console.log(index, teams.length)
						if(index+1>=teams.length){
							if (endCallback) endCallback();
						}else{
							iterTeams(teams[index+1], index+1, teams, endCallback);
						}
					});
				}, function(err){
					if(errorCallback) errorCallback(err);
				})
			};

			var iterPlayer = function(player, index, players, endCallback){
				var playerURL = player.playerURL;
				playerStats(playerURL, function(player){
					player.position = players.playerPosition;
					playersResult.push(player);
					if(index+1>=players.length){
						if (endCallback) endCallback();
					}else{
						iterPlayer(players[index+1], index+1, players,endCallback);
					}
				}, function(err){
					if(errorCallback) errorCallback(err);
					if(index+1>=players.length){
						if (endCallback) endCallback();
					}else{
						iterPlayer(players[index+1], index+1, players, endCallback);
					}
				})
			}

			iterTeams(teams[0], 0, teams, function(){
				fs.writeFile(__dirname+"/../target/stats.json", JSON.stringify(playerStats), function(err) {
					if(err) {
						return console.log(err);
					}
					console.log("The file was saved!");
				});
			});
			
		}, function(err){
			if(errorCallback) errorCallback(err);
		});	
	}


	return{
		fixtuxeStatistcisRetrieval: fixtuxeStatistcisRetrieval,
		playersStats: playersStats
	}


})(json2csv, MPGScraper, bunyan, fs)



program
	.arguments('action')
	.option('-s, --start <startIndex>', 'Première journée à récupérer')
	.option('-e, --end <endIndex>', 'Dernière journée à récupérer')
	.option('-f, --file <fileoutput>', 'Chemin du fichier à savegarder')
	.action(function(action){
		var FIXTURE_STATISTICS_PAGE = "fixtures_stats";
		var PLAYERS_STATISTICS = "players_stats";
		var ACTION_LIST = ["FIXTURE_STATISTICS_PAGE"];
		if (action === FIXTURE_STATISTICS_PAGE){
			var startIndex = parseInt(program.start);
			var endIndex = parseInt(program.end);
			SCRIPTS.fixtuxeStatistcisRetrieval(startIndex, endIndex);
		}else if(action === PLAYERS_STATISTICS){
			SCRIPTS.playersStats(function(players){
				console.log("---------------------------------");
				console.log(players);
			}, function(err){
				console.log(err);
			})
		}
	})
	.parse(process.argv);