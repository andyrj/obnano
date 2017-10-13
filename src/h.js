function gather(children, child) {
  if (child != null && child !== true && child !== false) {
    children.push(typeof child === "number" ? child + "" : child);
  }
}

/**
 * h() supports JSX and direct usage and outputs a vnode.
 * 
 * @export
 * @param {any} type 
 * @param {any} [props={}] 
 * @returns {vnode}
 */
export function h(type, props = {}) {
  const children = [];
  const len = arguments.length;
  if (len === 3) {
    const arr = arguments[2];
    if (Array.isArray(arr)) {
      let i = 0;
      const arrLen = arr.length;
      while (i < arrLen) {
        gather(children, arr[i]);
        i++;
      }
    } else {
      gather(children, arr);
    }
  } else if (len > 3) {
    let i = 2;
    while (i < len) {
      gather(children, arguments[i]);
      i++;
    }
  }

  return typeof type === "string"
    ? { type, props, children }
    : type(props, children);
}
