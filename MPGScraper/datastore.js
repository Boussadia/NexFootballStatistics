var MPGStore,
	Datastore = require('nedb'),
	bunyan = require('bunyan');

MPGStore = (function(){
	var log = bunyan.createLogger({
		name: 'storeLogger',
		streams: [
			{
				level: 'trace',
				stream: process.stdout
			}
		]
	});

	var db = {};
	db.scrapeLog = new Datastore({
		filename: __dirname+'/scrape.db'
	});
	db.league = new Datastore({
		filename: __dirname+'/league.db',
		autoload: true
	});
	db.scrapeLog.loadDatabase();

	var FIXTURES_RESULTS = "FIXTURES_RESULTS";
	var TABLES = [FIXTURES_RESULTS];

	return {
		registerScrape: function(type, options){
			options = options || {};
			log.info(options, 'Registring a scrape of type '+ type);
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
		saveFixtureTable: function(fixtureResults, successCallback, errorCallback, localLog){
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localLog) log = localLog;

			var fixtureDay = fixtureResults.fixtureNumber;


			fixtureResults.fixturesResults.forEach(function(element, i, array){
				var played = (element.played === 1);
				if (played){
					element.fixtureDay = fixtureDay;
					element.type = FIXTURES_RESULTS;
					db.league.count({homeTeam: element.homeTeam, awayTeam: element.awayTeam, fixtureDay: fixtureDay, type: FIXTURES_RESULTS}, function(err, fixtureCount){
						if(!err && !!fixtureCount){
							log.info("Skipping "+FIXTURES_RESULTS+" : "+element.homeTeam+" vs "+element.awayTeam+" fixtureDay "+i+". Reason : fixture already saved");
						}else if(!err){
							db.league.insert(element, function(err, newFixture){
								log.info("Saving "+FIXTURES_RESULTS+" : "+element.homeTeam+" vs "+element.awayTeam+" fixtureDay "+i);
								MPGStore.registerScrape(FIXTURES_RESULTS);
							});
						}else{
							log.error(err, 'Error while saving fixture');
							if(errorCallback) errorCallback(err);
						}
					});
				}else{
					log.info("Skipping "+element.homeTeam+" vs "+element.awayTeam+" fixtureDay "+i+". Reason : matched not played yet");
				}
			})
			
		}
	};
})();

module.exports = MPGStore;