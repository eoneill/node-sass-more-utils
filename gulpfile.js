var gulp = require("gulp");

require("./build/lint")(gulp);
require("./build/test")(gulp, ["lint"]);
require("./build/release")(gulp);
require("./build/publish")(gulp);

gulp.task("default", ["test"]);
