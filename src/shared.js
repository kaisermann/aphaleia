import Apheleia from './Apheleia.js'
import { extendObjectPrototype } from './helpers.js'

export const arrayPrototype = Array.prototype
export const doc = document

function aphSetWrapper () {
  Apheleia.prototype.set.apply(this, arguments)
  return this.aph.owner
}

export function wrap (what, owner) {
  let acc = []

  for (let i = 0, len = what.length, item; i < len; i++) {
    item = what[i]
    if (item == null) continue

    if (item.nodeType === 1) {
      // If we received a single node
      if (!~acc.indexOf(item)) {
        acc.push(item)
      }
    } else if (
      ((item instanceof NodeList || item instanceof Array) &&
        item[0].nodeType === 1) ||
      item instanceof Apheleia ||
      item instanceof HTMLCollection
    ) {
      // If we received a node list/collection
      for (let j = 0, len2 = item.length; j < len2; j++) {
        if (!~acc.indexOf(item[j])) {
          acc.push(item[j])
        }
      }
    } else {
      const methodsToBeCopied = ['map', 'filter', 'forEach', 'get', 'call']
      methodsToBeCopied.forEach(function (key) {
        what[key] = Apheleia.prototype[key]
      })
      what.set = aphSetWrapper
      what.aph = { owner: owner }

      extendObjectPrototype(what, item, instance => instance.aph.owner)

      return what
    }
  }

  return new Apheleia(acc, owner.aph.context, { owner: owner })
}
