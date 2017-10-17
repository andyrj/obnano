import patchFactory from "./patch";
import { autorun } from "post-js";

function hydrate(element) {
  return element
    ? {
        type: element.nodeName.toLowerCase(),
        props: {},
        children: [].map.call(element.childNodes, function(element) {
          return element.nodeType === 3 ? element.nodeValue : hydrate(element);
        })
      }
    : element;
}

/**
 * app() renders vdom into a target in the browser document.  It only 
 * renders when observable values in store are changed that are 
 * currently referenced in the view function.
 * 
 * @export
 * @param {any} store - instance of Store(state, actions) 
 * @param {any} view - view function with store as only parameter
 * @param {any} target - HTMLElement where this app() should render
 * @returns {store} store instance that was passed to app()
 */
export function app(store, view, target) {
  const invoke = [];
  const patch = patchFactory(invoke);
  let oldNodes;
  target = target || document.body;
  oldNodes = hydrate(target.children[0]);
  autorun(() => {
    const newNodes = view(store);
    patch(target, target.childNodes[0], oldNodes, newNodes);
    oldNodes = newNodes;
    while (invoke.length > 0) {
      invoke.shift()();
    }
  });
  return store;
}
