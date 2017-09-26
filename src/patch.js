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
  } else if (i === nodes.length) {
    while (i < oldNodes.length) {
      parent.removeChild(parent.childNodes[i]);
      i++;
    }
  }
}

/* eslint-disable */
function keyed(parent, oldNodes, nodes) {
  const nodeMap = {};
  const moveDiffKeys = [];
  const removeNodes = [];
  const addNodes = [];

  /*
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { oNode: { index, child }, nNode: undefined };
  });
  nodes.forEach((child, index) => {
    const key = child.props.key;
    if (nodeMap[key] !== undefined) {
      nodeMap[key].nNode = { index, child };
      moveDiffKeys.push(key);
    } else {
      addNodes.push(key);
    }
  });
  Object.keys(nodeMap).forEach(key => {
    const entry = nodeMap[key];
    if (entry.nNode === undefined) {
      removeNodes.push(key);
    }
  });

  // first remove nodes by key
  const cOldNodes = oldNodes.slice(0);
  let delta = 0;
  oldNodes.forEach((node, index) => {
    if (removeNodes.indexOf(node.props.key.toString()) > -1) {
      cOldNodes.splice(index + delta, 1);
      parent.removeChild(parent.childNodes[index + delta]);
      delta--;
    }
  });
  
  let i = 0;
  let j = 0;
  while (i < cOldNodes.length && j < nodes.length) {
    if (addNodes.indexOf(nodes[j].props.key) > -1) {
      cOldNodes.splice(i, 0, nodes[j]);
      parent.insertBefore(createElement(nodes[j]), parent.childNodes[i]);
      i++;
      j++;  
    } else if (moveDiffKeys.indexOf(nodes[j].props.key) > -1) {
      if (cOldNodes[i].props.key !== nodes[j].props.key) {
        if (cOldNodes[i + 1].props.key === nodes[j].props.key) {
          // move cOldNodes[i] -> where key is at in nodes
        } else if (nodes[j + 1].props.key === cOldNodes[i].props.key) {
          // move 
        }
      }
      // if (cOldNodes[i].props.key !== nodes[j].props.key) {
      //   // peek at next cOldNode if that is right key move cOldNode[i] to position found in nodes
      //   let moveKey;
      //   if (cOldNodes[i + 1].props.key === nodes[j].props.key) {
      //     moveKey = cOldNodes[i].props.key;
      //     let x = j;
      //     for (; x < nodes.length; x++) {
      //       if (nodes[x].props.key === moveKey) {
      //         break;
      //       }
      //     }
      //     const cMoveNode = cOldNodes[j];
      //     if (x === cOldNodes.length) {
      //       cOldNodes.splice(i,1);
      //       cOldNodes.push(cMoveNode);
      //       const dMoveNode = parent.removeChild(parent.childNodes[i]);
      //       parent.appendChild(dMoveNode);
      //     } else {
      //       cOldNodes.splice(i, 1);
      //       cOldNodes.splice(x, 0, cMoveNode);
      //       const dMoveNode = parent.removeChild(parent.childNodes[i]);
      //       parent.insertBefore(dMoveNode, parent.childNodes[x]);
      //     }
      //   } else {
      //     // move node
      //     moveKey = nodes[j].props.key;
      //     // find old position
      //     let x = i;
      //     for(; x < cOldNodes.length; x++) {
      //       if (cOldNodes[x].props.key === moveKey) {
      //         break;
      //       }
      //     }
      //     // move node at x, to j on cOldNodes and dom
      //     if (j === nodes.length) {
      //       const cMoveNode = cOldNodes[x];
      //       cOldNodes.splice(x, 1);
      //       cOldNodes.push(cMoveNOde);
      //       const dMoveNode = parent.removeChild(parent.childNodes[x]);
      //       parent.appendChild(dMoveNode);
      //     } else {
      //       const cMoveNode = cOldNodes[x];
      //       cOldNodes.splice(x, 1);
      //       cOldNodes.splice(j, 0, cMoveNode);
      //       const dMoveNode = parent.removeChild(parent.childNodes[x]);
      //       parent.insertBefore(dMoveNode, parent.childNodes[j]);
      //     }
      //   }
      // }
      // run normal patch on node...
      patch(parent, parent.childNodes[j], cOldNodes[i], nodes[j]);
      i++;
      j++;
    }
  }
  while(j < nodes.length) {
    if (addNodes.indexOf(nodes[j].props.key) > -1) {
      cOldNodes.push(nodes[j]);
      parent.appendChild(createElement(nodes[j]));
    }
    j++;
  }
  */
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
