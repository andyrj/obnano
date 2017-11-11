const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

const templateCache = new Map();

function placeHolderComments(parent, element) {
  if (element.nodeType === TEXT_NODE) {
    const text = element.nodeValue;
    const split = text.split("{{}}");
    const end = split.length - 1;
    const nodes = [];
    if (split.length > 0) {
      split.forEach((node, i) => {
        if (node !== "") {
          nodes.push(document.createTextNode(node));
        }
        if (i < end) {
          nodes.push(document.createComment("{{}}"));
        }
      });
      nodes.forEach(node => {
        parent.insertBefore(node, element);
      });
      parent.removeChild(element);
    }
  }
}

function walkDOM(parent, element, fn) {
  fn(parent, element);
  if (element.childNodes.length > 0) {
    const cloneNodes = [].slice.call(element.childNodes, 0);
    cloneNodes.forEach(child => {
      walkDOM(element, child, fn);
    });
  }
}

function generateParts(exprs, parts) {
  return function(parent, element) {
    if (exprs.length > 0) {
      const nodeType = element.nodeType;
      const nodeValue = element.nodeValue;
      if (nodeType === ELEMENT_NODE) {
        [].forEach.call(element.attributes, attr => {
          if (attr.nodeValue === "{{}}") {
            parts.push({
              target: [element, attr.nodeName],
              expression: exprs.shift()
            });
          }
        });
      } else if (nodeType === COMMENT_NODE && nodeValue === "{{}}") {
        parts.push({
          target: element,
          expression: exprs.shift()
        });
      }
    }
  };
}

function set(part, value) {
  const target = part.target;
  if (Array.isArray(target)) {
    const element = target[0];
    const name = target[1];
    try {
      element[name] = value == null ? "" : value;
    } catch (_) {} // eslint-disable-line
    if (typeof expr !== "function") {
      if (value == null) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value);
      }
    }
  } else {
    const parent = target.parentNode;
    if (target.nodeType === COMMENT_NODE && typeof value === "string") {
      const newNode = document.createTextNode(value);
      parent.replaceChild(newNode, target);
      part.target = newNode;
    } else if (
      target.nodeType === TEXT_NODE &&
      typeof value === "string" &&
      target.nodeValue !== value
    ) {
      target.nodeValue = value;
    } else if (value.nodeType === ELEMENT_NODE && target !== value) {
      parent.replaceChild(value, target);
      part.target = value;
    } else if (value.fragment && value.fragment.nodeName === "TEMPLATE") {
      // TODO: need to maintain a reference to nodes from nested template added to dom...
      //render(value, target);
      //parent.replaceChild(value.fragment.content, target);
    } else if (Array.isArray(value)) {
      // TODO: handle rendering arrays into template... 
    } else if (value.then) {
      value.then(promised => {
        set(part, promised);
      });
    }
  }
}

function TemplateResult(template, exprs) {
  const parts = [];
  const result = {};
  let initialized = false;
  result.values = exprs;
  result.update = values => {
    if (values) {
      result.values = values;
    }
    if (!initialized) {
      result.fragment = document.importNode(template, true);
      [].forEach.call(result.fragment.content.children, child => {
        const cloneExprs = result.values.slice(0);
        walkDOM(
          result.fragment.content,
          child,
          generateParts(cloneExprs, parts)
        )
      });
      initialized = true;
    } else {
      if (result.values.length === parts.length) {
        parts.forEach((part, i) => {
          part.expression = result.values[i];
        });
      } else {
        throw new RangeError(
          "length of values did not match template parts length"
        );
      }
    }
    parts.forEach((part, index) => {
      const target = part.target;
      const expression = part.expression;
      if (
        typeof expression === "function" &&
        ((Array.isArray(target) && !target[1].startsWith("on")) ||
          !Array.isArray(target))
      ) {
        // unlike lit-html we pass a function to user space for updating value sort of like hyperapp
        // does with async actions...
        expression(value => {
          result.values[index] = value;
          set(part, value);
        });
      } else {
        set(part, expression);
      }
    });
  };
  return result;
}

function hex(buffer) {
  const hexCodes = [];
  const padding = "00000000";
  const view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    hexCodes.push(
      (padding + view.getUint32(i).toString(16)).slice(-padding.length)
    );
  }
  return hexCodes.join("");
}

const sha256 = str => {
  const utf8er = new window.TextEncoder("utf-8");
  return window.crypto.subtle
    .digest("SHA-256", utf8er.encode(str))
    .then(hash => {
      return hex(hash);
    });
};

export async function html(strs, ...exprs) {
  const html = strs.join("{{}}");
  const hash = await sha256(html);
  const templateId = `templ-${hash}`;
  let template =
    templateCache.get(templateId) || document.querySelector(`#${templateId}`);
  if (template == null) {
    template = document.createElement("template");
    template.innerHTML = html;
    [].forEach.call(template.content.children, child => {
      walkDOM(template.content, child, placeHolderComments);
    });
    templateCache.set(templateId, template);
  }
  return TemplateResult(template, exprs);
}

export function render(template, target = document.body, hydrate = false) {
  let instance = target.__template;
  if (instance !== undefined) {
    instance.update(template.values);
    return;
  }
  instance = target.__template = template;
  instance.update(template.values);

  // TODO: update logic below so that when render is called from nested template in set() above
  // if target is a comment node it should replaceChild(instance.fragment.content) instead of append...
  if (target.children.length > 0) {
    if (hydrate) {
      // TODO: add logic to hydrate existing dom...
      return;
    } else {
      while (target.hasChildNodes) {
        target.removeChild(target.lastChild);
      }
    }
  }
  target.appendChild(instance.fragment.content);
}
