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

  // cOldNodes for debug purposes only...
  //const cOldNodes = oldNodes.slice(0);
  nodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { nNode: { index, child } };
  });
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    if (nodeMap[key] !== undefined) {
      nodeMap[key].oNode = { index, child };
    } else {
      // remove node from dom
      //cOldNodes.splice(index, 1);
      parent.removeChild(parent.childNodes[index]);
    }
  })

  const nodesLen = nodes.length;
  let delta = 0;
  for (let i = 0; i < nodesLen; i++) {
    const key = nodes[i].props.key;
    if (nodeMap[key].oNode === undefined) {
      // add node to dom
      const newDomNode = createElement(nodes[i]);
      if (i < nodes.length) {
        //cOldNodes.splice(i, 0, node);
        parent.insertBefore(newDomNode, parent.childNodes[i + delta]);
      } else {
        //cOldNodes.push(node);
        parent.appendChild(newDomNode);
      }
      delta++;
    } else {
      // move and diff case....
      
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
