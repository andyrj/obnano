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
  };
  const initial = {
    a: {
      b: {}
    }
  };
  applyPatch(initial, [patchAdd(["a", "b", "c"], "test")]);
  t.deepEqual(initial, expected);
});

test("applyPatch should properly remove", t => {
  const expected = {
    a: {
      b: {}
    }
  };
  const initial = {
    a: {
      b: {
        c: "test"
      }
    }
  };
  applyPatch(initial, [patchRemove(["a", "b", "c"])]);
  t.deepEqual(initial, expected);
});

test("applyPatch should properly replace", t => {
  const initial = {
    a: {
      b: {
        c: "test"
      }
    }
  };
  const expected = {
    a: {
      b: {
        c: "test1"
      }
    }
  };
  applyPatch(initial, [patchReplace(["a", "b", "c"], "test1")]);
  t.deepEqual(initial, expected);
});

test("applyMove should properly move", t => {
  const initial = {
    a: {
      b: {
        c: "test"
      }
    }
  };
  const expected = {
    a: {
      b: {
        d: "test"
      }
    }
  };
  applyPatch(initial, [patchMove(["a", "b", "c"], ["a", "b", "d"])]);
  t.deepEqual(initial, expected);
});

test("applyCopy should properly copy", t => {
  const initial = {
    a: {
      b: {
        c: "test"
      }
    }
  };
  const expected = {
    a: {
      b: {
        c: "test",
        d: "test"
      }
    }
  };
  applyPatch(initial, [patchCopy(["a", "b", "c"], ["a", "b", "d"])]);
  t.deepEqual(initial, expected);
});

test("applyTest should properly test", t => {
  const initial = {
    a: {
      b: {
        c: "test",
        d: ["1", "2", "3"],
        e: {}
      }
    }
  };
  t.is(applyPatch(initial, [patchTest(["a", "b", "c"], "test")]), true);
  t.is(applyPatch(initial, [patchTest(["a", "b", "c"], "test1")]), false);
  t.is(applyPatch(initial, [patchTest(["a", "b", "d"], ["1", "2", "3"])]), true);
  t.is(applyPatch(initial, [patchTest(["a", "b", "d"], ["1", "2"])]), false);
  t.is(applyPatch(initial, [patchTest(["a", "b", "e"], {})]), true);
  t.is(applyPatch(initial, [patchTest(["a", "b", "e"], {boom: true})]), false);
});
