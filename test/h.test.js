import test from "ava";
import { h } from "../src/h";

test("h should output properlty formated vnodes", t => {
  const expected = { type: "div", props: {}, children: [] };
  t.deepEqual(h("div", {}, []), expected);
});

test("h should provide defaults for props and children", t => {
  const expected = { type: "div", props: {}, children: [] };
  t.deepEqual(h("div"), expected);
});

test("h should ignore null, true, and false children", t => {
  const expected = { type: "div", props: {}, children: [] };
  t.deepEqual(h("div", {}, [
    null,
    true,
    false
  ]), expected);
});

test("h should convert children of type number to string", t => {
  const expected = { type: "div", props: {}, children: ["1"] };
  t.deepEqual(h("div", {}, 1), expected);
});

test("h should handle single child as third argument", t => {
  const expected = { type: "div", props: {}, children: ["test"] };
  t.deepEqual(h("div", {}, "test"), expected);
});

test("h should handle jsx", t => {
  const expected = { type: "div", props: {}, children: ["test", "test1"] };
  t.deepEqual(h("div", {}, "test", "test1"), expected);
});

const MyComp = () => h("div", {}, []);
test("h should handle jsx components", t => {
  const expected = { type: "div", props: {}, children: [] };
  t.deepEqual(h(MyComp, {}, []), expected);
});
