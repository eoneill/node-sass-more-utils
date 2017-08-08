"use strict";

module.exports = function(sass, sassUtils) {

  var SassJsMap = sassUtils.SassJsMap;

  function SassJsNumber($number) {
    if ($number === undefined) {
      this.value = 0;
      this.unit  = "";
    }
    else {
      this.value = $number.getValue();
      this.unit  = $number.getUnit();
    }
  }

  SassJsNumber.prototype.toString = function() {
    return "" + this.value + this.unit;
  };

  SassJsNumber.prototype.getValue = function() {
    return this.value;
  };

  SassJsNumber.prototype.getUnit = function() {
    return this.unit;
  };

  function SassJsColor($color) {
    if ($color === undefined) {
      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = 1;
    }
    else {
      this.r = $color.getR();
      this.g = $color.getG();
      this.b = $color.getB();
      this.a = $color.getA();
    }
  }

  SassJsColor.prototype.toString = function() {
    return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
  };

  SassJsColor.prototype.getR = function() {
    return this.r;
  };

  SassJsColor.prototype.getG = function() {
    return this.g;
  };

  SassJsColor.prototype.getB = function() {
    return this.b;
  };

  SassJsColor.prototype.getA = function() {
    return this.a;
  };

  function getJSType(value) {
    var type = (typeof value);
    var constructorType;
    var supportedConstructors = ["array", "map", "sassjsnumber", "sassjscolor", "sassjsmap"];
    var constructorMappings = {
      sassjsmap: "map"
    };

    // if it's an object, we need to inspect it further
    if (type === "object") {
      if (!value) {
        type = "null";
      }
      else {
        constructorType = value && value.constructor && value.constructor.name.toLowerCase();
        if (constructorType) {
          // if it's a supported constructor, use that as the type
          if (supportedConstructors.indexOf(constructorType) !== -1) {
            return constructorMappings[constructorType] || constructorType;
          }
          // if it's constructor started with `Sass`, treat it as type `sass`
          else if (constructorType.indexOf("sass") === 0) {
            return "sass";
          }
        }
      }
    }
    return type;
  }

  var converters = {
    toJS: {
      "list": function($list, options) {
        var i = 0;
        var len = $list.getLength();
        var array = [];
        var value;

        for (; i < len; i++) {
          value = $list.getValue(i);
          array.push(options.shallow ? value : toJS(value, options));
        }

        // keep track of the separator so we can convert this back to Sass if needed
        array.sassSeparator = $list.getSeparator();

        return array;
      },
      "map": function($map, options) {
        var sassJsMap = new SassJsMap($map);
        var jsMap = new Map();

        sassJsMap.forEach(function(value, key) {
          key = toJS(key, options);
          value = options.shallow ? value : toJS(value, options);
          jsMap.set(key, value);
        });

        return jsMap;
      },
      "null": function() {
        return null;
      },
      "bool": function($bool) {
        return $bool.getValue();
      },
      "string": function($str) {
        return $str.getValue();
      },
      "color": function($color) {
        return new SassJsColor($color);
      },
      "number": function($number) {
        return new SassJsNumber($number);
      },
      // no primitive mapping, so just return the Sass object
      "default": function($value) {
        return $value;
      }
    },
    toSass: {
      "sass": function($value) {
        // it's already a Sass value, so just return it...
        return $value;
      },
      "array": function(array, options) {
        var separator = array.sassSeparator;
        // defaults to using comma separator if not set
        separator = separator === undefined ? options.separator : separator;
        separator = separator === undefined ? true : separator;

        var $list = sass.types.List(array.length, separator);
        array.forEach(function(item, index) {
          $list.setValue(index, toSass(item, options));
        });
        return $list;
      },
      "sassjsnumber": function(number) {
        return sass.types.Number(number.value, number.unit);
      },
      "sassjscolor": function(color) {
        return sass.types.Color(color.r, color.g, color.b, color.a);
      },
      "number": function(number, options) {
        return sass.types.Number(number, options.unit || "");
      },
      "boolean": function(bool) {
        return sass.types.Boolean(bool);
      },
      "string": function(str) {
        return sass.types.String(str);
      },
      "object": function(obj, options) {
        var map = new SassJsMap();
        if (obj instanceof Map || obj instanceof SassJsMap) {
          obj.forEach(function(item, key) {
            map.set(toSass(key, options), toSass(item, options));
          });
        }
        else {
          Object.keys(obj).forEach(function(key) {
            if (options.excludeNull && obj[key] === null) {
              return;
            }
            map.set(toSass(key, options), toSass(obj[key], options));
          });
        }
        return map.toSassMap();
      },
      "map": function(obj, options) {
        var map = new SassJsMap();
        obj.forEach(function(item, key) {
          if (options.excludeNull && item === null) {
            return;
          }
          map.set(toSass(key, options), toSass(item, options));
        });
        return map.toSassMap();
      },
      "default": function() {
        // unkown type, return `null`
        return sass.types.Null.NULL;
      }
    }
  };

  function toX(converter, type, value, options) {
    options = options === undefined ? {} : options;
    var r = (converter[type] || converter.default)(value, options);
    return r;
  }

  function toJS(value, options) {
    return toJSPublic(value, options);
  }

  function toSass(value, options) {
    return toSassPublic(value, options);
  }

  function toJSPublic(value, options) {
    var type = sassUtils.typeOf(value);
    return toX(converters.toJS, type, value, options);
  }

  function toSassPublic(value, options) {
    var type = getJSType(value);
    return toX(converters.toSass, type, value, options);
  }

  return {
    toJS: toJSPublic,
    toSass: toSassPublic,

    SassJsNumber: SassJsNumber,
    SassJsColor: SassJsColor
  };
};
