var MPGCrawler,
	MPGScraper = require('./scraper'),
	MPGStore = require('./datastore'),
	bunyan = require('bunyan');

MPGCrawler = (function(MPGScraper){
	var log = bunyan.createLogger({
		name: 'crawlerlogger',
		streams: [
			{
				level: 'trace',
				stream: process.stdout
			}
		]
	});

	var BLOG_HOME_PAGE = "http://blog.monpetitgazon.com/";
	var FIXTURES_RESULTS_PAGE = "http://www.monpetitgazon.com/calendrier-resultat-championnat.php"
	var FIXTURES_PROCESS = "FIXTURES_PROCESS";
	var FIXTURE_PROCESS = "FIXTURE_PROCESS";
	var PROCESSES = [FIXTURES_PROCESS, FIXTURE_PROCESS];

	return {
		getAllFixturesResults: function(successCallback, errorCallback, localLog){
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localLog) log = localLog;

			log.info("Starting process "+FIXTURES_PROCESS+ " URL = " + FIXTURES_RESULTS_PAGE);

			var that = this;

			for (var i = 1; i<=38; i++){
				(function(i){
					setTimeout(function(){
						that.getFixtureResults(i,successCallback, errorCallback, localLog );
					}, i*1000);
					
				})(i)
				
			}
		},
		getFixtureResults: function(fixtureNumber, successCallback, errorCallback, localLog){
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localLog) log = localLog;

			log.info("Starting process "+FIXTURE_PROCESS+ " URL = " + FIXTURES_RESULTS_PAGE+", fixtureDay = "+ fixtureNumber);

			MPGScraper.getResultTableFromFixtureUrl(FIXTURES_RESULTS_PAGE+"?num="+fixtureNumber, function(results){
				results.fixtureNumber = fixtureNumber;
				MPGStore.saveFixtureTable(results);
				if (successCallback) successCallback(results)
			}, errorCallback);
					
		}
	};
})(MPGScraper);

module.exports = MPGCrawler;