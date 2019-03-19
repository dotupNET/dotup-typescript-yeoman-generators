const
  gulp = require('gulp'),
  del = require('del'),
  ghPages = require('gulp-gh-pages')
  gulpTypedoc = require('gulp-typedoc'),
  Config = require('../../gulpfile.config')
  ;

var config = new Config();

/**
 * Remove all generated docs.
 */
function clean() {
  return del([config.docsPath]);
}
module.exports.clean = clean;
gulp.task('docs-clean', clean);

/**
 * Generate typedoc documents
 */
function build() {
  return gulp
    .src([config.tsSourceFiles])
    .pipe(gulpTypedoc({
      // TypeScript options
      module: "commonjs",
      includeDeclarations: false,
      exclude: "./**/*+(index|.spec|.test|.e2e).ts",

      // TypeDoc options (see typedoc docs)
      out: config.docsPath,
      mode: "file",
      excludeNotExported: false,
      ignoreCompilerErrors: false,
      version: true
    }))
    ;
}
module.exports.build = build;
gulp.task('docs-build', build);

/**
 * Publish typedoc documents to gh-pages
 */
function publish() {
  return gulp
    .src(config.docsFiles)
    .pipe(ghPages())
    ;
}
module.exports.publish = publish;
gulp.task('docs-publish', publish);
