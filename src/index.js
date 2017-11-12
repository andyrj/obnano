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
              expression: exprs.shift(),
              end: null
            });
          }
        });
      } else if (nodeType === COMMENT_NODE && nodeValue === "{{}}") {
        parts.push({
          target: element,
          expression: exprs.shift(),
          end: element
        });
      }
    }
  };
}

function updateAttribute(element, name, value) {
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
}

function updateTextNode(part, value) {
  const element = part.target;
  const parent = element.parentNode;
  if (element.nodeType === COMMENT_NODE && typeof value === "string") {
    const newNode = document.createTextNode(value);
    parent.replaceChild(newNode, element);
    part.target = part.end = newNode;
  } else if (element.nodeType === TEXT_NODE && element.nodeValue !== value) {
    element.nodeValue = value;
  }
}

function updateNode(part, value) {
  const element = part.target;
  const parent = element.parentNode;
  parent.replaceChild(value, element);
  part.target = part.end = value;
}

function updateArray(part, value) {
  // TODO: add logic for rendering arrays...
}

function updateTemplate(part, template) {
  const target = part.target;
  part.target = template.fragment.content.firstChild;
  part.end = template.fragment.content.lastChild;
  render(template, target.parentNode, target);
}

function set(part, value) {
  const target = part.target;
  if (Array.isArray(target)) {
    const element = target[0];
    const name = target[1];
    updateAttribute(element, name, value);
  } else {
    if (typeof value === "string") {
      updateTextNode(part, value);
    } else if (value.nodeType === ELEMENT_NODE && target !== value) {
      updateNode(part, value);
    } else if (value.fragment && value.fragment.nodeName === "TEMPLATE") {
      updateTemplate(part, value);
    } else if (Array.isArray(value)) {
      updateArray(part, value);
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
        // does with async actions... update => {}
        expression(newValue => {
          result.values[index] = newValue;
          set(part, newValue);
        });
      } else {
        set(part, expression);
      }
    });
  };
  return result;
}

export function html(strs, ...exprs) {
  const html = strs.join("{{}}");
  let template = templateCache.get(strs);
  if (template == null) {
    template = document.createElement("template");
    template.innerHTML = html;
    [].forEach.call(template.content.children, child => {
      walkDOM(template.content, child, placeHolderComments);
    });
    templateCache.set(strs, template);
  }
  return TemplateResult(template, exprs);
}

export function render(
  template,
  parent = document.body,
  target = null,
  hydrate = false
) {
  let instance = parent.__template;
  if (instance !== undefined) {
    instance.update(template.values, render);
    return;
  }
  instance = parent.__template = template;
  instance.update(template.values, render);

  // TODO: update logic below so that when render is called from nested template in set() above
  // if target is a comment node it should replaceChild(instance.fragment.content) instead of append...
  if (target.nodeType === COMMENT_NODE) {
    parent.replaceChild(instance.fragment.content, target);
  } else if (parent.children.length > 0) {
    if (hydrate) {
      // TODO: add logic to hydrate existing dom...
      return;
    } else {
      while (parent.hasChildNodes) {
        parent.removeChild(parent.lastChild);
      }
    }
    parent.appendChild(instance.fragment.content);
  }
}
