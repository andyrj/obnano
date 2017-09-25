import test from "ava";
import { h } from "../src/h";
import { patch } from "../src/patch";

require("undom/register");

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("add and remove to keyed children", t => {
  const c1 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"])
  ];
  const node1 = h("div", {}, c1);
  patch(document.body, null, null, node1);
  let n = document.body.firstChild;
  let children = n.childNodes;
  t.is(children.length, 3);
  const c2 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 3}, ["3"])
  ]
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 2);
  t.is(children[0].firstChild.nodeValue, "0");
  t.is(children[1].firstChild.nodeValue, "3");
  const c3 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 4}, ["4"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ];
  const node3 = h("div", {}, c3);
  patch(document.body, document.body.firstChild, node2, node3);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 5);
  t.is(children[0].firstChild.nodeValue, "0");
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "4");
  t.is(children[3].firstChild.nodeValue, "2");
  t.is(children[4].firstChild.nodeValue, "3");
  const c4 = [
    h("div", {key: 5}, ["5"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"])
  ];
  const node4 = h("div", {}, c4);
  patch(document.body, document.body.firstChild, node3, node4);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 3);
  t.is(children[0].firstChild.nodeValue, "5");
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "2");
});