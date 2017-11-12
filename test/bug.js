import test from "ava";
import { JSDOM } from "jsdom";
import { html, render } from "../src";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
});

test("tagged template literal should handle nested template", t => {
  console.log("+++++");
  const nested = html`<div id="test">test</div>`;
  const template = html`<div>${nested}</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.firstChild.id, "test");
  t.is(template.fragment.content.firstChild.firstChild.firstChild.nodeValue, "test");

  const template1 = html`<div>${html`<div id="test">test</div>`}</div>`;
  template1.update();
  t.is(template1.fragment.content.firstChild.firstChild.id, "test");
  t.is(template1.fragment.content.firstChild.firstChild.firstChild.nodeValue, "test");
  console.log("-----");
});
