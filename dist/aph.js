(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('aph', factory) :
	(global.aph = factory());
}(this, (function () { 'use strict';

function propGetSetWithProp (obj, key) {
  Object.defineProperty(obj, key, {
    get: function get () {
      return this.prop(key)
    },
    set: function set (value) {
      this.prop(key, value);
    },
  });
}

// Check if what's passed is a string
function isStr (maybeStr) {
  return '' + maybeStr === maybeStr
}

// Check if what's passed is to be considered a colletion
function isArrayLike (maybeCollection) {
  return (
    maybeCollection && !isStr(maybeCollection) && maybeCollection.length != null
  )
}

function isRelevantCollection (collection) {
  return collection[0] != null || collection[collection.length - 1] != null
}

// Slice a array-like collection
function slice (what, from) {
  return protoCache.Array.slice.call(what, from || 0)
}

// Parses the passed context
function aphParseContext (elemOrAphOrStr) {
  return elemOrAphOrStr instanceof Node
    ? elemOrAphOrStr // If already a html element
    : isStr(elemOrAphOrStr)
        ? querySelector(elemOrAphOrStr, document)[0] // If string passed let's search for the element on the DOM
        : isArrayLike(elemOrAphOrStr)
            ? elemOrAphOrStr[0] // If already an collection
            : document // Return the document.
}

// Parses the elements passed to aph()
function aphParseElements (strOrCollectionOrElem, ctx) {
  // If string passed
  if (isStr(strOrCollectionOrElem)) {
    var isCreationStr = /<(\w*)\/?>/.exec(strOrCollectionOrElem);
    // If creation string, create the element
    if (isCreationStr) {
      return [document.createElement(isCreationStr[1])]
    }
    // If not a creation string, let's search for the elements
    return querySelector(strOrCollectionOrElem, ctx)
  }

  // If html element / window / document passed
  if (
    strOrCollectionOrElem instanceof Node ||
    strOrCollectionOrElem === window
  ) {
    return [strOrCollectionOrElem]
  }

  // If collection passed and
  // is not a string (first if, up there)
  if (isArrayLike(strOrCollectionOrElem)) {
    return strOrCollectionOrElem
  }

  if (strOrCollectionOrElem != null) {
    throw Error('aph: Invalid first parameter')
  }

  return []
}

var protoCache = {
  Array: Array.prototype,
};

function querySelector (selector, ctx) {
  ctx = aphParseContext(ctx);
  return /^#[\w-]*$/.test(selector) // if #id
    ? [window[selector.slice(1)]]
    : slice(
        /^\.[\w-]*$/.test(selector) // if .class
          ? ctx.getElementsByClassName(selector.slice(1))
          : /^\w+$/.test(selector) // if tag (a, span, div, ...)
              ? ctx.getElementsByTagName(selector)
              : ctx.querySelectorAll(selector) // anything else
      )
}

function flatWrap (what, owner) {
  var acc = [];
  for (var i = 0, item = (void 0); i < what.length; i++) {
    item = what[i];
    if (item instanceof Node || item == null) {
      // If we received a single node
      if (!~acc.indexOf(item)) {
        acc.push(item);
      }
    } else if (
      item instanceof NodeList ||
      item instanceof HTMLCollection ||
      item instanceof Apheleia ||
      item instanceof Array
    ) {
      // If we received a node list/collection
      for (var j = 0, len2 = item.length; j < len2; j++) {
        if (!~acc.indexOf(item[j])) {
          acc.push(item[j]);
        }
      }
    } else {
      var constructorName = what[0].constructor.name;

      what.prop = protoCache.Apheleia.prop;
      what.call = protoCache.Apheleia.call;
      what.owner = owner;

      if (!protoCache[constructorName]) {
        protoCache[constructorName] = Object.getPrototypeOf(what[0]);
      }

      // Let's get all methods of this instance and wrap them
      Object.getOwnPropertyNames(protoCache[constructorName]).forEach(function (key) {
        if (what[key] == null) {
          try {
            if (protoCache[constructorName][key] instanceof Function) {
              what[key] = function () {
                var arguments$1 = arguments;

                var result = this.map(function (i) {
                  return protoCache[constructorName][key].apply(i, arguments$1)
                });
                // Return the Apheleia Owner
                // if the result is a list of undefined
                return isRelevantCollection(result)
                  ? result
                  : owner
              };
            } else {
              propGetSetWithProp(what, key);
            }
          } catch (ex) {
            // If we reach this exception, we are probably dealing with a property / getter / setter
            propGetSetWithProp(what, key);
          }
        }
      });

      if (what.length != null) {
        what.map = protoCache.Apheleia.map;
        what.forEach = protoCache.Apheleia.forEach;
      }

      return what
    }
  }
  return new Apheleia(acc, document, { owner: owner })
}

var arrayProto = protoCache.Array;

var Apheleia = function Apheleia (elems, context, metaObj) {
  this.meta = metaObj || {};

  for (
    var list = aphParseElements(
      elems,
      (this.meta.context = aphParseContext(context)) // Sets current context
    ),
      len = (this.length = list.length); // Sets current length
    len--; // Ends loop when reaches 0
    this[len] = list[len] // Builds the array-like structure
  ){  }
};

// Wrapper for Node methods
Apheleia.prototype.call = function call (fnName) {
  var args = slice(arguments, 1);
  var sum = this.map(function (item) { return item[fnName].apply(item, args); });
  return isRelevantCollection(sum) ? sum : this
};

// Iterates through the elements with a 'callback(element, index)''
Apheleia.prototype.forEach = function forEach (cb) {
  // Iterates through the Apheleia object.
  // If the callback returns false, the iteration stops.
  for (
    var i = 0, len = this.length;
    i < len && cb.call(this, this[i], i++) !== false;

  ){  }
  return this
};

Apheleia.prototype.map = function map () {
  return flatWrap(arrayProto.map.apply(this, arguments), this)
};

Apheleia.prototype.filter = function filter () {
  return new Apheleia(
    arrayProto.filter.apply(this, arguments),
    this.meta.context,
    { owner: this }
  )
};

Apheleia.prototype.slice = function slice$$1 () {
  return new Apheleia(
    arrayProto.slice.apply(this, arguments),
    this.meta.context,
    { owner: this }
  )
};

// Creates a new Apheleia instance with the elements found.
Apheleia.prototype.find = function find (selector) {
  return new Apheleia(selector, this[0], { owner: this })
};

// Gets the specified element or the whole array if no index was defined
Apheleia.prototype.get = function get (index) {
  return +index === index ? this[index] : flatWrap(this)
};

// Node property manipulation method
Apheleia.prototype.prop = function prop (objOrKey, nothingOrValue) {
  if (isStr(objOrKey)) {
    return nothingOrValue == null
      ? this.map(function (elem) { return elem[objOrKey]; })
      : this.forEach(function (elem) {
        elem[objOrKey] = nothingOrValue;
      })
  }

  return this.forEach(function (elem) {
    for (var key in objOrKey) {
      elem[key] = objOrKey[key];
    }
  })
};

// CSS
Apheleia.prototype.css = function css (objOrKey, nothingOrValue) {
  if (isStr(objOrKey)) {
    return nothingOrValue == null
      ? this.map(function (elem) { return getComputedStyle(elem)[objOrKey]; })
      : this.forEach(function (elem) {
        elem.style[objOrKey] = nothingOrValue;
      })
  }

  return this.forEach(function (elem) {
    for (var key in objOrKey) {
      elem.style[key] = objOrKey[key];
    }
  })
};

Apheleia.prototype.remove = function remove () {
  return this.forEach(function (elem) {
    elem.parentNode.removeChild(elem);
  })
};

// Appends the passed html/aph
Apheleia.prototype.append = function append (futureContent) {
  return this.html(futureContent, function (parent, child) {
    parent.appendChild(child);
  })
};

Apheleia.prototype.appendTo = function appendTo (newParent) {
  new Apheleia(newParent).append(this);
  return this
};

// Prepends the passed html/aph
Apheleia.prototype.prepend = function prepend (futureContent) {
  return this.html(futureContent, function (parent, child) {
    parent.insertBefore(child, parent.firstChild);
  })
};

Apheleia.prototype.prependTo = function prependTo (newParent) {
  new Apheleia(newParent).prepend(this);
  return this
};

// Sets or gets the html
Apheleia.prototype.html = function html (children, cb) {
  // If there're no arguments
  // Let's return the html of the first element
  if (children == null) {
    return this.map(function (elem) { return elem.innerHTML; })
  }

  // Manipulating arrays is easier
  if (!Array.isArray(children)) {
    children = [children];
  }

  // If we receive any collections (arrays, lists, aph),
  // we must get its elements
  children = children.reduce(function (acc, item) {
    if (isArrayLike(item)) {
      return acc.concat(slice(item))
    }
    acc.push(item);
    return acc
  }, []);

  // If a callback is received as the second argument
  // let's pass the parent and child nodes
  // and let the callback do all the work
  if (cb instanceof Function) {
    return this.forEach(function (parent) { return children.forEach(function (child) { return cb(parent, child); }); }
    )
  }

  // If the second argument is not a valid callback,
  // we will rewrite all parents HTML
  return this.forEach(function (parent) {
    parent.innerHTML = '';
    children.forEach(function (child) {
      parent.innerHTML += isStr(child) ? child : child.outerHTML;
    });
  })
};

// Let's cache the prototype
protoCache.Apheleia = Apheleia.prototype;

// Extending the Array Prototype
var ignoreMethods = [
  'concat',
  'join',
  'copyWithin',
  'fill',
  'reduce',
  'reduceRight' ];

Object.getOwnPropertyNames(arrayProto).forEach(function (key) {
  if (!~ignoreMethods.indexOf(key) && protoCache.Apheleia[key] == null) {
    protoCache.Apheleia[key] = arrayProto[key];
  }
});

// Extending default HTMLElement methods and properties
var baseElement = document.createElement('div');
function extendElementProp (prop) {
  if (!protoCache.Apheleia[prop]) {
    if (baseElement[prop] instanceof Function) {
      protoCache.Apheleia[prop] = function () {
        return this.call.apply(this, [prop].concat(slice(arguments)))
      };
    } else {
      propGetSetWithProp(protoCache.Apheleia, prop);
    }
  }
}

for (var prop in baseElement) {
  extendElementProp(prop);
}
baseElement = null;

function aph (elems, context, metaObj) {
  return new Apheleia(elems, context, metaObj)
}

// Plugs in new methods to the Apheleia prototype
aph.fn = Apheleia.prototype;
aph.flatWrap = flatWrap;
aph.querySelector = querySelector;

return aph;

})));
