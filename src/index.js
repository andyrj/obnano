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

export function app(store, view, target = document.body) {
  autorun(() => requestAnimationFrame(() => render(view(store), target)));
  return store;
}
