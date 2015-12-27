module.exports = function(grunt){
	"use strict";

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		eslint: {
			target: ['NexSportsFrScraper.js']
		},
		jshint: {
			all: ['*.js']
		},
	});
	 
	grunt.registerTask('default', ['jshint']);
};