function filterLifecycles(k) {
  return k !== "oncreate" && k !== "onupdate" && k !== "onremove";
}

/**
 * patchFactory - generates an instance of patch which is passed an invoke array
 *   to handle any lifecycle events held in the vdom.
 * 
 * @export
 * @param {any} invoke - Array used to pass thunks created during patch, for lifecycle events.
 * @returns - patch(parent, element, oldNode, node)
 */
export default function patchFactory(invoke) {
  function diffAttributes(element, oldProps, newProps) {
    const oldPropKeys = Object.keys(oldProps).filter(filterLifecycles);
    const newPropKeys = Object.keys(newProps).filter(filterLifecycles);
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
      //console.log(oldNodes[i], nodes[i]);
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
        removeElement(parent, parent.childNodes[i], oldNodes[i].props);
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

  // part of keyed algo...
  function replaceRemovals(parent, oldNodes, removals) {
    let i = 0;
    const sortedRemovals = removals.sort(removalsComparator);
    const sortedRemovalsLen = sortedRemovals.length;
    for (; i < sortedRemovalsLen; i++) {
      const removal = sortedRemovals[i];
      if (removal.index >= oldNodes.length) {
        oldNodes.push(removal.node);
        parent.appendChild(removal.el);
      } else {
        const domEl = parent.childNodes[removal.index];
        oldNodes.splice(removal.index, 0, removal.node);
        parent.insertBefore(removal.el, domEl);
      }
    }
  }

  function initFromNodes(nodes, nodesLen) {
    const moveMap = {};
    const addMap = {};
    let i = 0;
    for (; i < nodesLen; i++) {
      const child = nodes[i];
      const key = child.props.key;
      if (moveMap[key] !== undefined) {
        throw new RangeError("Error: duplicate keys encountered");
      }
      const nodeEntry = { index: i, child };
      moveMap[key] = { nNode: nodeEntry };
      addMap[key] = nodeEntry;
    }
    return { moveMap, addMap };
  }

  function initKeyedCollections(
    parent,
    oldNodes,
    oldNodesLen,
    nodes,
    nodesLen
  ) {
    const { addMap, moveMap } = initFromNodes(nodes, nodesLen);
    const cOldNodes = oldNodes.slice(0);
    let delta = 0;
    let i = 0;
    for (; i < oldNodesLen; i++) {
      const child = oldNodes[i];
      const key = child.props.key;
      if (moveMap[key] !== undefined) {
        moveMap[key].oNode = { index: i, child };
        delete addMap[key];
      } else {
        removeElement(parent, parent.childNodes[i + delta], child.props);
        cOldNodes.splice(i + delta, 1);
        delta--;
      }
    }
    return { addMap, moveMap, cOldNodes };
  }

  function cleanMoveMap(addMap, moveMap) {
    const addMapKeys = Object.keys(addMap);
    const addMapLen = addMapKeys.length;
    let i = 0;
    for (; i < addMapLen; i++) {
      delete moveMap[addMapKeys[i]];
    }
  }

  function findRemovals(parent, oldNodes, moveMap) {
    const removals = [];
    let i = 0;
    for (; i < oldNodes.length; i++) {
      const key = oldNodes[i].props.key;
      if (moveMap[key] !== undefined) {
        const move = moveMap[key];
        const temp = parent.childNodes[i];
        patch(parent, temp, move.oNode.child, move.nNode.child);
        if (move.oNode.index !== move.nNode.index) {
          parent.removeChild(temp);
          removals.push({
            index: move.nNode.index,
            el: temp,
            node: oldNodes[i]
          });
          oldNodes.splice(i, 1);
          i--;
        }
      }
    }
    return removals;
  }

  function addKeyed(parent, addMap, nodes, nodesLen, oldNodes) {
    let i = 0;
    for (; i < nodesLen; i++) {
      const key = nodes[i].props.key;
      if (addMap[key] !== undefined) {
        if (i < oldNodes.length) {
          oldNodes.splice(i, 0, nodes[i]);
          parent.insertBefore(createElement(nodes[i]), parent.childNodes[i]);
        } else {
          oldNodes.push(nodes[i]);
          parent.appendChild(createElement(nodes[i]));
        }
      }
    }
  }

  function correctMoveMapIndices(moveMap, oldNodes) {
    let i = 0;
    const oldNodesLen = oldNodes.length;
    for (; i < oldNodesLen; i++) {
      const old = oldNodes[i];
      const key = old.props.key;
      if (moveMap[key] && moveMap[key].oNode.index !== i) {
        moveMap[key].oNode.index = i;
      }
    }
  }

  function keyed(parent, oldNodes, nodes) {
    const nodesLen = nodes.length;
    const oldNodesLen = oldNodes.length;
    const { addMap, moveMap, cOldNodes } = initKeyedCollections(
      parent,
      oldNodes,
      oldNodesLen,
      nodes,
      nodesLen
    );
    cleanMoveMap(addMap, moveMap);
    addKeyed(parent, addMap, nodes, nodesLen, cOldNodes);
    correctMoveMapIndices(moveMap, cOldNodes);
    replaceRemovals(
      parent,
      cOldNodes,
      findRemovals(parent, cOldNodes, moveMap)
    );
  }

  function diffChildren(parent, oldNodes, nodes) {
    if (oldNodes.length === 0 && nodes.length > 0) {
      let i = 0;
      const nodesLen = nodes.length;
      for (; i < nodesLen; i++) {
        parent.appendChild(createElement(nodes[i]));
      }
    } else if (oldNodes.length > 0 && nodes.length === 0) {
      let i = 0;
      while (parent.lastChild) {
        removeElement(
          parent,
          parent.lastChild,
          oldNodes[oldNodes.length - i - 1].props
        );
        i++;
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
      const element = document.createElement(node.type);
      if (node.props && node.props.oncreate) {
        invoke.push(function() {
          node.props.oncreate(element);
        });
      }
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
    if (props && props.onupdate) {
      invoke.push(function() {
        props.onupdate(element, oldProps, props);
      });
    }
    diffAttributes(element, oldProps, props);
  }

  function removeElement(parent, element, props) {
    if (props && props.onremove) {
      invoke.push(function() {
        props.onremove(element);
      });
    }
    parent.removeChild(element);
  }

  function patch(parent, element, oldNode, node) {
    if (oldNode == null && node == null) {
      throw new RangeError("oldNode and node cannot both be null"); // pointless call to patch...
    } else if (oldNode == null && node != null) {
      element = parent.insertBefore(createElement(node), element);
    } else if (oldNode != null && node != null) {
      if (oldNode === node) {
        return element;
      } else if (typeof oldNode === "string" && typeof node === "string") {
        element.nodeValue = node;
      } else if (oldNode.type && node.type && oldNode.type === node.type) {
        updateElement(element, oldNode.props, node.props);
        if (oldNode.children.length > 0 || node.children.length > 0) {
          diffChildren(element, oldNode.children, node.children);
        }
      } else {
        parent.insertBefore(createElement(node), element);
        removeElement(parent, element, oldNode.props);
      }
    } else {
      removeElement(parent, element, oldNode.props);
    }
    return element;
  }
  return patch;
}
