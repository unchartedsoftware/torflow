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

gulp.task('copy', function() {
    // app
    gulp.src(['app.js', 'config.js', 'package.json'])
        .pipe(gulp.dest('./deploy/app/build/'));
    gulp.src('bin/**')
        .pipe(gulp.dest('./deploy/app/build/bin/'));
    gulp.src('data/**')
        .pipe(gulp.dest('./deploy/app/build/data/'));
    gulp.src('public/**')
        .pipe(gulp.dest('./deploy/app/build/public/'));
    gulp.src('routes/**')
        .pipe(gulp.dest('./deploy/app/build/routes/'));
    gulp.src('util/**')
        .pipe(gulp.dest('./deploy/app/build/util/'));
    gulp.src('views/**')
        .pipe(gulp.dest('./deploy/app/build/views/'));
    gulp.src('db/**')
        .pipe(gulp.dest('./deploy/app/build/db/'));

    // ingest
    gulp.src(['config.js', 'package.json'])
        .pipe(gulp.dest('./deploy/ingest/build/'));
    gulp.src('package.json')
        .pipe(gulp.dest('./deploy/ingest/build/'));
    gulp.src('bin/ingest')
        .pipe(gulp.dest('./deploy/ingest/build/bin/'));
    gulp.src('ingest/**')
        .pipe(gulp.dest('./deploy/ingest/build/ingest/'));
    gulp.src('db/**')
        .pipe(gulp.dest('./deploy/ingest/build/db/'));
    gulp.src('util/**')
        .pipe(gulp.dest('./deploy/ingest/build/util/'));
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
