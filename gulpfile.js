/**
 * Welcome to your gulpfile!
 * The gulp tasks are split in several files in the gulp directory for better modularity.
 */
const
  gulp = require('gulp'),
  del = require('del'),
  build = require('./tools/gulp/build'),
  Config = require('./gulpfile.config')
  ;

// Load config and all gulp files.
var config = new Config();
config.loadAllFiles();

gulp.task('project-build',
  gulp.series(
    build.clean,
    build.compile,
    assetsCopy
  )
);

function assetsClean() {
  return del([`${config.targetPath}/assets`]);
}
gulp.task('assets-clean', assetsClean);

function assetsCopy() {
  return gulp
    .src(`${config.sourcePath}/assets/**`, { dot: true })
    .pipe(gulp.dest(`${config.targetPath}/assets/`))
    ;
}
gulp.task('assets-copy', assetsCopy);

gulp.task('assets-watch', function () {
  return gulp.watch([`${config.sourcePath}/assets`],
    gulp.series('assets-clean', 'assets-copy')
  );
});

gulp.task('watch-static',
  gulp.parallel(
    'assets-watch'
  ),
  function (done) {
    done();
  }
);
