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
        nodes.push(document.createTextNode(node));
        if (i < end) {
          // TODO: if exprs is a fragment for another template should this be different?
          const partNode = document.createTextNode("");
          nodes.push(partNode);
          parts.push([() => partNode, exprs.shift()]);
        }
      });
    }
    // remove textNode from parent and replace with nodes
    if (parent.children.length === 1) {
      nodes.forEach(node => {
        parent.appendChild(node);
      });
    } else {
      const next = element.nextSibling;
      nodes.forEach(node => {
        parent.insertBefore(node, next);
      });
    }
    parent.removeElement(element);
  } else {
    // check attributes for value === "{{}}" and associate with exprs.shift()
    [].forEach.call(element.attributes, attr => {
      if (attr.nodeValue === "{{}}") {
        parts.push([() => [element, attr.nodeName], exprs.shift()]);
        element.removeAttribute(attr.nodeName);
      }
    });
    if (element.children.length > 0) {
      element.children.forEach(child => {
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
    fragment.children.forEach(child => {
      walkFragment(fragment, child, exprs, parts);
    });
    if (exprs.length > 0) {
      throw new RangeError(
        "Error processing template, unbalanced result from walkFragment"
      );
    }
  }
  fragment.update = () =>
    parts.forEach(part => {
      disposers.push(
        autorun(() => {
          const target = part[0]();
          const expr = part[1];
          if (Array.isArray(target)) {
            target[0][target[1]] = expr(); // dynamic attribute
          } else {
            target.nodeValue = expr(); // dynamic textNode
          }
        })
      );
    });
  fragment.dispose = () => disposers.forEach(disposer => disposer());
  return fragment;
}

export function html(strs, ...exprs) {
  const html = strs.reduce((acc, val, i) => {
    return acc + val + exprs[i] !== undefined ? "{{}}" : "";
  }, "");
  let template = templateCache.get(strs);
  if (template === undefined) {
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
