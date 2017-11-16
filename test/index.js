import test from "ava";
import { JSDOM } from "jsdom";
import { app } from "../src";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
});

// TODO: add tests for app()...