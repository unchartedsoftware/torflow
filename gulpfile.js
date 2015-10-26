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
