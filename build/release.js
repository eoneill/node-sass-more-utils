"use strict";

var git = require("gulp-git");
var bump = require("gulp-bump");
var prompt = require("gulp-prompt");
var tagVersion = require("gulp-tag-version");

var pkgSource = ["./package.json"];

module.exports = function(gulp, depends) {
  function increment(type) {
    console.log("type is...", type);
    // get all the files to bump version in
    return gulp.src(pkgSource)
      // bump the version number in those files
      .pipe(bump({type: type}))
      // save it back to filesystem
      .pipe(gulp.dest("./"))
      // commit the changed version number
      .pipe(git.commit("bump version"))
      // tag it in the repository
      .pipe(tagVersion());
  }

  gulp.task("release", depends, function(done) {
    return gulp.src(pkgSource)
      .pipe(prompt.prompt({
          type: "checkbox",
          name: "type",
          message: "What type of release would you like to do?",
          choices: ["patch", "minor", "major"]
      }, function(result){
        var type = result.type[0];
        if (type) {
          return increment(type);
        }
      }));
  });

  gulp.task("release:patch", depends, increment.bind(increment, "patch"));
  gulp.task("release:minor", depends, increment.bind(increment, "minor"));
  gulp.task("release:major", depends, increment.bind(increment, "major"));
};
