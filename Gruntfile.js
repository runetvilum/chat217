module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'couch-compile': {
            web: {
                files: {
                    'tmp/web.json': 'dist/web'
                }
            }
            
        },
        
        'couch-push': {
            web: {
                options: {
                    user: 'admin',
                    pass: 'rutv2327'
                },
                files: {
                    'http://bykongen.addin.dk/chat217': 'tmp/web.json'
                }
            }
            

        },
        copy: {
            web: {
                expand: true,
                cwd: 'www/',
                src: '**/*',
                dest: 'dist/web/_attachments'
            },
        },
        clean: ["dist/web/_attachments"]

        
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-couch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    

    // Default task(s).
    grunt.registerTask('default', ['clean','copy', 'couch-compile', 'couch-push']);
    
};