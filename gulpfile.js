var gulp = require('gulp'),
    fs = require('fs'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify-es').default,
    replace = require('gulp-replace'),
    util = require('gulp-util'),
    injectString = require('gulp-inject-string'),
    stripComments = require('gulp-strip-comments'),
    stripCssComments = require('gulp-strip-css-comments'),
    postcss = require('gulp-postcss'),
    runSequence = require('run-sequence'),
    zip = require('gulp-zip'),
    removeMarkdown = require('gulp-remove-markdown');

var pjson = require('./package.json');
var sourceHeader = fs
    .readFileSync('./src/source-header.txt', 'utf8')
    .replace('{VERSION}', pjson.version);

gulp.task('txt:build', function () {
    return gulp.src('./README.md')
        .pipe(removeMarkdown('', {
            stripListLeaders: false,
            listUnicodeChar: '',
            gfm: true
        }))
        .pipe(replace(/([\r\n]{3,})/ig, '\r\n\r\n'))
        .pipe(replace(/(^[\r\n]+|[\r\n]+$)/ig, ''))
        .pipe(gulp.dest('./'));
});

gulp.task('scss:build', function () {
    return gulp.src('./src/sass/**/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', util.log))
        .pipe(stripCssComments({
            preserve: false
        }))
        .pipe(gulp.dest('./src/css'));
});

gulp.task('css:build', function () {
    return gulp.src(['./src/css/*.css'])
        .pipe(postcss([
            require('autoprefixer')({browsers: ['last 2 version', '> 10%']}),
            require('css-mqpacker')(),
        ]))
        .pipe(replace(/([\r\n]{2,})/igm, '\r\n'))
        .pipe(replace(/\@charset\s\"UTF\-8\"\;/igm, ''))
        .pipe(injectString.prepend('@charset "UTF-8";\n' + sourceHeader + '\n'))
        .pipe(gulp.dest('./css'));
});

gulp.task('css:minify', function () {
    return gulp.src(['./css/*.css', '!./css/*.min.css'])
        .pipe(postcss([
            require('cssnano')()
        ]))
        .pipe(replace(/\@charset\s\"UTF\-8\"\;/igm, ''))
        .pipe(injectString.prepend('@charset "UTF-8";\n' + sourceHeader + '\n'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('./css'));
});

gulp.task('js:build', function () {
    return gulp.src([
        './src/js/workarounds.js',

        './src/js/vendor/popper.min.js',
        './src/js/vendor/bootstrap.min.js',

        './src/js/vendor/bootstrap-fileselect.min.js',

        './src/js/vendor/jquery.datetimepicker.full.min.js',

        './src/js/vendor/jquery.easing.min.js',
        './src/js/vendor/jquery.nicescroll.min.js',

        './src/js/vendor/select2.min.js',

        './src/js/vendor/jquery-insert.js',

        './src/js/vendor/jquery-migrate.min.js',

        './src/js/theme/base.js',
        './src/js/theme/functions.js',
        './src/js/theme/navigation.js',
        './src/js/theme/collapse-history.js',

        './src/js/theme/init/select2.js',
        './src/js/theme/init/fileselect.js',
        './src/js/theme/init/datetimepicker.js'
    ])
        .pipe(stripComments())
        .pipe(concat('script.js'))
        .pipe(injectString.prepend(sourceHeader + '\n'))
        .pipe(gulp.dest('./js'));
});


gulp.task('js:minify', function () {
    return gulp.src(['./js/script.js'])
        .pipe(uglify().on('error', util.log))
        .pipe(rename({suffix: '.min'}))
        .pipe(injectString.prepend(sourceHeader + '\n'))
        .pipe(gulp.dest('./js'));
});

gulp.task('src:watch', function (callback) {
    gulp.watch(['./src/sass/**/*.scss'], function (callback) {
        runSequence('scss:build', 'css:build', 'css:minify', callback);
    });
    gulp.watch(['./src/js/**/*.js'], function (callback) {
        runSequence('js:build', 'js:minify', callback);
    });
    gulp.watch(['./README.md'], function (callback) {
        runSequence('txt:build', callback);
    });
});

gulp.task('src:rebuild', function (callback) {
    return runSequence('js:build', 'js:minify', 'scss:build', 'css:build', 'css:minify', 'txt:build', callback);
});

gulp.task('src:release', function (callback) {
    runSequence('js:build', 'js:minify', 'scss:build', 'css:build', 'css:minify', 'txt:build', 'zip:build', callback);
});

gulp.task('zip:build', function () {
    return gulp.src([
        './**',
        '!./api/cache/{,/**}',
        '!./package*',
        '!./gulpfile.js',
        '!./node_modules{,/**}',
        '!./nbproject{,/**}',
        '!./src{,/**}',
        '!./README.md',
        '!*.zip'
    ])
        .pipe(zip(pjson.name + '-' + pjson.version + '.zip'))
        .pipe(gulp.dest('./'));
});
