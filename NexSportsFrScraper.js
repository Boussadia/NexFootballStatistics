var NexSportsFrScraper,
	Xray = require('x-ray'),
	Datastore = require('nedb'),
	bunyan = require('bunyan');

var NexSportsFrScraper = (function(){
	var X = Xray();
	X.delay(500, 1000);
	var log = bunyan.createLogger({name: 'scraperlogger'});
	var BASE_URL = "http://www.sports.fr";
	var CLUBS_LIGUE_1_URI = "/football/ligue-1/clubs.html";
	var CLUBS_LIGUE_1_URL = BASE_URL+CLUBS_LIGUE_1_URI;
	var db = {};
	db.scrapeLog = new Datastore({
		filename: __dirname+'/scrape.db'
	});
	db.league = new Datastore({
		filename: __dirname+'/league.db'
	});
	db.scrapeLog.loadDatabase();
	db.league.loadDatabase();

	var SCRAPE_TYPE = {
		LEAGUE: "LEAGUE",
		TEAM: "TEAM",
		PLAYER: "PLAYER",
		STATS: "STATS"
	};

	return {
		db: db,
		registerScrape: function(type, options){
			log.info(options, 'Registring a scrape of type '+ type);
			options = options || {};
			db.scrapeLog.insert({
				type: type,
				time: (new Date()).toJSON(),
				options: options
			}, function(err, newDoc){
				if(!err){

				}else{
					log.error(err, 'Error while registring scrape');
				}
			});
		},

		getAndSaveTeams: function(next, errorCallback){
			log.info('Starting Team retrieval');
			var that = this;
			this.getListTeamsLigue1(function(teams){
				if (!!teams) log.info('Retrieved '+teams.length+' teams');
				if (!teams) log.info('No teams retrieved');

				teams.forEach(function(team, index, teams){
					db.league.findOne({name: team.name}, function(err, foundTeam){
						var i = index;
						var length = teams.length;
						if(!err && !!foundTeam){
							db.league.update({name: foundTeam.name}, {$set: foundTeam}, {}, function(err, numReplaced){
								log.info({team: foundTeam}, 'Team updated');
								that.registerScrape(SCRAPE_TYPE.LEAGUE);
								if (next && (i == (length - 1))) next();
							});
						}else if(!err){
							db.league.insert(team, function(err, newTeam){
								log.info({team: newTeam}, 'Team created');
								that.registerScrape(SCRAPE_TYPE.LEAGUE);
								if (next && (i == (length - 1))) next();
							});
						}else{
							log.error(err, 'Error while saving team');
							if(errorCallback) errorCallback(err);
							if (next && (i == (length - 1))) next();
						}
					});
				});
			}, function(err){
				log.error('Eror while retrieving teams');
				if(errorCallback) errorCallback(err);
			});
		},
		getAndSaveTeamPlayers: function(teamUrl, next, errorCallback){
			log.info('Retrieving team players');
			var that = this;
			this.getListPlayersForTeam(teamUrl, function(players){
				if (!!players) log.info('Retrieved '+players.length+' players');
				if (!players) log.info('No players retrieved');

				var iterFunc = function(i, length){
					if (i<length){
						var url = players[i].url;
						that.getPlayerProfile(url, function(player){
							player.teamUrl = teamUrl;
							db.league.findOne({url: url}, function(err, playerFound){
								if (!err && !!playerFound){
									db.league.update({url: playerFound.url}, {$set: player}, {}, function(err, numReplaced){
										log.info({playerFound: playerFound}, 'Player updated');
										that.registerScrape(SCRAPE_TYPE.PLAYER, {url: playerFound.url});
										iterFunc(i+1, length);
									});
								}else if(!err){
									db.league.insert(player, function(err, newPlayer){
										log.info({newPlayer: newPlayer}, 'Player created');
										that.registerScrape(SCRAPE_TYPE.PLAYER, {url: newPlayer.url});
										iterFunc(i+1, length);
									});
								}else{
									log.error(err, 'Error while saving player');
									if (errorCallback) errorCallback(err);
									iterFunc(i+1, length);
								}
							});
						}, function(err){
							log.error(err, 'Error while retrieving player');
							if (errorCallback) errorCallback(err);
							iterFunc(i+1, length);
						});
					}else{
						that.registerScrape(SCRAPE_TYPE.TEAM, {url: teamUrl});
						if (next) next();
					}
				};
				iterFunc(0, players.length);

			}, function(err){
				log.error(err, 'Error while retrieving player list for team');
				if (errorCallback) errorCallback(err);
			});
		},
		getAndSavePlayerStats: function(statsUrl, next, errorCallback){
			log.info('Starting Stats retrieval');
			var that = this;
			that.getPlayerStats(statsUrl, function(stats){
				if (!!stats) log.info('Retrieved '+stats.length+' lines of statistics');
				if (!stats) log.info('No statistics retrieved');
				var iterFunc = function(i, length, stats){
					var stat = stats[i];
					if (i<length){
						db.league.findOne({url: stat.url, fixture: stat.fixture}, function(err, statsFound){
							if (!err && !!statsFound){
								log.info({fixture: statsFound}, 'Line of Statistics already created');
								iterFunc(i+1, length, stats);
							}else if(!err){
								db.league.insert(stat, function(err, newStat){
									log.info({newStat: newStat}, 'Line of statistics created');
									that.registerScrape(SCRAPE_TYPE.STATS, {url: newStat.url});
									iterFunc(i+1, length, stats);
								});
							}else{
								log.error(err, 'Error while saving statistics');
								if (errorCallback) errorCallback(err);
								iterFunc(i+1, length, stats);
							}
						});
					}else{
						if (next) next();
					}
				};
				iterFunc(0, stats.length, stats);
			},function(err){
				log.error( err, 'Error while retrieving player stats');
				if (errorCallback) errorCallback(err);
			});

		},



		// HTML -> JSON
		getListPlayersForTeam: function(teamUrl, successCallback, errorCallback){
			X(teamUrl, "#col2 > div.nwTable > table > tbody > tr td:nth-child(2) a", [{
				url: "@href"
			}])(function(err, results){
				if(!err){
					if(successCallback) successCallback(results);
				}else{
					if(errorCallback) errorCallback(err);
				}
			});
		},
		getPlayerProfile: function(playerUrl, successCallback, errorCallback){
			X(playerUrl, "#main-content > div.nwTable.nwFiche.nwJoueur", {
				image: "img@src",
				lastName: "div.nwIdentity ul > li:nth-child(1) > span > b",
				firstName: "div.nwIdentity ul > li:nth-child(2) > span > b",
				birthday: "div.nwIdentity ul > li:nth-child(3) > span > b",
				birthplace: "div.nwIdentity ul > li:nth-child(5) > span > b",
				nationality: "div.nwIdentity ul > li:nth-child(6) > span > b",
				height: "div.nwIdentity ul > li:nth-child(7) > span > b",
				weight: "div.nwIdentity ul > li:nth-child(8) > span > b",
				position: "div.nwIdentity ul > li:nth-child(9) > span > b",
				number: "div.nwIdentity ul > li:nth-child(10) > span > b",
				statsUrl: "div.nwStat > table > tfoot > tr > td > a@href",
				type: SCRAPE_TYPE.PLAYER
			})(function(err, player){

				if(!err){
					player.url = playerUrl;
					player.nationality = player.nationality.match(/\S+/g)[0];
					player.height = parseInt(player.height.match(/\d+/g).join(""));
					player.weight = parseInt(player.weight.match(/\d+/g).join(""));
					player.number = parseInt(player.number);
					player.type= SCRAPE_TYPE.PLAYER;
					if(successCallback) successCallback(player);
				}else{
					if(errorCallback) errorCallback(err);
				}
			});

		},
		getPlayerStats: function(playerStatsUrl, successCallback, errorCallback){
			X(playerStatsUrl, "#main-content > div.nwTable.nwDetailSaison > table:nth-child(3) > tbody  tr", [{
				date: "td:nth-child(1)",
				homeTeam: "td:nth-child(2) img@alt",
				awayTeam: "td:nth-child(4) img@alt",
				fixture: "td:nth-child(5) a",
				homeTeamScore: "td:nth-child(6) a",
				awayTeamScore: "td:nth-child(6) a",
				status: "td:nth-child(7)",
				timePlayed: "td:nth-child(8)",
				review:"td:nth-child(9)", 
				goals: "td:nth-child(10)",
				yellowCards: "td:nth-child(11)",
				redCards: "td:nth-child(12)",
				type: SCRAPE_TYPE.STATS
			}])(function(err, playerStats){
				if(!err){
					var cleanTimeFromScore = function(inputStr){
						if(inputStr == "-") return 0;
						inputStr = inputStr.split('(')[0];
						inputStr = parseInt(inputStr);
						return inputStr;
					};
					[].forEach.call(playerStats, function(element, index, array){
						var score = element.homeTeamScore;
						element.statsUrl = playerStatsUrl;
						element.fixture = parseInt(element.fixture.match(/\d+/g)[0]);
						element.homeTeamScore = parseInt(score.match(/\S+/g)[0].split("-")[0]);
						element.awayTeamScore = parseInt(score.match(/\S+/g)[0].split("-")[1]);
						element.timePlayed = parseInt(element.timePlayed);
						element.review = parseFloat(element.review);
						if(isNaN(element.review)) element.review = -1;
						element.yellowCards = cleanTimeFromScore(element.yellowCards);
						element.redCards = cleanTimeFromScore(element.redCards);
						element.goals = cleanTimeFromScore(element.goals);
						element.type= SCRAPE_TYPE.STATS;

					});
					if(successCallback) successCallback(playerStats);
				}else{
					if(errorCallback) errorCallback(err);
				}
			});
		},
		getListTeamsLigue1: function(successCallback, errorCallback){
			X(CLUBS_LIGUE_1_URL, '#main-content > div.nwTable.nwClub > ul li', [{
				name: 'div > h2 > a',
				image: 'div > span > img@src',
				url: 'div > h2 > a@href'
			}])(function(err, result){
				if(!err){
					[].forEach.call(result, function(element, index, array){
						element.name = element.name.match(/\S+/g)[0];
						element.type= SCRAPE_TYPE.TEAM;
					});
					if(successCallback) successCallback(result);
				}else{
					if(errorCallback) errorCallback(err);
				}
			});
		}		
	};
})();

module.exports = NexSportsFrScraper;