# node-sass-more-utils

[![Build Status](https://travis-ci.org/eoneill/node-sass-more-utils.svg)](https://travis-ci.org/eoneill/node-sass-more-utils)
[![Version](https://img.shields.io/npm/v/node-sass-more-utils.svg)](https://www.npmjs.com/package/node-sass-more-utils)
[![License](https://img.shields.io/npm/l/node-sass-more-utils.svg)](./LICENSE)


This package provides _even more_ helpers for working with the Sass values that `node-sass` passes to javascript functions that are exposed as sass functions.

## Installation

```sh
npm install node-sass-more-utils --save
```

## Usage

```js
var sass = require("node-sass");
var sassUtils = require("node-sass-utils")(sass);
var moreSassUtils = require("node-sass-more-utils")(sass, sassUtils);

var $example = moreSassUtils.toSass("Hello");
```

## API

### `moreSassUtils.toJS(value, [options])`

Converts a Sass value to a JS value.

Examples:

```js
var $example = sass.types.String("Hello");
var example = moreSassUtils.toJS($example);

var $number = sass.types.Number(15, "px");
var number = moreSassUtils.toJS($number);
```

### `moreSassUtils.toSass(value, [options])`

Converts a JS value to a Sass value.

Examples:

```js
var example = "Hello";
var $example = moreSassUtils.toSass(example);

var simple = [1, 2, 3, 4];
var $simple = moreSassUtils.toSass(simple);

var list = [1, 2, 3, 4];
var $commaSeparated = moreSassUtils.toSass(list, {
  separator: true // default
});
var $spaceSeparated = moreSassUtils.toSass(list, {
  separator: false
});

var simpleNumber = 10;
var $simpleNumber = moreSassUtils.toSass(simpleNumber);
var $simpleNumberWithUnits = moreSassUtils.toSass(simpleNumber, {
  unit: "px"
});
```