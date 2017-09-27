// from hyperapp patch...
//const globalInvokeLaterStack = [];

function diffAttributes(element, oldProps, newProps) {
  const oldPropKeys = Object.keys(oldProps).filter(name => name !== "key");
  const newPropKeys = Object.keys(newProps).filter(name => name !== "key");
  if (newPropKeys.length === 0) {
    oldPropKeys.forEach(key => setData(element, key));
  } else {
    // remove props in old not found in new
    oldPropKeys.forEach(key => {
      if (newPropKeys.indexOf(key) === -1) {
        setData(element, key);
      }
    });
    // add/update new props
    newPropKeys.forEach(key => {
      setData(element, key, newProps[key]);
    });
  }
}

function setData(element, key, value) {
  // ignoring keyed nodes for this draft...
  // not supporting inline styles in this draft...
  if (key === "key") {
    return; // short circuit keyed node case...
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

function createElement(node) {
  if (typeof node === "string") {
    return document.createTextNode(node);
  } else {
    // not surpporting svg in this draft...
    const element = document.createElement(node.tag);
    /* life cycle oncreate from hyperapp
    if (node.props && node.props.oncreate) {
      globalInvokeLaterStack.push(function() {
        node.props.oncreate(element);
      });
    }
    */
    Object.keys(node.props).forEach(key => {
      setData(element, key, node.props[key]);
    });

    node.children.forEach(child => {
      element.appendChild(createElement(child));
    });
    return element;
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
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  } /*else { // not possible to have duplicate keys...
    throw new RangeError("Error: duplicate keys encountered");
  }*/
}

/* eslint-disable */
function keyed(parent, oldNodes, nodes) {
  const addMap = {};
  const moveMap = {};
  const cOldNodes = oldNodes.slice(0);
  nodes.forEach((child, index) => {
    const key = child.props.key;
    if (moveMap[key] !== undefined) {
      throw new RangeError("Error: duplicate keys encountered");
    }
    moveMap[key] = { nNode: { index, child } };
    addMap[key] = {index, child};
  });
  let delta = 0;
  let moveOrDiff = 0;
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    if (moveMap[key] !== undefined) {
      moveMap[key].oNode = { index, child };
      delete addMap[key];
    } else {
      // remove node from dom and cOldNodes
      cOldNodes.splice(index + delta, 1);
      parent.removeChild(parent.childNodes[index + delta]);
      delta--;
    }
  });
  // very small loop over keys in addMap to remove them from moveMap...
  Object.keys(addMap).forEach(key => {
    delete moveMap[key];
  });
  // cheap iteration over nodes adding keys found in addMap...
  let nodesLen = nodes.length;
  let i = 0;
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
  // update nodeMap oNode index has been changed by add and remove above and needs to be refreshed...
  cOldNodes.forEach((old, index) => {
    const key = old.props.key;
    if (moveMap[key] && moveMap[key].oNode.index !== index) {
      moveMap[key].oNode.index = index;
    }
  });
  // now cOldNodes and moveMap mirror what is in dom, and all we have left are move and in-place diffs...
  // which are easiest handled by simply looping twice, first remove any keys in moveMap for oNode.index !== nNode.index,
  // and patching for others, then second loop test for key in removeMap and put in correct position...
  const removals = [];
  i = 0; // reset index
  for(; i < cOldNodes.length; i++) {
    const key = cOldNodes[i].props.key;
    if (moveMap[key] !== undefined) {
      const move = moveMap[key];

      // diff in place...
      const temp = parent.childNodes[i];
      patch(parent, temp, move.oNode.child, move.nNode.child);
      if (move.oNode.index !== move.nNode.index) {
        // move node...
        parent.removeChild(temp);
        removals.push({ index: move.nNode.index, el: temp, node: cOldNodes[i] });
        cOldNodes.splice(i, 1);
        i--; // we are mutating the clone of oldNodes....
      }
    }
  }
  // reset index and loop over nodes placing into dom at correct position...
  i = 0;
  delta = 0;
  const sortedRemovals = removals.sort(removalsComparator);
  for(; i < removals.length; i++) {
    const removal = removals[i];
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
    // short circuit for no children -> children
    nodes.forEach(child => {
      parent.appendChild(createElement(child));
    });
  } else if (oldNodes.length > 0 && nodes.length === 0) {
    // short circuit for children -> no children
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

export function patch(parent, element, oldNode, node) {
  if (element == null && oldNode == null && node != null) {
    // create new element and add to parent...
    element = parent.insertBefore(createElement(node), element);
  } else if (element != null && oldNode != null && node != null) {
    if (oldNode === node) {
      return element; // short circuit for memoized vnode
    } else if (typeof oldNode === "string" && typeof node === "string") {
      element.nodeValue = node; // short cut for upating textNode
    } else if (oldNode.tag && node.tag && oldNode.tag === node.tag) {
      // diff attributes
      diffAttributes(element, oldNode.props, node.props);
      // diff children if either oldNode or node have children
      if (oldNode.children.length > 0 || node.children.length > 0) {
        diffChildren(element, oldNode.children, node.children);
      }
    } else {
      // replace oldNode with node in dom...
      parent.replaceChild(createElement(node), element);
    }
  } else if (element != null && oldNode != null && node == null) {
    /* lifecycle onremove from hyperapp
    if (oldNode.props && oldNode.props.onremove) {
      globalInvokeLaterStack.push(oldNode.props.onremove(element));
    }
    */
    parent.removeChild(element);
  }
  return element;
}
