'use strict';

/**
* Module dependencies.
*
*/

var fs = require('fs');
var path = require('path');

/**
* Uso: removeFiles = require('./commons).removeFiles;
removeFiles(dir);
*/
exports.removeFiles = function removeFiles(dir){
  if (!dir) {
    return;
  }

  fs.readdir(dir, (err, files) => {
    console.log('Removing files from ' + dir);
    if (err) {
      throw error;
    }
    for (const file of files) {
      fs.unlink(path.join(dir, file), err => {
        if (err) {
          throw error;
        }
      });
    }
    console.log('SUCCESS: Files removed from ' + dir);
  });

}
