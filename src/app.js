import patchFactory from "./patch";
import { autorun, Store } from "./observable";

function hydrate(element) {
  return element
    ? {
        tag: element.nodeName.toLowerCase(),
        props: {},
        children: [].map.call(element.childNodes, function(element) {
          return element.nodeType === 3 ? element.nodeValue : hydrate(element);
        })
      }
    : element;
}

export function app({ state, actions, view }, target) {
  state = state || {};
  actions = actions || {};
  const invoke = [];
  const patch = patchFactory(invoke);
  const store = Store(state, actions);
  let isRendering = false;
  let oldNodes;
  target = target || document.body;
  function render() {
    const newNodes = view(store);
    patch(target, target.childNodes[0], oldNodes, newNodes);
    oldNodes = newNodes;
    while (invoke.length > 0) {
      invoke.shift()();
    }
    isRendering = false;
  }
  oldNodes = hydrate(target.children[0]);
  autorun(() => {
    if (!isRendering) {
      isRendering = true;
      requestAnimationFrame(render);
    }
  });
  return store;
}
