var MPGScraper,
	Xray = require('x-ray'),
	bunyan = require('bunyan');

MPGScraper = (function(){
	var X = Xray();
	X.delay(500, 1000);
	var log = bunyan.createLogger({
		name: 'scraperlogger',
		streams: [
			{
				level: 'trace',
				stream: process.stdout
			}
		]
	});
	var FIXTURES_PAGE = "FIXTURES_PAGE";
	var FIXTURE_STATISTICS_PAGE = "FIXTURE_STATISTICS_PAGE";
	var TEAM_PAGE = "TEAM_PAGE";
	var BLOG_PAGE = "BLOG_PAGE";
	var BLOG_TEAM_PAGE = "BLOG_TEAM_PAGE";
	var BLOG_PLAYER_PAGE = "BLOG_PLAYER_PAGE";
	var PAGE_TYPE = [FIXTURES_PAGE, FIXTURE_STATISTICS_PAGE, TEAM_PAGE, BLOG_PAGE, BLOG_TEAM_PAGE, BLOG_PLAYER_PAGE];

	return {
		getResultTableFromFixtureUrl: function(fixturesUrl, successCallback, errorCallback, localX, localLog){
			if (!localX) log.debug('localXray not provided, using global Xray');
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localX) X = localX;
			if (localLog) log = localLog;

			log.info("Scraping "+FIXTURES_PAGE+ " URL = " + fixturesUrl);

			X(fixturesUrl, "#tabres > table > tbody", {
				'fixturesResults': X('tr:not(:first-child)',  [{
				homeTeam:  'td.equipeDom b',
				awayTeam:  'td.equipeExt b',
				score: 'td.score',
				scoreDetailUrl: 'td.score a@href'
			}])})(function(err, results){
				if(!err){
					results.fixturesResults.forEach(function(fixtureResult, index, fixturesResults){
						var score = fixtureResult.score.split(' - ');
						if (score.length>1){
							fixtureResult.played = 1;
							fixtureResult.homeScore = parseInt(score[0]);
							fixtureResult.awayScore = parseInt(score[1]);
						}else{
							fixtureResult.played = 0;
						}
						delete fixtureResult.score;
						
					})
					if (successCallback) successCallback(results);
					
				}else{
					if(errorCallback) errorCallback(err);
				}
			});
		},
		
		getStatisticsFromFixture: function(fixtureStatisticsUrl, successCallback, errorCallback, localX, localLog){
			if (!localX) log.debug('localXray not provided, using global Xray');
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localX) X = localX;
			if (localLog) log = localLog;

			log.info("Scraping "+FIXTURES_PAGE+ " URL = " + fixtureStatisticsUrl);

			X(fixtureStatisticsUrl, "#content > script:nth-child(3)")(function(err, script){
				log.info(err)
				if(!err){
					var regex = /var stat = (.*);/g;
					matchs = script.match(regex);
					if (matchs){
						var result = JSON.parse(matchs[0].split(" = ")[1].split(";")[0]);
						if (successCallback) successCallback(result);
					}
				}else{
					if(errorCallback) errorCallback(err);
				}
			});
		},

		getListTeams: function(blogURL, successCallback, errorCallback, localX, localLog){
			if (!localX) log.debug('localXray not provided, using global Xray');
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localX) X = localX;
			if (localLog) log = localLog;

			log.info("Scraping "+FIXTURES_PAGE+ " URL = " + blogURL);

			X(blogURL, "#menu-item-1247 > ul li", [{
				teamName: 'a',
				teaURL: 'a@href'
			}])(function(err, teams){
				if(!err){
					if (successCallback) successCallback(teams);
				}else{
					if(errorCallback) errorCallback(err);
				}
			})

		},

		getPlayersFromTeam: function(teamURL, successCallback, errorCallback, localX, localLog){
			if (!localX) log.debug('localXray not provided, using global Xray');
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localX) X = localX;
			if (localLog) log = localLog;

			log.info("Scraping "+BLOG_TEAM_PAGE+ " URL = " + teamURL);

			X(teamURL, "#tab1 > div.our-team-sec article figcaption", [{
				playerURL: 'h2 a@href',
				playerName: 'h2 a',
				playerPosition: 'h6 a'
			}])(function(err, players){
				if(!err){
					if (successCallback) successCallback(players);		
					log.info(players)			
				}else{
					if(errorCallback) errorCallback(err);
				}
			})

		},

		getPlayerStatistics: function(playerURL, successCallback, errorCallback, localX, localLog){
			if (!localX) log.debug('localXray not provided, using global Xray');
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localX) X = localX;
			if (localLog) log = localLog;

			log.info("Scraping "+BLOG_PLAYER_PAGE+ " URL = " + playerURL);

			X(playerURL, "#innermain > div.container > div > div", {
				playerLastName: 'div.subtitle > h1',
				playerBirthday: 'div.element_size_100 > div > article > div > div.team-sec > div > div.player-info > ul > li:nth-child(1) > time',
				playerCountry: 'div.element_size_100 > div > article > div > div.team-sec > div > div.player-info > ul > li:nth-child(2)',
				matchPlayed: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(1)",
				matchStarted: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(1)",
				minutesPlayed: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(2)",
				goals: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(3)",
				decisivePass: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(4)",
				shots: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(5)",
				shotsAccuracy: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(6)",
				passes: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(7)",
				passesAccuracy: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(8)",
				meanMPG: "div.element_size_100 > div > article > div > div.team-detail-text > div.row > div:nth-child(9)"

			})(function(err, player){
				if(!err){
					var numReg = /(\d+)/;
					var decimalNumberReg = /(\d+.\d+)/;
					if (player.playerCountry){
						player.playerCountry = player.playerCountry.split("Pays")[1];
						player.playerCountry = player.playerCountry.split(" ").filter(function(element){
							return element !== "";
						}).join()
					} 

					[{
						"text": player.matchStarted,
						"key": "matchStarted"
					},{
						"text": player.matchPlayed,
						"key": "matchPlayed"
					},{
						"text": player.minutesPlayed,
						"key": "minutesPlayed"
					},{
						"text": player.goals,
						"key": "goals"
					},{
						"text": player.decisivePass,
						"key": "decisivePass"
					},{
						"text": player.shots,
						"key": "shots"
					},{
						"text": player.passes,
						"key": "passes"
					}].forEach(function(element, i, array){
						var matches = element.text.match(numReg);
						player[element.key] = matches[0];
					});

					[{
						"text": player.shotsAccuracy,
						"key": "shotsAccuracy"
					},{
						"text": player.passesAccuracy,
						"key": "passesAccuracy"
					},{
						"text": player.meanMPG,
						"key": "meanMPG"
					}].forEach(function(element, i, array){
						var matches = element.text.match(decimalNumberReg);
						player[element.key] = matches[0];
					});


					log.info(player);
					if (successCallback) successCallback(players);					
				}else{
					if(errorCallback) errorCallback(err);
				}
			})
		}
	}
})();

module.exports = MPGScraper;