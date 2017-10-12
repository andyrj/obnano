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

test("app should trigger vnode life cycle events", t => {
  let createCount = 0;
  let updateCount = 0;
  let removeCount = 0;
  const appStore = app({
    state: {
      create: false,
      update: false,
      remove: false
    },
    actions: {
      doCreate() {
        this.create = true;
      },
      doUpdate() {
        this.update = true;
      },
      doRemove() {
        this.remove = true;
      }
    },
    view(store) {
      let children = [];
      const child = h("div", {
        class: "test",
        oncreate: () => ++createCount,
        onupdate: () => ++updateCount,
        onremove: () => ++removeCount
      }, []);
      if (store.create && !store.update && !store.remove) {
        children.push(child);
      } else if (store.add && store.update && !store.remove) {
        child.props.class="test1";
        children.push(child);
      }
      const parent = h("div", {}, children);
      return parent;
    }
  });
  appStore.doCreate();
  t.is(createCount, 1);
  appStore.doUpdate();
  t.is(updateCount, 1);
  appStore.doRemove();
  t.is(removeCount, 1);
});
