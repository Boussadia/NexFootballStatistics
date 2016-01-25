var MPGCrawler,
	MPGScraper = require('./scraper'),
	MPGStore = require('./datastore'),
	bunyan = require('bunyan');

MPGCrawler = (function(MPGScraper){
	var log = bunyan.createLogger({
		name: 'crawlerlogger',
		streams: [
			{
				level: 'info',
				stream: process.stdout
			}
		]
	});

	var BLOG_HOME_PAGE = "http://blog.monpetitgazon.com/";
	var FIXTURES_RESULTS_PAGE = "http://www.monpetitgazon.com/calendrier-resultat-championnat.php";
	var FIXTURES_PROCESS = "FIXTURES_PROCESS";
	var FIXTURE_PROCESS = "FIXTURE_PROCESS";
	var PROCESSES = [FIXTURES_PROCESS, FIXTURE_PROCESS];

	return {
		getAllFixturesResults: function(successCallback, errorCallback, localLog){
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localLog) log = localLog;

			log.info("Starting process "+FIXTURES_PROCESS+ " URL = " + FIXTURES_RESULTS_PAGE);

			var that = this;
			var index = 1;
			var indexMax = 38;
			var timer = setInterval(function(){
				var i = index;
				that.getFixtureResults(i,function(results){
					successCallback(results);
				}, errorCallback, localLog );
				index = index +1;
				if (index > 38){
					clearInterval(timer);
				}
			}, 1000);

			
		},
		getFixtureResults: function(fixtureNumber, successCallback, errorCallback, localLog){
			if (!localLog) log.debug('localLog not provided, using global log');
			if (localLog) log = localLog;

			log.info("Starting process "+FIXTURE_PROCESS+ " URL = " + FIXTURES_RESULTS_PAGE+", fixtureDay = "+ fixtureNumber);

			MPGScraper.call("FIXTURES_PAGE", FIXTURES_RESULTS_PAGE+"?num="+fixtureNumber, function(results){
				results.fixtureNumber = fixtureNumber;
				MPGStore.saveFixtureTable(results);
				if (successCallback) successCallback(results);
			}, errorCallback);
					
		}
	};
})(MPGScraper);

module.exports = MPGCrawler;