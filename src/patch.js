// from hyperapp patch...
//const invoke = [];
function diffAttributes(element, oldProps, newProps) {
  const oldPropKeys = Object.keys(oldProps);
  const newPropKeys = Object.keys(newProps);
  let i = 0;
  if (newPropKeys.length === 0) {
    for (; i < oldPropKeys.length; i++) {
      setData(element, oldPropKeys[i]);
    }
  } else {
    const map = {};
    for (; i < newPropKeys.length; i++) {
      const key = newPropKeys[i];
      map[key] = 1;
      setData(element, key, newProps[key]);
    }
    i = 0;
    for (; i < oldPropKeys.length; i++) {
      const key = oldPropKeys[i];
      if (map[key] === undefined) {
        setData(element, key);
      }
    }
  }
}

function setData(element, key, value) {
  if (key === "key") {
    return;
  }
  try {
    element[key] = value;
  } catch (_) {} // eslint-disable-line no-empty

  if (typeof value !== "function") {
    if (value) {
      element.setAttribute(key, value);
    } else {
      element.removeAttribute(key);
    }
  }
}

function unkeyed(parent, oldNodes, nodes) {
  let i = 0;
  while (i < oldNodes.length && i < nodes.length) {
    patch(parent, parent.childNodes[i], oldNodes[i], nodes[i]);
    i++;
  }
  if (i === oldNodes.length) {
    while (i < nodes.length) {
      parent.appendChild(createElement(nodes[i]));
      i++;
    }
  } else {
    while (i < oldNodes.length) {
      parent.removeChild(parent.childNodes[i]);
      i++;
    }
  }
}

function removalsComparator(a, b) {
  // no return 0 case, as duplicate keys can't happen...
  if (a.index < b.index) {
    return -1;
  } else {
    return 1;
  }
}

/* eslint-disable */
// TODO: need to refactor this into smaller functions...
function keyed(parent, oldNodes, nodes) {
  const addMap = {};
  const moveMap = {};
  const cOldNodes = oldNodes.slice(0);
  let i = 0;
  const nodesLen = nodes.length;
  for(; i < nodesLen; i++) {
    const child = nodes[i];
    const key = child.props.key;
    if (moveMap[key] !== undefined) {
      throw new RangeError("Error: duplicate keys encountered");
    }
    const nodeEntry = { index: i, child };
    moveMap[key] = { nNode: nodeEntry };
    addMap[key] = nodeEntry;
  }
  let delta = 0;
  let moveOrDiff = 0;
  const oldNodesLen = oldNodes.length;
  i = 0;
  for (; i < oldNodesLen; i++) {
    const child = oldNodes[i];
    const key = child.props.key;
    if (moveMap[key] !== undefined) {
      moveMap[key].oNode = { index: i, child };
      delete addMap[key];
    } else {
      //parent.removeChild(parent.childNodes[i + delta]);
      removeElement(parent, parent.childNodes[i + delta], child.props);
      cOldNodes.splice(i + delta, 1);
      delta--;
    }
  }
  const addMapKeys = Object.keys(addMap);
  const addMapLen = addMapKeys.length;
  i = 0;
  for (; i < addMapLen; i++) {
    delete moveMap[addMapKeys[i]];
  }
  i = 0;
  for(; i < nodesLen; i++) {
    const key = nodes[i].props.key;
    if (addMap[key] !== undefined) {
      if (i < cOldNodes.length) {
        cOldNodes.splice(i, 0, nodes[i]);
        parent.insertBefore(createElement(nodes[i]), parent.childNodes[i]);
      } else {
        cOldNodes.push(nodes[i]);
        parent.appendChild(createElement(nodes[i]));
      }
    }
  }
  const cOldNodesLen = cOldNodes.length;
  i = 0;
  for (; i < cOldNodesLen; i++) {
    const old = cOldNodes[i];
    const key = old.props.key;
    if (moveMap[key] && moveMap[key].oNode.index !== i) {
      moveMap[key].oNode.index = i;
    }
  }
  const removals = [];
  i = 0;
  for(; i < cOldNodes.length; i++) {
    const key = cOldNodes[i].props.key;
    if (moveMap[key] !== undefined) {
      const move = moveMap[key];
      const temp = parent.childNodes[i];
      patch(parent, temp, move.oNode.child, move.nNode.child);
      if (move.oNode.index !== move.nNode.index) {
        parent.removeChild(temp);
        removals.push({ index: move.nNode.index, el: temp, node: cOldNodes[i] });
        cOldNodes.splice(i, 1);
        i--;
      }
    }
  }
  i = 0;
  delta = 0;
  const sortedRemovals = removals.sort(removalsComparator);
  const sortedRemovalsLen = sortedRemovals.length;
  for(; i < sortedRemovalsLen; i++) {
    const removal = sortedRemovals[i];
    if (removal.index >= cOldNodes.length) {
      cOldNodes.push(removal.node);
      parent.appendChild(removal.el);
    } else {
      const domEl = parent.childNodes[removal.index];
      cOldNodes.splice(removal.index, 0, removal.node);
      parent.insertBefore(removal.el, domEl);
    }
  }
}
/* eslint-enable */

function diffChildren(parent, oldNodes, nodes) {
  if (oldNodes.length === 0 && nodes.length > 0) {
    let i = 0;
    const nodesLen = nodes.length;
    for (; i < nodesLen; i++) {
      parent.appendChild(createElement(nodes[i]));
    }
  } else if (oldNodes.length > 0 && nodes.length === 0) {
    while (parent.lastChild) {
      parent.removeChild(parent.lastChild);
    }
  } else {
    if (
      oldNodes[0].props &&
      nodes[0].props &&
      oldNodes[0].props.key != null &&
      nodes[0].props.key != null
    ) {
      keyed(parent, oldNodes, nodes);
    } else {
      unkeyed(parent, oldNodes, nodes);
    }
  }
}

function createElement(node) {
  if (typeof node === "string") {
    return document.createTextNode(node);
  } else {
    // not surpporting svg in this draft...
    const element = document.createElement(node.tag);
    /*
    if (node.props && node.props.oncreate) {
      invoke.push(function() {
        node.props.oncreate(element);
      });
    }*/
    const props = node.props;
    const propKeys = Object.keys(props);
    const propsLen = propKeys.length;
    let i = 0;
    for (; i < propsLen; i++) {
      const key = propKeys[i];
      setData(element, key, props[key]);
    }

    const children = node.children;
    const childLen = children.length;
    i = 0;
    for (; i < childLen; i++) {
      element.appendChild(createElement(children[i]));
    }
    return element;
  }
}

function updateElement(element, oldProps, props) {
  /*if (props && props.onupdate) {
    invoke.push(props.onupdate(element, oldProps));
  }*/
  diffAttributes(element, oldProps, props);
}

function removeElement(parent, element, props) {
  /* decide how you are going to hook into lifecycle...  need render()?
  if (props && props.onremove) {
    invoke.push(props.onremove(element));
  }*/
  parent.removeChild(element);
}

export function patch(parent, element, oldNode, node) {
  if (oldNode == null && node == null) {
    throw new RangeError("oldNode and node cannot both be null"); // pointless call to patch...
  } else if (oldNode == null && node != null) {
    element = parent.insertBefore(createElement(node), element);
  } else if (oldNode != null && node != null) {
    if (oldNode === node) {
      return element;
    } else if (typeof oldNode === "string" && typeof node === "string") {
      element.nodeValue = node;
    } else if (oldNode.tag && node.tag && oldNode.tag === node.tag) {
      updateElement(element, oldNode.props, node.props);
      if (oldNode.children.length > 0 || node.children.length > 0) {
        diffChildren(element, oldNode.children, node.children);
      }
    } else {
      parent.replaceChild(createElement(node), element);
    }
  } else {
    removeElement(parent, element, oldNode.props);
  }
  return element;
}
