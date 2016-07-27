/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var handlebars = require('gulp-handlebars');
var defineModule = require('gulp-define-module');
var jshint = require('gulp-jshint');
var minifyCss = require('gulp-minify-css');
var filter = require('gulp-filter');
var bower = require('main-bower-files');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');

var config = {
    src: './javascripts/',
    style : './stylesheets/',
    templates : './templates/',
    dist: './'
};

function doBuild(shouldMinify) {
    var build = browserify('./javascripts/main.js', {
            debug: !shouldMinify,
            standalone: 'TorFlow'
        })
        .bundle()
        .on( 'error', function( e ) {
            console.log( e );
            this.emit('end');
        })
        .pipe( source( 'torflow.js' ) );
    if (shouldMinify) {
       build = build
           .pipe(buffer())
           .pipe(uglify({
               mangle : true
           }));
    }
    build.pipe( gulp.dest( config.dist ) );
    return build;
}

gulp.task('lint',function() {
    return gulp.src([
            config.src + '**/*.js',
            '!' + config.src + '/extern.js',
            '!' + config.src + '/templates/**/*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build-js', function () {
    return doBuild(false);
});

gulp.task('minify-js',function() {
    return doBuild(true);
});

gulp.task('build-css', function () {
    return gulp.src([
            config.style + '/**/bootstrap.css',
            config.style + '/**/*.css',
            '!' + config.style + '/extern.css',
            '!' + config.style + '/extern/**/*.css'
        ])
        .pipe( minifyCss({ keepSpecialComments: 0 }) )
        .pipe( concat('torflow.css') )
        .pipe( gulp.dest( config.dist ) );
});

gulp.task('build', ['build-js', 'build-css'], function () {
});

gulp.task('minify', ['minify-js', 'build-css'], function () {
});

gulp.task('build-extern-js', function() {
    return gulp.src( bower() )
        .pipe( filter('**/*.js') ) // filter js files
        .pipe( concat('extern.js') )
        .pipe( uglify() )
        .pipe( gulp.dest( './javascripts/' ) );
});

gulp.task('build-extern-css', function() {
    return gulp.src( bower() )
        .pipe( filter(['**/*.css', '!jssocials/**/jssocials-theme*.css']) ) // filter css files
        .pipe( minifyCss({ keepSpecialComments: 0 }) )
        .pipe( concat('extern.css') )
        .pipe( gulp.dest( './stylesheets/' ) );
});

gulp.task('build-templates',function() {
    return gulp.src('templates/**/*.hbs')
        .pipe(handlebars())
        .pipe(defineModule('node'))
        .pipe(gulp.dest('javascripts/templates/'));
});

gulp.task('watch',function () {
    gulp.watch(config.src + '**/*.js', ['lint','build-js']);
    gulp.watch(config.style + '**/*.css', ['build-css']);
    gulp.watch(config.templates + '**/*.hbs', ['build-templates']);
});

gulp.task('install',function(done) {
    runSequence('build-templates', ['lint'], ['build','build-extern-js','build-extern-css'], done);
});
gulp.task('deploy',function(done) {
    runSequence('build-templates', ['lint'], ['minify','build-extern-js','build-extern-css'], done);
});
gulp.task('default', function(done) {
    runSequence('build-templates', ['lint'], ['build','build-extern-js','build-extern-css'], 'watch', done);
});
