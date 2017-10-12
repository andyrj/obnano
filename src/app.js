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
  const invoke = [];
  const patch = patchFactory(invoke);
  const store = Store(state, actions);
  let isRendering = false;
  target = target || document.body;
  function render() {
    const newNodes = view(store);
    patch(target, target.childNodes[0], newNodes, oldNodes);
    oldNodes = newNodes;
    isRendering = false;
  }
  let oldNodes;
  if (target.children.length > 0) {
    oldNodes = hydrate(target.children[0]);
  }
  autorun(() => {
    if (!isRendering) {
      isRendering = true;
      requestAnimationFrame(render);
    }
  });
  return store;
}
