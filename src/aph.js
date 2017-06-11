import Apheleia from './Apheleia.js'
import { arrayProto, querySelector, flatWrap } from './shared.js'
import { assignMethodsAndProperties, createElement } from './helpers.js'

export default function aph (elems, context, metaObj) {
  return new Apheleia(elems, context, metaObj)
}

aph.fn = Apheleia.prototype
aph.flatWrap = flatWrap
aph.querySelector = querySelector

// Extending the Array Prototype
const newCollectionMethods = ['map', 'filter']
// Here is where all the magic happens
newCollectionMethods.forEach(key => {
  aph.fn[key] = function () {
    return flatWrap(arrayProto[key].apply(this, arguments), this)
  }
})

// Irrelevant methods on the context of an Apheleia Collection
const ignoreMethods = [
  'concat',
  'copyWithin',
  'fill',
  'join',
  'reduce',
  'reduceRight',
  'slice',
  'splice',
  'sort',
]

Object.getOwnPropertyNames(arrayProto).forEach(key => {
  if (!~ignoreMethods.indexOf(key) && aph.fn[key] == null) {
    aph.fn[key] = arrayProto[key]
  }
})

// Extending default HTMLElement methods and properties
assignMethodsAndProperties(aph.fn, createElement('<div>'), instance => instance)
