/**
 * Welcome to your gulpfile!
 * The gulp tasks are split in several files in the gulp directory for better modularity.
 */
const
  gulp = require('gulp'),
  Config = require('../../gulpfile.config')
  ;

var config = new Config();


function templatesCopy() {
  return gulp
    .src(`${config.sourcePath}/**/templates/**`, { dot: true })
    .pipe(gulp.dest(`${config.targetPath}/`))
    ;
}
module.exports.templatesCopy = templatesCopy;

gulp.task('yogen-copy-templates', templatesCopy);

