var gulp            = require('gulp');
var browserify      = require('browserify');
var source          = require('vinyl-source-stream');
var buffer          = require('vinyl-buffer');
var uglify          = require('gulp-uglify');
var handlebars      = require('gulp-handlebars');
var defineModule    = require('gulp-define-module');
var rename          = require('gulp-rename');
var less            = require('gulp-less');
var path            = require('path');
var jshint          = require('gulp-jshint');
var wait            = require('gulp-wait');
var runSequence     = require('gulp-run-sequence');
var minifyCss       = require('gulp-minify-css');

var config = {
    src: './javascripts/',
    style : './stylesheets/',
    less: './stylesheets/less/',
    templates : './templates/',
    helpers : './javascripts/helpers/',
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

gulp.task('less', function() {
    return gulp.src(config.less + '**/*.less')
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(gulp.dest(config.style));
});

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
            config.src + '**/*.js',
            '!' + config.src + 'extern/**/*.js',
            '!' + config.src + 'templates/**/*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build', function () {
    return doBuild(false);
});


gulp.task('minify',function() {
    return doBuild(true);
});

gulp.task('watch',function () {
    gulp.watch(config.less + '**/*.less', ['less'])
    gulp.watch(config.src + '**/*.js', ['lint','build']);
    gulp.watch(config.templates + '**/*.hbs', ['templates_build']);
});

gulp.task('templates_build',function(cb) {
   runSequence('templates',['build']);
});

gulp.task('install',function(cb) {
    runSequence('templates',['less','lint'],['build']);
});
gulp.task('deploy',function(cb) {
    runSequence('templates',['less','minifyCss','lint'],['minify']);
});
gulp.task('default', function(cb) {
    runSequence('templates',['less','lint'],['build'],'watch');
});