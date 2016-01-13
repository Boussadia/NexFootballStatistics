module.exports = function(grunt){
	"use strict";

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		eslint: {
			target: ['NexSportsFrScraper.js', 'MPGScraper/**/*.js', 'scripts/**/*.js']
		},
		jshint: {
			all: ['MPGScraper/**/*.js', 'scripts/**/*.js']
		},
	});
	 
	grunt.registerTask('default', ['jshint']);
};