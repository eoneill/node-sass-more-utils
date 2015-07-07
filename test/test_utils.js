"use strict";

var assert = require("assert");
var sass = require("node-sass");
var sassUtils = require("node-sass-utils")(sass);
var moreSassUtils = require("../index")(sass, sassUtils);

var sassString = sassUtils.sassString.bind(sassUtils);
var toSass = moreSassUtils.toSass;
var toJS = moreSassUtils.toJS;

describe("toSass", function () {
  // numbers
  it("should cast a number to a Sass number", function (done) {
    var $result = toSass(15);
    assert.equal("15", sassString($result));
    done();
  });

  it("should cast a number to a Sass number with units", function (done) {
    var $result = toSass(15, {
      unit: "px"
    });
    assert.equal("15px", sassString($result));
    done();
  });

  // arrays
  it("should cast an array to a list", function (done) {
    var array = [1, 2, 3, 4];
    assert.equal("(1, 2, 3, 4)", sassString(toSass(array)));
    done();
  });

  it("should cast an array to a list with custom separator (as a property)", function (done) {
    var array = [1, 2, 3, 4];
    array.sassSeparator = false;
    assert.equal("(1 2 3 4)", sassString(toSass(array)));
    done();
  });

  it("should cast an array to a list with custom separator (as an option)", function (done) {
    assert.equal("(1 2 3 4)", sassString(toSass([1, 2, 3, 4], {
      separator: false
    })));
    done();
  });

  // strings
  it("should cast a string", function (done) {
    assert.equal("abc", sassString(toSass("abc")));
    done();
  });

  // null
  it("should cast null", function (done) {
    assert.equal("null", sassString(toSass(null)));
    done();
  });

  // undefined
  it("should cast undefined to null", function (done) {
    assert.equal("null", sassString(toSass(undefined)));
    done();
  });

  // object
  it("should cast an object to a Sass map", function (done) {
    assert.equal("(a: 1, b: 2)", sassString(toSass({
      a: 1,
      b: 2
    })));
    done();
  });

  // nested objects
  it("should cast nested objects to a Sass map", function (done) {
    assert.equal("(a: 1, b: (c: 3, d: 4))", sassString(toSass({
      a: 1,
      b: {
        c: 3,
        d: 4
      }
    })));
    done();
  });

  // maps
  it("should cast map to a Sass map", function (done) {
    var map = new Map();
    map.set("a", 1);
    map.set("b", 2);
    assert.equal("(a: 1, b: 2)", sassString(toSass(map)));
    done();
  });

  // nested maps
  it("should cast nested maps to a Sass map", function (done) {
    var map = new Map();
    var map2 = new Map();
    map.set("a", 1);
    map.set("b", map2);
    map2.set("c", 3);
    map2.set("d", 4);
    assert.equal("(a: 1, b: (c: 3, d: 4))", sassString(toSass(map)));
    done();
  });

  // complex test
  it("should cast nested and multiple types", function (done) {
    var map = new Map();
    map.set("a", [1, 2, 3, 4]);
    var test = [{
      a: 1,
      b: false,
      c: null,
      map: map
    }, "example", map];
    test.sassSeparator = false;
    assert.equal("((a: 1, b: false, c: null, map: (a: (1, 2, 3, 4))) example (a: (1, 2, 3, 4)))", sassString(toSass(test)));
    done();
  });
});

describe("toJS", function () {
  // numbers
  it("should cast a Sass number to a SassJsNumber", function (done) {
    var $num = sass.types.Number(15);
    var result = toJS($num);
    assert.equal(true, result instanceof moreSassUtils.SassJsNumber);
    assert.equal(15, result.value);
    assert.equal("", result.unit);
    done();
  });

  it("should cast a Sass number with units to a SassJsNumber", function (done) {
    var $num = sass.types.Number(15, "px");
    var result = toJS($num);
    assert.equal(true, result instanceof moreSassUtils.SassJsNumber);
    assert.equal(15, result.value);
    assert.equal("px", result.unit);
    done();
  });

  // strings
  it("should cast a string", function (done) {
    var str = "abc";
    var $str = toSass(str);
    assert.equal(str, toJS($str));
    done();
  });

  // null
  it("should cast null", function (done) {
    assert.equal(null, toJS(sass.types.Null.NULL));
    done();
  });

  // maps
  it("should cast Sass map to a map", function (done) {
    var map = new Map();
    map.set("a", 1);
    map.set("b", 2);
    var $map = toSass(map);
    var result = toJS($map);
    assert.equal(map.get("a"), result.get("a"));
    assert.equal(map.get("b"), result.get("b"));
    done();
  });

  it("should cast nested Sass map to a map", function (done) {
    var map = new Map();
    var map2 = new Map();
    map.set("a", 1);
    map.set("b", map2);
    map2.set("c", 3);
    map2.set("d", 4);
    var $map = toSass(map);
    var result = toJS($map);
    assert.equal(map.get("a"), result.get("a"));
    assert.equal(map.get("b").get("c"), result.get("b").get("c"));
    assert.equal(map.get("b").get("d"), result.get("b").get("d"));
    done();
  });
});
