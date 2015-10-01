'use strict';

var gulp = require('gulp'),
	clean = require('gulp-clean'),
	path = require('path'),
	Server = require('karma').Server,
	concat = require('gulp-concat'),
	templateCache = require('gulp-angular-templatecache'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	ngAnnotate = require('gulp-ng-annotate'),
	browserSync = require('browser-sync'),
	coveralls = require('gulp-coveralls'),
	shell = require('gulp-shell');


// Use the gulp-angular-templatecache in order to create JS file of HTML templates to
// make it easier to use in AngularJS directive
gulp.task('templates', function () {
	return gulp.src('src/**/*.html')
		.pipe(templateCache('templates.tmp',
			{
				module: 'hm.readmore'
			}
		))
		.pipe(gulp.dest('.'));
});

gulp.task('concat', ['templates'], function () {
	return gulp.src(['./src/readmore.js', 'templates.tmp'])
		.pipe(concat('readmore.js'))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('clean', ['concat'], function () {
	gulp.src('./*.tmp', {read: false})
		.pipe(clean());
});

// Need to do ngAnnotate before uglify in order to keep the angular dependency injections after compress
gulp.task('compress', ['concat'], function () {
	return gulp.src('dist/readmore.js')
		.pipe(ngAnnotate())
		.pipe(uglify())
		.pipe(rename({
			extname: '.min.js'
		}))
		.pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['templates', 'concat', 'compress', 'clean']);

gulp.task('karma', ['build'], function (done) {
	new Server({
		configFile: path.join(__dirname, '/karma.conf.js'),
		singleRun: true
	}, done).start();
});

gulp.task('coveralls', function () { // 2nd arg is a dependency: 'karma' must be finished first.
	// Send results of istanbul's test coverage to coveralls.io.
	return gulp.src('gulpfile.js', {read: false}) // You have to give it a file, but you don't have to read it.
		.pipe(shell('cat coverage/report-lcov/lcov.info | node_modules/coveralls/bin/coveralls.js'));
});

gulp.task('test', ['karma', 'coveralls']);

gulp.task('browser-sync', function () {
	browserSync.init(
		['./dist/*.*', './example/*.*'], {
			server: {
				baseDir: ['example'],
				routes: {
					'/bower_components': 'bower_components',
					'/dist': 'dist'
				}
			}
		});
});

gulp.task('watch', ['build', 'browser-sync'], function () {
	gulp.watch('src/**/*.*', ['build']);
});
