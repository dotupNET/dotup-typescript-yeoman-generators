const
  gulp = require('gulp'),
  del = require('del'),
  Config = require('../../gulpfile.config')
  ;

const config = new Config();

function clean() {
  const f = config.statics.map(x => x.targetPath);
  return del(f);
}
module.exports.clean = clean;
gulp.task('statics-clean', clean);

function postBuild() {
  const x = config
    .statics.map(s => {
      return getCopyStream(gulp, s.sourcePath, s.targetPath, { dot: true });
    })
    .reduce((p, c) => p); // :)
  return x;
}
module.exports.postBuild = postBuild;
gulp.task('statics-copy', postBuild);

function getCopyStream(g, source, target, opts) {
  return g
    .src(source, opts)
    .pipe(gulp.dest(target));
}
