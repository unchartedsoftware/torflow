/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
