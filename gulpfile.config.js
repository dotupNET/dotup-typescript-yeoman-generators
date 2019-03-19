'use strict';
const
  fs = require('fs'),
  path = require('path'),
  config = require('./tools/gulp/gulp.json')
  ;

class GulpConfig {

  constructor() {
    // Gulp files
    this.gulpFiles = [];

    // source
    this.sourcePath = 'src';
    this.tsSourceFiles = this.sourcePath + '/**/*.ts';

    // test
    this.testPath = 'test';
    this.testFiles = `${this.testPath}/**/*.ts`;
    // target
    this.targetPath = 'dist';
    // docs
    this.docsPath = 'docs';
    this.docsFiles = this.docsPath + '/**/*';

    this.loadAllFiles();
  }

  loadAllFiles() {
    const gulps = fs.readdirSync('./tools/gulp').filter(file => path.extname(file) === '.js');
    gulps.forEach(file => {
      if (config[path.basename(file, '.js')] === true) {
        this.gulpFiles.push(require('./tools/gulp/' + file));
      }
    });
  }

}
module.exports = GulpConfig;
