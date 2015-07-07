"use strict";

module.exports = function(sass, sassUtils) {

  var SassJsMap = sassUtils.SassJsMap;

  function noop() {}

  function defineProps(toObj, props, fromObj, addGetterSetterFns) {
    toObj = toObj || {};
    if (!fromObj) {
      return toObj;
    }

    props.forEach(function(prop) {
      var propFn = prop.replace(/(?:^|-|_)([a-z])/gi, function() {
        return arguments[1].toUpperCase();
      });

      var fnNames = {
        get: "get" + propFn,
        set: "set" + propFn
      };

      var fns = {
        get: (fromObj[fnNames.get] || noop).bind(fromObj),
        set: (fromObj[fnNames.set] || noop).bind(fromObj)
      };

      Object.defineProperty(toObj, prop, {
        enumerable: true,
        get: fns.get,
        set: fns.set
      });

      if (addGetterSetterFns) {
        toObj[fnNames.get] = fns.get;
        toObj[fnNames.set] = fns.set;
      }
    });

    return toObj;
  }

  function SassJsNumber($number, options) {
    options = options || {};
    $number = $number || sass.types.Number();
    defineProps(this, ["value", "unit"], $number, !!options.addSetterGetterFunctions);
  }
  SassJsNumber.prototype.toString = function() {
    var $number = sass.types.Number(this.value, this.unit);
    return sassUtils.sassString($number);
  };

  function SassJsColor($color, options) {
    options = options || {};
    $color = $color || sass.types.Color();
    defineProps(this, ["r", "g", "b", "a"], $color, !!options.addSetterGetterFunctions);
  }
  SassJsColor.prototype.toString = function() {
    var $color = sass.types.Color(this.r, this.g, this.b, this.a);
    return sassUtils.sassString($color);
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
      "color": function($color, options) {
        return new SassJsColor($color, options);
      },
      "number": function($number, options) {
        return new SassJsNumber($number, options);
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
    options = options || {};
    type = options.type || type;
    var r = (converter[type] || converter.default)(value, options);
    return r;
  }

  function toJS(value, options) {
    options = options || {};
    delete options.type;
    return toJSPublic(value, options);
  }

  function toSass(value, options) {
    options = options || {};
    delete options.type;
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
