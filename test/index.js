import test from "ava";
import { JSDOM } from "jsdom";
import { html } from "../src";
import { TextEncoder, TextDecoder } from "text-encoding";
import WebCrypto from "node-webcrypto-ossl";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
  global.window.TextEncoder = TextEncoder;
  global.window.TextDecoder = TextDecoder;
  global.window.crypto = new WebCrypto();
});

test("tagged template literal should handle static templates", async t => {
  const template = await html`<div id="test">test</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.id, "test");
  t.is(template.fragment.content.firstChild.firstChild.nodeValue, "test");
});

test("tagged template literal should handle dynamic template with string child", async t => {
  const str = "test";
  const template = await html`<div id="test">${str}</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.id, "test");
  t.is(template.fragment.content.firstChild.firstChild.nodeValue, str);
});

test("tagged template literal should handle nested template", async t => {
  const nested = await html`<div id="test">test</div>`;
  const template = await html`<div>${nested}</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.firstChild.id, "test");
  t.is(template.fragment.content.firstChild.firstChild.firstChild.nodeValue, "test");

  const template1 = await html`<div>${html`<div id="test">test</div>`}</div>`;
  template1.update();
  t.is(template1.fragment.content.firstChild.firstChild.id, "test");
  t.is(template1.fragment.content.firstChild.firstChild.firstChild.nodeValue, "test");
});

test("tagged template literal should handle dom nodes", async t => {
  const node = document.createElement("div");
  node.id = "test";
  const template = await html`<div>${node}</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.firstChild.id, "test");
});

test("tagged template literal should handle dynamic nodes dispersed in static nodes", async t => {
  const str = "dynamic";
  const template = await html`<div>This is static, this is ${str}</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.innerHTML, "This is static, this is dynamic");

  const template1 = await html`<div>${str} is at start`;
  template1.update();
  t.is(template1.fragment.content.firstChild.innerHTML, "dynamic is at start");

  const template2 = await html`<div>in the middle it's ${str}!`;
  template2.update();
  t.is(template2.fragment.content.firstChild.innerHTML, "in the middle it's dynamic!");
})

test("tagged template literal should handle dynamic attributes", async t => {
  const str = "test";
  const template = await html`<div id=${str}>test</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.id, str);
});

test("tagged template literal should handle dynamic child interspersed with static nodes", async t => {
  const node = document.createElement("div");
  node.innerHTML = "test";
  const template = await html`<div><br>before${node}<br>after</div>`;
  template.update();
  t.is(template.fragment.content.firstChild.outerHTML, "<div><br>before<div>test</div><br>after</div>");
});
