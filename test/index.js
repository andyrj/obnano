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
