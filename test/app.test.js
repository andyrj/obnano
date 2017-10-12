import test from "ava";
import { app } from "../src/app";
import { h } from "../src/h";

require("undom/register");
global.requestAnimationFrame = cb => cb(Date.now());

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("app should return valid store object created from state, actions for interop", t => {
  const appStore = app({
    state: {
      test: "test"
    },
    actions: {
      change(val) {
        this.test = val;
      }
    },
    view(store) {
      return h("div");
    }
  });
  t.is(typeof appStore.change, "function");
  t.is(typeof appStore.test, "string");
});

test("app should hydrate existing dom inside of target", t => {
  const div = document.createElement("div");
  const div1 = document.createElement("div");
  div1.appendChild(document.createTextNode("test"));
  div.appendChild(div1);
  document.body.appendChild(div);
  const appStore = app({
    view(store) {
      return h("div", {}, [
        h("div", {}, ["test"])
      ]);
    }
  });
  t.is(document.body.firstChild.firstChild.firstChild.nodeValue, "test");
});

