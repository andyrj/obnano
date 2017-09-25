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

// comparator with no ties...  win goes to type === "remove"
function instructionComparator(a, b) {
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  } else {
    if (a.type === "remove") {
      return -1;
    } else {
      return 1;
    }
  }
}

function swapAndDiffKeyed(parent, keys, oldNodes, nodes) {
  // now we do comparison just for swap and diff....
}

/* eslint-disable */
function keyed(parent, oldNodes, nodes) {
  const nodeMap = {};
  const diffSwapKeys = [];
  //const removeNodes = [];
  //const addNodes = [];
  const instructions = [];

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
      instructions.push({type: "add", index, child });
    }
  });
  Object.keys(nodeMap).forEach(key => {
    const entry = nodeMap[key];
    if (entry.nNode === undefined) {
      instructions.push({type: "remove", index: entry.oNode.index, child: entry.oNode.child });
    }
  });

  const cOldNodes = oldNodes.slice(0);
  const sortedInstructions = instructions.sort(instructionComparator);
  const instructionLen = sortedInstructions.length;
  console.log(JSON.stringify(sortedInstructions));
  let i = 0; // index of remove instruction
  let at;
  let delta = 0; // current delta offset...
  while (i < instructionLen) {
    const instruction = sortedInstructions[i];
    at = instruction.index;
    if (instruction.type === "remove") {
      parent.removeChild(parent.childNodes[at + delta]);
      cOldNodes.splice(at + delta, 1);
      delta--;
    } else {
      parent.insertBefore(createElement(instruction.child), parent.childNodes[at/* + delta*/]);
      cOldNodes.splice(at/* + delta*/, 0, instruction.child);
      delta++;
    }
    i++;
  }
  
  //console.log(JSON.stringify(cOldNodes));
  //console.log(JSON.stringify(nodes));
  // now we should have new nodes list without swap/diff operations...
  //swapAndDiffKeyed(parent, diffAndSwapKeys, cOldNodes, nodes);
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
