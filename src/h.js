// JSX is an anti-pattern not going to support it in this experiment...
export function h(tag, props, children) {
  // children must be funcitons or strings...
  props = props || {};
  children = children || [];
  return { tag, props, children };
}
