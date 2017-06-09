import { protoCache, querySelector } from './shared'

export function extendElementProp (base, key, prop, irrelevantCb) {
  if (prop instanceof Function) {
    base[key] = function () {
      const args = arguments
      const sum = this.map(item => item[key].apply(item, args))
      return isRelevantCollection(sum) ? sum : irrelevantCb(sum, this)
    }
  } else {
    propGetSetWithProp(base, key)
  }
}
// Sets the set/get methods of a property as the Apheleia.prop method
export function propGetSetWithProp (obj, key) {
  Object.defineProperty(obj, key, {
    get () {
      return this.prop(key)
    },
    set (value) {
      this.prop(key, value)
    },
  })
}

// Check if what's passed is a string
export function isStr (maybeStr) {
  return '' + maybeStr === maybeStr
}

// Check if what's passed is to be considered a colletion
export function isArrayLike (maybeCollection) {
  return (
    maybeCollection && !isStr(maybeCollection) && maybeCollection.length != null
  )
}

export function isRelevantCollection (collection) {
  return collection[0] != null || collection[collection.length - 1] != null
}

// Slice a array-like collection
export function slice (what, from) {
  return protoCache.Array.slice.call(what, from || 0)
}

// Parses the passed context
export function aphParseContext (elemOrAphOrStr) {
  return elemOrAphOrStr instanceof Node
    ? elemOrAphOrStr // If already a html element
    : isStr(elemOrAphOrStr)
        ? querySelector(elemOrAphOrStr, document)[0] // If string passed let's search for the element on the DOM
        : isArrayLike(elemOrAphOrStr)
            ? elemOrAphOrStr[0] // If already an collection
            : document // Return the document.
}

// Parses the elements passed to aph()
let documentFragment
export function aphParseElements (strOrCollectionOrElem, ctx) {
  // If string passed
  if (isStr(strOrCollectionOrElem)) {
    // If creation string, create the element
    if (/<.+>/.test(strOrCollectionOrElem)) {
      if (!documentFragment) {
        documentFragment = document.implementation.createHTMLDocument()
      }
      documentFragment.body.innerHTML = strOrCollectionOrElem
      return documentFragment.body.childNodes
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