function gatherSane(children, child) {
  if (child != null && child !== true && child !== false) {
    children.push(typeof child === "number" ? child + "" : child);
  }
}

export function h(type, props = {}) {
  const children = [];
  const len = arguments.length;
  if (len === 3) {
    const arr = arguments[2];
    if (Array.isArray(arr)) {
      let i = 0;
      const arrLen = arr.length;
      while (i < arrLen) {
        gatherSane(children, arr[i]);
        i++;
      }
    } else {
      gatherSane(children, arr);
    }
  } else if (len > 3) {
    let i = 2;
    while (i < len) {
      gatherSane(children, arguments[i]);
      i++;
    }
  }

  return typeof type === "string"
    ? { type, props, children }
    : type(props, children);
}
