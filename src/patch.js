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

/* can't do this and gain any perf...
function diffAndMove(parent, oldNodes, nodes, addedKeys) {
  const nodeMap = {};
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { oNode: { index, child } };
  });
  nodes.forEach((child, index) => {
    const key = child.props.key;
    if (addedKeys.indexOf(key) === -1) {
      if (nodeMap[key].oNode.index !== index) {
        // figure out how to move nodes correctly...
        console.log(oldNodes, nodes);
        console.log(nodeMap[key].oNode.index, index);
        if (
          nodes[nodeMap[key].nNode.index].props.key ===
          oldNodes[index].props.key
        ) {
          // swap
          console.log("swap case");
        } else {
          // move and recalculate map?
          console.log("move case");
        }
      }
      patch(parent, parent.childNodes[index], nodeMap[key].oNode, child);
    }
  });
}
*/
/* eslint-disable */
function keyed(parent, oldNodes, nodes) {
  const nodeMap = {};
  const cOldNodes = oldNodes.slice(0);
  nodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { nNode: { index, child } };
  });
  let delta = 0;
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    if (nodeMap[key] !== undefined) {
      nodeMap[key].oNode = { index, child };
    } else {
      // remove node from dom and cOldNodes
      cOldNodes.splice(index + delta, 1);
      parent.removeChild(parent.childNodes[index + delta]);
      delta--;
    }
  });

  let nodesLen = nodes.length;
  let i = 0;
  for (; i < nodesLen; i++) {
    const node = nodes[i];
    const key = nodes[i].props.key;
    if (nodeMap[key].oNode === undefined) {
      // add node
      if (i === cOldNodes.length) {
        cOldNodes.push(node);
        parent.appendChild(createElement(node));
      } else {
        cOldNodes.splice(i, 0, node);
        parent.insertBefore(createElement(node), parent.childNodes[i]);
      }
    } else {
      const oNode = nodeMap[key].oNode;
      // move and diff case...
      if (oNode.index !== i) {
        // move needs to happen here..
      }
      // diff in place now that move is handled for this index
      patch(parent, parent.childNodes[i], oNode.child, node);
    }
  }

  /*
  const c1OldNodes = cOldNodes.slice(0);
  let delta = 0;
  cOldNodes.forEach((node, index) => {
    const key = node.props.key;
    if (!nodeMap[key]) {
      console.log("strange missing key");
      console.log(nodeMap, cOldNodes, nodes, index, key);
    }
    if (nodeMap[key] && nodeMap[key].nNode === undefined) {
      c1OldNodes.splice(index + delta, 1);
      parent.removeChild(parent.childNodes[index + delta]);
      delta--;
    }
  });
  */
  //diffAndMove(parent, c1OldNodes, nodes, addedKeys);
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
