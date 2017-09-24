import test from "ava";
import { h } from "../src/h";

test("h should output properlty formated vnodes", t => {
  const expected = { tag: "div", props: {}, children: [] };
  t.deepEqual(h("div", {}, []), expected);
});
