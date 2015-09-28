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

var gulp            = require('gulp');
var browserify      = require('browserify');
var source          = require('vinyl-source-stream');
var buffer          = require('vinyl-buffer');
var uglify          = require('gulp-uglify');
var handlebars      = require('gulp-handlebars');
var defineModule    = require('gulp-define-module');
var jshint          = require('gulp-jshint');
var wait            = require('gulp-wait');
var runSequence     = require('gulp-run-sequence');
var minifyCss       = require('gulp-minify-css');
var filter          = require('gulp-filter');
var bower           = require('main-bower-files');
var concat          = require('gulp-concat');

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

gulp.task('minifyCss', function() {
    return gulp.src(config.style + '/style.css')
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(gulp.dest(config.style));
});

gulp.task('templates',function() {
    return gulp.src('templates/**/*.hbs')
        .pipe(handlebars())
        .pipe(defineModule('node'))
        .pipe(gulp.dest('javascripts/templates/'))
        .pipe(wait(1000));
});

gulp.task('lint',function() {
    return gulp.src([
            '!' + config.src + '/extern.js',
            '!' + config.styles + '/extern.css',
            config.src + '**/*.js',
            '!' + config.src + 'templates/**/*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build', function () {
    return doBuild(false);
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
        .pipe( filter('**/*.css') ) // filter css files
        .pipe( minifyCss({compatibility: 'ie8'}) )
        .pipe( concat('extern.css') )
        .pipe( gulp.dest( './stylesheets/' ) );
});

gulp.task('minify',function() {
    return doBuild(true);
});

gulp.task('watch',function () {
    gulp.watch(config.src + '**/*.js', ['lint','build']);
    gulp.watch(config.templates + '**/*.hbs', ['templates']);
});

gulp.task('install',function(done) {
    runSequence('templates',['lint'],['build','build-extern-js','build-extern-css'], done);
});
gulp.task('deploy',function(done) {
    runSequence('templates',['minifyCss','lint'],['minify','build-extern-js','build-extern-css'], done);
});
gulp.task('default', function(done) {
    runSequence('templates',['lint'],['build','build-extern-js','build-extern-css'],'watch', done);
});
