import test from "ava";
import { JSDOM } from "jsdom";
import { html } from "../src";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
});

test("tagged template literal should handle static templates", t => {
  const frag = html`<div id="test">test</div>`;
  t.is(frag.content.firstChild.id, "test");
  t.is(frag.content.firstChild.firstChild.nodeValue, "test");
});

test("tagged template literal should handle dynamic template with string child", t => {
  const str = "test";
  const frag = html`<div id="test">${str}</div>`;
  t.is(frag.content.firstChild.id, "test");
  t.is(frag.content.firstChild.firstChild.nodeValue, str);
});

test("tagged template literal should handle nested template", t => {
  const nested = html`<div id="test">test</div>`;
  const frag = html`<div>${nested}</div>`;
  t.is(frag.content.firstChild.firstChild.id, "test");
  t.is(frag.content.firstChild.firstChild.firstChild.nodeValue, "test");
});

test("tagged template literal should handle dom nodes", t => {
  const node = document.createElement("div");
  node.id = "test";
  const frag = html`<div>${node}</div>`;
  t.is(frag.content.firstChild.firstChild.id, "test");
});

test("tagged template literal should handle dynamic nodes dispersed in static nodes", t => {
  const str = "dynamic";
  const frag = html`<div>This is static, this is ${str}</div>`;
  t.is(frag.content.firstChild.innerHTML, "This is static, this is dynamic");

  const frag1 = html`<div>${str} is at start`;
  t.is(frag1.content.firstChild.innerHTML, "dynamic is at start");

  const frag2 = html`<div>in the middle it's ${str}!`;
  t.is(frag2.content.firstChild.innerHTML, "in the middle it's dynamic!");
})

test("tagged template literal should handle dynamic attributes", t => {
  const str = "test";
  const frag = html`<div id=${str}>test</div>`;
  t.is(frag.content.firstChild.id, str);
});

test("tagged template literal should handle dynamic child interspersed with static nodes", t => {
  const node = document.createElement("div");
  node.innerHTML = "test";
  const frag = html`<div><br>before${node}<br>after</div>`;
  t.is(frag.content.firstChild.outerHTML, "<div><br>before<div>test</div><br>after</div>");
});
