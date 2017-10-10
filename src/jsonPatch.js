/*
simple json patch implementation that mutates json in place which will work with our store proxy...
adheres to RFC6902
*/
function add(doc, path, value) {
  const { parent, prop } = walkPath(doc, path);
  if (Array.isArray(parent)) {
    try {
      let index = parseInt(prop);
      parent.splice(index, 0, value);
    } catch (_) {
      //throw new RangeError("Invalid array index, given: " + prop);
      return false;
    }
  } else {
    parent[prop] = value;
  }
  return true;
}

function remove(doc, path) {
  const { parent, prop } = walkPath(doc, path);
  if (Array.isArray(parent)) {
    try {
      let index = parseInt(prop);
      parent.splice(index, 1);
    } catch (_) {
      //throw new RangeError("Invalid array index, given: " + prop);
      return false;
    }
  } else {
    delete parent[prop];
  }
  return true;
}

function replace(doc, path, value) {
  console.log(doc, path, value);
  let result = false;
  result = remove(doc, path);
  console.log(doc, path, value);
  result = add(doc, path, value);
  console.log(doc, path, value);
  return result;
}

function move(doc, from, to) {
  const { parent, prop } = walkPath(doc, from);
  const value = parent[prop];
  let result = false;
  result = remove(doc, from);
  result = add(doc, to, value);
  return result;
}

function copy(doc, from, to) {
  const { parent, prop } = walkPath(doc, from);
  const value = parent[prop];
  let result = false;
  result = add(doc, to, value);
  return result;
}

function compareArray(a, b) {
  if (a.length === b.length) {
    let i = 0;
    const len = a.length;
    for (; i < len; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function compareObjects(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  } else {
    const len = aKeys.length;
    let i = 0;
    for (; i < len; i++) {
      const aKey = aKeys[i];
      if (!compare(a[aKey], b[aKey])) {
        return false;
      }
    }
    return true;
  }
}

function compare(a, b) {
  if (typeof a !== typeof b) {
    return false;
  } else if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      return compareArray(a, b);
    } else {
      return false;
    }
  } else {
    if (
      typeof a === "number" ||
      typeof a === "string" ||
      a === false ||
      a === true ||
      a === null
    ) {
      return a === b;
    } else {
      compareObjects(a, b);
    }
  }
}

function test(doc, path, value) {
  const { parent, prop } = walkPath(doc, path);
  return compare(parent[prop], value);
}

// RFC6901
// helper to convert ["some", "json", "path"] to "/some/json/path"
function arrToPointer(arr) {
  return "/" + arr.join("/");
}
// helper to convert pointer to path array reverse of above...
function pointerToArr(pointer) {
  return pointer.slice(1).split("/");
}

function walkPath(doc, arr) {
  const clone = arr.slice(0);
  const prop = clone.pop();
  let parent;
  while (clone.length > 0) {
    if (parent === undefined) {
      parent = doc[clone.shift()];
    } else {
      parent = parent[clone.shift()];
    }
  }
  return { parent, prop };
}

function validatePatch(patch, keys) {
  keys.forEach(key => {
    if (patch[key] === undefined) {
      throw new RangeError("Invalid patch missing required key: " + key);
    }
  });
}

export function applyPatch(doc, patches) {
  let i = 0;
  const len = patches.length;
  for (; i < len; i++) {
    const patch = patches[i];
    if (patch.op === undefined) {
      throw new RangeError("Invalid patch instruction, missing op");
    }
    let result = false;
    switch (patch.op) {
      case "add":
        validatePatch(patch, ["path", "value"]);
        result = add(doc, pointerToArr(patch.path), patch.value);
        break;
      case "remove":
        validatePatch(patch, ["path"]);
        result = remove(doc, pointerToArr(patch.path));
        break;
      case "replace":
        validatePatch(patch, ["path", "value"]);
        result = replace(doc, pointerToArr(patch.path), patch.value);
        break;
      case "move":
        validatePatch(patch, ["from", "path"]);
        result = move(doc, pointerToArr(patch.from), pointerToArr(patch.path));
        break;
      case "copy":
        validatePatch(patch, ["from", "path"]);
        result = copy(doc, pointerToArr(patch.from), pointerToArr(patch.path));
        break;
      case "test":
        validatePatch(patch, ["path", "value"]);
        result = test(doc, pointerToArr(patch.path), patch.value);
        break;
      default:
        throw new RangeError("Invalid operation type: " + patch.op);
    }
    if (!result) {
      return false;
    }
  }
  return true;
}

export function patchAdd(path, value) {
  return { op: "add", path: arrToPointer(path), value };
}

export function patchRemove(path) {
  return { op: "remove", path: arrToPointer(path) };
}

export function patchReplace(path, value) {
  return { op: "replace", path: arrToPointer(path), value };
}

export function patchMove(from, path) {
  return { op: "move", from: arrToPointer(from), path: arrToPointer(path) };
}

export function patchCopy(from, path) {
  return { op: "copy", from: arrToPointer(from), path: arrToPointer(path) };
}

export function patchTest(path, value) {
  return { op: "test", path: arrToPointer(path), value };
}
