const
  gulp = require('gulp'),
  del = require('del'),
  tsc = require('gulp-typescript'),
  sourcemaps = require('gulp-sourcemaps'),
  Config = require('../../gulpfile.config')
  ;

const config = new Config();
const tsProject = tsc.createProject('tsconfig.json');

const keys = Object.freeze({ 
  build: 'build',
  clean: 'build-clean',
  compile: 'build-compile',
  watch: 'build-watch'
});
module.exports.keys = keys;

/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
function clean() {
  return del([config.targetPath]);
}
module.exports.clean = clean;
gulp.task(keys.clean, clean);

/**
 * Compile TypeScript
 */
function compile() {

  var tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());

  tsResult.dts.pipe(gulp.dest(config.targetPath));

  return tsResult.js
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.targetPath))
    ;
}
module.exports.compile = compile;
gulp.task(keys.compile, compile);

/**
 * Watch for changed TypeScript files
 */
function watch(){
  return gulp.watch([config.tsSourceFiles], gulp.series(keys.compile));
}
module.exports.watch = watch;
gulp.task(keys.watch, watch);

/**
 * Build series
 */
gulp.task(keys.build,
  gulp.series(
    keys.clean,
    keys.compile
  )
);
