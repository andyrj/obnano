import test from "ava";
import { h } from "../src/h";
import patchFactory from "../src/patch";

require("undom/register");

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("keyed nodes should remove properly", t => {
  const patch = patchFactory([]);
  const c1 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"]),
    h("div", {key: 4}, ["4"])
  ];
  const node1 = h("div", {}, c1);
  patch(document.body, null, null, node1);
  t.is(document.body.firstChild.childNodes.length, 5);
  const c2 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"]),
    h("div", {key: 4}, ["4"])
  ];
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  t.is(document.body.firstChild.childNodes.length, 4);
  let children = document.body.firstChild.children;
  t.is(children[0].firstChild.nodeValue, "1");
  t.is(children[1].firstChild.nodeValue, "2");
  t.is(children[2].firstChild.nodeValue, "3");
  t.is(children[3].firstChild.nodeValue, "4");
  const c3 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ];
  const node3 = h("div", {}, c3);
  patch(document.body, document.body.firstChild, node2, node3);
  t.is(document.body.firstChild.childNodes.length, 3);
  children = document.body.firstChild.childNodes;
  t.is(children[0].firstChild.nodeValue, "1");
  t.is(children[1].firstChild.nodeValue, "2");
  t.is(children[2].firstChild.nodeValue, "3");
  const c4 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 3}, ["3"])
  ];
  const node4 = h("div", {}, c4);
  patch(document.body, document.body.firstChild, node3, node4);
  t.is(document.body.firstChild.childNodes.length, 2);
  children = document.body.firstChild.childNodes;
  t.is(children[0].firstChild.nodeValue, "1");
  t.is(children[1].firstChild.nodeValue, "3");
});