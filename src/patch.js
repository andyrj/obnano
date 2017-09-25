// from hyperapp patch...
//const globalInvokeLaterStack = [];

function diffAttributes(element, oldProps, newProps) {
  const oldPropKeys = Object.keys(oldProps).filter(name => name !== "key");
  const newPropKeys = Object.keys(newProps).filter(name => name !== "key");
  if (newPropKeys.length === 0) {
    oldPropKeys.forEach(key => {
      setData(element, key);
    });
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
  } else if (i === nodes.length) {
    while (i < oldNodes.length) {
      parent.removeChild(parent.childNodes[i]);
      i++;
    }
  }
}

function indexedComparator(a, b) {
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  } else {
    return 0;
  }
}

function swapAndDiffKeyed(parent, oldNodes, nodes) {
  // now we do comparison just for swap and diff....
}

/* eslint-disable */
function keyed(parent, oldNodes, nodes) {
  const nodeMap = {};
  const diffSwapKeys = [];
  const removeNodes = [];
  const addNodes = [];

  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { oNode: { index, child }, nNode: undefined };
  });
  nodes.forEach((child, index) => {
    const key = child.props.key;
    if (nodeMap[key] !== undefined) {
      nodeMap[key].nNode = { index, child };
      diffSwapKeys.push(key);
    } else {
      addNodes.push({ index, child });
    }
  });
  Object.keys(nodeMap).forEach(key => {
    const entry = nodeMap[key];
    if (entry.nNode === undefined) {
      removeNodes.push(entry.oNode);
    }
  });

  const cOldNodes = oldNodes.slice(0);
  const sortedRN = removeNodes.sort(indexedComparator);
  const sortedRNLen = sortedRN.length;
  let i = 0;
  let at = 0;
  let delta = 0;
  while (i < sortedRNLen) {
    const toRemove = sortedRN[i];
    i++;
    if (toRemove.index > at) {
      at = toRemove.index;
    }
    parent.removeChild(parent.childNodes[at + delta]);
    cOldNodes.splice(at + delta, 1);
    delta--;
  }
  
  console.log(JSON.stringify(cOldNodes));
  console.log(JSON.stringify(nodes));

  // now we have a list with all necessary removals handled...
  const sortedAN = addNodes.sort(indexedComparator);
  const sortedANLen = sortedAN.length;
  i = 0;
  at = 0;
  delta = 0;
  while (i < sortedANLen) {
    const toAdd = sortedAN[i];
    i++;
    if (toAdd.index > at) {
      at = toAdd.index;
    }
    parent.insertBefore(createElement(toAdd.child), parent.childNodes[at + delta]);
    cOldNodes.splice(at + delta, 0, toAdd.child);
    delta++;
  }
  
  // now we should have new nodes list without swap/diff operations...
  //swapAndDiffKeyed(parent, cOldNodes, nodes);
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
  if (oldNode == null && node != null) {
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
