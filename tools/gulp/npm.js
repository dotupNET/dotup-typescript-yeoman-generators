const
  spawn = require('cross-spawn')
  ;

function publish(done) {
  spawn.sync('npm', ['publish'], { stdio: 'inherit' });
  done();
}
module.exports.publish = publish;
// module.exports.postBuild = publish;
// gulp.task('npm-publish',
//   gulp.series(
//     build.build,
//     publish
//   )
// );
