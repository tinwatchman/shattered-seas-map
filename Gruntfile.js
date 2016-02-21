/** Grunt Script to Minimize Report CSS & JS */
module.exports = function(grunt) {
    grunt.initConfig({
        uglify: {
            options: {
                mangle: {
                    except: ['ko', '$']
                },
                screwIE8: true
            },
            build: {
                files: {
                    'assets/js/reportvm.min.js': 'assets/js/reportvm.js'
                }
            }
        },
        cssmin: {
            build: {
                files: {
                    'assets/css/report.min.css': 'assets/css/report.css'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['uglify', 'cssmin']);
};