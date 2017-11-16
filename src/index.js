import { render } from "ulit";
import { autorun } from "post-js";

export { Matcher, updateMeta } from "./matcher";
export { Router, Link } from "./components";
export {
  observable,
  unobserved,
  Store,
  autorun,
  computed,
  action
} from "post-js";

const disposers = new Map();
// TODO: think about how this will be disposed of when ulit part is disposed...  need to add onDispose() to directive api?
export function ob(thunk) {
  return function(update, id) {
    if (!disposers.has(id)) {
      const dispose = autorun(() => {
        update(thunk());
      });
      disposers.set(id, dispose);
    }
  };
}

export function app(store, view, target = document.body) {
  autorun(() => requestAnimationFrame(() => render(view(store), target)));
  return store;
}
