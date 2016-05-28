var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    concatCss = require('gulp-concat-css'),
    concat = require('gulp-concat'),
    htmlreplace = require('gulp-html-replace'),
    connect = require('gulp-connect');

var path = {
    INDEX_HTML: 'dev/index.html',
    TEMPLATES: ['dev/templates/*.html', 'dev/templates/**/*.html'],
    APPSCRIPTS: ['dev/js/*.js', 'app/js/**/*.js'],
    STYLES: ['dev/css/*.css'],

    DEST: 'prod',
    DEST_VIEWS: 'prod/templates/',
    DEST_CSS: 'prod/css/',
    DEST_CSS_OUT: 'style.css',
    DEST_DEV: 'prod/js',
    DEST_JS_OUT: 'build.js'
};

// JSHint
gulp.task('lint', function() {
    gulp.src(path.APPSCRIPTS)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Copy index.html file to prod root
gulp.task('index', function(){
    gulp.src(path.INDEX_HTML)
        .pipe(htmlreplace({
            'css' : 'css/' + path.DEST_CSS_OUT,
            'js': 'js/' + path.DEST_JS_OUT
        }))
        .pipe(gulp.dest(path.DEST));
});

// Template files to dist/templates folder
gulp.task('templates', function(){
    gulp.src(path.TEMPLATES)
        .pipe(gulp.dest(path.DEST_VIEWS));
});

// Concat styles to prod/styles folder
gulp.task('css', function() {
    gulp.src(path.STYLES)
        .pipe(concatCss(path.DEST_CSS_OUT))
        .pipe(gulp.dest(path.DEST_CSS));
});

gulp.task('scripts', function() {
    gulp.src(path.APPSCRIPTS)
        .pipe(concat(path.DEST_JS_OUT))
        .pipe(gulp.dest(path.DEST_DEV))
        .pipe(uglify())
        .pipe(gulp.dest(path.DEST_DEV));
});

// run dev
gulp.task('dev', function () {
    connect.server({
        root: 'dev/',
        port: 3000
    });
});

// run prod locally for testing
gulp.task('production', function () {
    connect.server({
        root: 'prod/',
        port: 3000
    });
});

// prod task
gulp.task('build',
    ['lint', 'index', 'templates', 'css','scripts','production']
);