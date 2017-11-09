import { autorun } from "post-js";

const templateCache = new Map();

function walkFragment(parent, element, exprs, parts) {
  if (element.nodeType === 3) {
    // split text node at "{{}}" and associate with exprs.shift()...
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
          // TODO: if exprs is a fragment for another template should this be different?
          const partNode = document.createTextNode("");
          nodes.push(partNode);
          parts.push({
            target: partNode,
            expression: exprs.shift()
          });
        }
      });
    }
    // remove textNode from parent and replace with nodes
    if (parent.childNodes.length === 1) {
      parent.removeChild(element);
      nodes.forEach(node => {
        parent.appendChild(node);
      });
    } else {
      const next = element.nextSibling;
      nodes.forEach(node => {
        parent.insertBefore(node, next);
      });
      parent.removeChild(element);
    }
  } else {
    // check attributes for value === "{{}}" and associate with exprs.shift()
    [].forEach.call(element.attributes, attr => {
      if (attr.nodeValue === "{{}}") {
        parts.push({
          target: [element, attr.nodeName],
          expression: exprs.shift()
        });
        element.removeAttribute(attr.nodeName);
      }
    });
    if (element.childNodes.length > 0) {
      element.childNodes.forEach(child => {
        walkFragment(element, child, exprs, parts);
      });
    }
  }
}

function TemplateResult(template, exprs) {
  const parts = [];
  const disposers = [];
  const fragment = document.importNode(template, true);
  // walk fragment and look for {{}} attributes and textNodes with {{}}
  while (exprs.length > 0) {
    [].forEach.call(fragment.content.children, child => {
      walkFragment(fragment.content, child, exprs, parts);
    });
  }
  parts.forEach(part =>
    disposers.push(
      autorun(() => {
        const target = part.target;
        const expr = part.expression;
        const value = typeof expr === "function" ? expr() : expr;
        if (Array.isArray(target)) {
          target[0][target[1]] = value;
        } else {
          const parent = target.parentNode;
          if (typeof value === "string") {
            target.nodeValue = value; // dynamic textNode
          } else {
            // I need to also store parent in part for replaceChild...
            if (value.nodeType === 1) {
              if (value.nodeName === "TEMPLATE") {
                const nestedFragment = document.importNode(value.content, true);
                parent.replaceChild(nestedFragment, target);
              } else {
                parent.replaceChild(value, target);
              }
            }
          }
        }
      })
    )
  );
  fragment.dispose = () => disposers.forEach(disposer => disposer());
  return fragment;
}

export function html(strs, ...exprs) {
  const html = strs.join("{{}}");
  let template = templateCache.get(strs);
  if (!template) {
    template = document.createElement("template");
    template.innerHTML = html;
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
