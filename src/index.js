import { autorun } from "post-js";

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
  }
}

function TemplateResult(template, exprs) {
  const parts = [];
  const disposers = [];
  const fragment = document.importNode(template, true);
  [].forEach.call(fragment.content.children, child =>
    walkDOM(fragment.content, child, generateParts(exprs, parts))
  );
  const update = () =>
    parts.forEach(part =>
      disposers.push(
        autorun(() => {
          const target = part.target;
          const expr = part.expression;
          if (Array.isArray(target)) {
            const element = target[0];
            const name = target[1];
            try {
              element[name] = expr == null ? "" : expr;
            } catch (_) {} // eslint-disable-line
            if (typeof expr !== "function") {
              if (expr == null || expr === false) {
                element.removeAttribute(name);
              } else {
                element.setAttribute(name, expr);
              }
            }
          } else {
            const value = typeof expr === "function" ? expr() : expr;
            const parent = target.parentNode;
            if (target.nodeType === COMMENT_NODE && typeof value === "string") {
              const newNode = document.createTextNode(value);
              parent.replaceChild(newNode, target);
              part.target = newNode;
            } else if (
              target.nodeType === TEXT_NODE &&
              typeof value === "string"
            ) {
              target.nodeValue = value;
            } else if (value.nodeType === ELEMENT_NODE) {
              parent.replaceChild(value, target);
            } else if (
              value.fragment &&
              value.fragment.nodeName === "TEMPLATE"
            ) {
              parent.replaceChild(value.fragment.content, target);
            }
          }
        })
      )
    );
  update(); // trigger initial update before returning from TemplateResult
  return {
    fragment,
    update,
    dispose: () => disposers.forEach(disposer => disposer())
  };
}

export function html(strs, ...exprs) {
  const html = strs.join("{{}}");
  let template = templateCache.get(strs);
  if (!template) {
    template = document.createElement("template");
    template.innerHTML = html;
    [].forEach.call(template.content.children, child => {
      walkDOM(template.content, child, placeHolderComments);
    });
    templateCache.set(strs, template);
  }
  return TemplateResult(template, exprs);
}

export function render(template, target = document.body) {
  // clear render target for inserting fragment...
  if (target.children.length > 0) {
    let i = target.children.length;
    while (i > 0) {
      target.removeChild(target.lastChild);
      i--;
    }
  }
  // trigger update of fragment
  template.update();
  target.appendChild(template);
  return template; // so external code can trigger dispose()
}
