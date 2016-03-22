(function(){
  module.exports = function(grunt) {
    grunt.initConfig({
      execute: {
		fetch: {
          src: ['lib/fetch.js']
		}
      }
    });

    grunt.loadNpmTasks('grunt-execute');

    grunt.registerTask('default', [ 'execute:fetch' ]);
  };
}());
