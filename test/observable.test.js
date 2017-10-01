import test from "ava";
import { Store, observable, computed, autorun } from "../src/observable";

test("observables should return value when called with no argument", t => {
  const test = observable("test");
  t.is(test(), "test");
});

test("observables should set a new value when called with an argument", t => {
  const test = observable("test");
  test("123");
  t.is(test(), "123");
});

test("autorun should execute when observables it accesses change", t => {
  let count = 0;
  const test = observable("test");
  autorun(() => {
    let val = test();
    count++;
  })
  t.is(count, 1);
  test("123");
  t.is(count, 2);
});

test("computed values should update when dependencies update", t => {
  const test = observable("test");
  const test1 = observable("123");
  const comp = computed(() => {
    return `${test()} - ${test1()}`;
  });
  t.is(comp(), "test - 123");
  test("boom");
  t.is(comp(), "boom - 123");
});

test("Store should allow observables to be accessed as though they are vanilla js objects", t => {
  const store = Store({
    first: observable("Andy"),
    last: observable("Johnson")
  });

  t.is(store.first, "Andy");
  t.is(store.last, "Johnson");
});

