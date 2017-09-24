import test from "ava";
import { h } from "../src/h";
import { patch } from "../src/patch";

require("undom/register");

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("patch should render textNodes properly", t => {
  const str = "test";
  patch(document.body, null, null, str);
  t.is(document.body.childNodes[0].nodeValue, str);
});

test("patch should replace textNode with domNode when needed", t => {
  const str1 = "test1";
  patch(document.body, null, null, str1);
  t.is(document.body.childNodes[0].nodeValue, str1);

  const node = h("div", { id: "test" }, []);
  patch(document.body, document.body.childNodes[0], str1, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
});

test("patch should remove nodes no in patch", t => {
  const str1 = "test1";
  patch(document.body, null, null, str1);
  t.is(document.body.childNodes[0].nodeValue, str1);

  patch(document.body, document.body.childNodes[0], str1, null);
  t.is(document.body.childNodes.length, 0);
});

test("patch should skip memoized nodes", t => {
  const node = h("div", { id: "test" }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
  patch(document.body, document.body.childNodes[0], node, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
});

test("patch should update domNodes", t => {
  const node = h("div", { id: "test" }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
  const node1 = h("div", { id: "test1" }, []);
  patch(document.body, document.body.childNodes[0], node, node1);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test1");
});

test("patch should add child nodes", t => {
  const node = h("div", { id: "test" }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
  const str = "test"
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, document.body.childNodes[0], node, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, "test");
});

test("patch should remove child nodes", t => {
  const str = "test";
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, null, null, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
  const node = h("div", { id: "test" }, []);
  patch(document.body, document.body.childNodes[0], children, node);  
  t.is(document.body.childNodes[0].childNodes.length, 0);
});

test("patch should update un-keyed child nodes", t => {
  const str = "test";
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, null, null, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
  const children1 = h("div", { id: "test" }, [
    h("div", {}, [str]),
    h("h1", {}, [str])
  ]);
  patch(document.body, document.body.childNodes[0], children, children1);
  t.is(document.body.firstChild.firstChild.nodeName, "DIV");
  t.is(document.body.firstChild.firstChild.firstChild.nodeValue, str);
  t.is(document.body.firstChild.lastChild.nodeName, "H1");
  t.is(document.body.firstChild.lastChild.firstChild.nodeValue, str);
});
