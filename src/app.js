import patchFactory from "./patch";
import { autorun, Store } from "./observable";

function hydrate(element) {
  return element
    ? {
        tag: element.tagName.toLowerCase(),
        props: {},
        children: [].map.call(element.childNodes, function(element) {
          return element.nodeType === 3 ? element.nodeValue : hydrate(element);
        })
      }
    : element;
}

export function app({ state, actions, view }, target = document.body) {
  const invoke = [];
  const patch = patchFactory(invoke);
  const store = Store(state, actions);
  let isRendering = false;
  function render() {
    const newNodes = view(store);
    patch(target, target.childNodes[0], newNodes, oldNodes);
    oldNodes = newNodes;
    isRendering = false;
  }
  let oldNodes;
  if (target.childNodes.length > 0) {
    oldNodes = hydrate(target);
  }
  autorun(() => {
    if (!isRendering) {
      isRendering = true;
      requestAnimationFrame(render);
    }
  });
}
