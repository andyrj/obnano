import test from "ava";
import {
  patchAdd,
  patchRemove,
  patchReplace,
  patchMove,
  patchCopy,
  patchTest,
  applyPatch
} from "../src/jsonPatch";

test("patchAdd outputs proper json patch add op", t => {
  const expected = { op: "add", path: "/a/b/c", value: "test" };
  t.deepEqual(patchAdd(["a", "b", "c"], "test"), expected);
});

test("patchRemove outputs proper json patch remove op", t => {
  const expected = { op: "remove", path: "/a/b/c" };
  t.deepEqual(patchRemove(["a", "b", "c"]), expected);
});

test("patchReplace outputs proper json patch replace op", t => {
  const expected = { op: "replace", path: "/a/b/c", value: "test" };
  t.deepEqual(patchReplace(["a", "b", "c"], "test"), expected);
});

test("patchMove outputs proper json patch move op", t => {
  const expected = { op: "move", path: "/a/b/c", from: "/d/e/f" };
  t.deepEqual(patchMove(["d", "e", "f"], ["a", "b", "c"]), expected);
});

test("patchCopy outputs proper json patch copy op", t => {
  const expected = { op: "copy", path: "/a/b/c", from: "/d/e/f" };
  t.deepEqual(patchCopy(["d", "e", "f"], ["a", "b", "c"]), expected);
});

test("patchTest outputs proper json patch test op", t => {
  const expected = { op: "test", path: "/a/b/c", value: "test" };
  t.deepEqual(patchTest(["a", "b", "c"], "test"), expected);
});

test("applyPatch should properly add", t => {
  const expected = {
    a: {
      b: {
        c: "test"
      }
    }
  }
  const initial = {
    a: {
      b: {}
    }
  };
  applyPatch(initial, [patchAdd(["a", "b", "c"], "test")]);
  t.deepEqual(initial, expected);
});
