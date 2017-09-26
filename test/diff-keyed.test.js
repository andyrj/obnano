import test from "ava";
import { h } from "../src/h";
import { patch } from "../src/patch";

require("undom/register");

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("keyed nodes should diff correctly", t => {
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
    h("div", {key: 0}, ["4"]),
    h("div", {key: 1}, ["3"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["1"]),
    h("div", {key: 4}, ["0"])
  ];
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  t.is(document.body.firstChild.childNodes.length, 5);
  let children = document.body.firstChild.childNodes;
  t.is(children[0].firstChild.nodeValue, "4");
  t.is(children[1].firstChild.nodeValue, "3");
  t.is(children[2].firstChild.nodeValue, "2");
  t.is(children[3].firstChild.nodeValue, "1");
  t.is(children[4].firstChild.nodeValue, "0");
});
