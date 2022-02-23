var gulp = require("gulp");
var eslint = require("gulp-eslint");
var config = require("eyeglass-dev-eslint") || {};

// customize some of these...
var rules = config.rules || {};
rules["max-len"] = 0;
rules["brace-style"] = [2, "stroustrup"];
rules["max-depth"] = [1, 8];
config.rules = rules;

gulp.task("lint", function() {
    var jsSource = [
      "build/**/*.js",
      "lib/**/*.js",
      "test/**/*.js",
      "*.js"
    ];
    return gulp.src(jsSource)
        .pipe(eslint(config))
        .pipe(eslint.formatEach("stylish", process.stderr))
        .pipe(eslint.failOnError());
  });

require("./build/test")(gulp, gulp.series("lint"));
require("./build/release")(gulp);
require("./build/publish")(gulp);

gulp.task("default", gulp.series("test"));
