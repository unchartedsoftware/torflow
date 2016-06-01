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
var jshint = require('gulp-jshint');
var merge = require('merge-stream');

var config = {
    deployDirs: [
        './bin/**',
        './data/**',
        './public/**',
        './routes/**',
        './ingest/**',
        './util/**',
        './views/**',
        './db/**'
    ]
};

function copyDirs(subDir) {
    return merge(
        // root files
        gulp.src(['package.json'], {
            dot: true
        })
        .pipe(gulp.dest('./deploy/'+subDir+'/')),
        // public files
        gulp.src(['app.js', 'config.js', 'package.json', '.jshintrc'])
            .pipe(gulp.dest('./deploy/'+subDir+'/build/')),
        // dirs
        gulp.src( config.deployDirs, {
            base: '.',
            dot: true
        })
        .pipe( gulp.dest('./deploy/'+subDir+'/build') )
    );
}

gulp.task('copyApp', function() {
    return copyDirs('app');
})

gulp.task('copyIngest', function() {
    return copyDirs('ingest');
})

gulp.task('copyDemo', function() {
    return copyDirs('demo');
})

gulp.task('copy', ['copyApp', 'copyIngest', 'copyDemo'], function() {
});

gulp.task('lint',function() {
    return gulp.src([
            './util/**/*.js',
            './routes/**/*.js',
            './db/**/*.js',
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint','copy']);
