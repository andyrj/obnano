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

test("autorun should stop executing after being disposed", t => {
  let count = 0;
  const test = observable("test");
  const dispose = autorun(() => {
    let val = test();
    count++;
  });
  t.is(count, 1);
  test("123");
  t.is(count, 2);
  dispose();
  test("456");
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

test("computed value should throw if you try to set it's value externally", t => {
  const test = observable("test");
  const test1 = observable("123");
  const comp = computed(() => {
    return `${test()} - ${test1()}`;
  });
  t.throws(() => {
    comp("error");
  });
});

test("computed should stop and return only undefined after being disposed", t => {
  let count = 0;
  const test = observable("test");
  const test1 = observable("123");
  const comp = computed(() => {
    count++;
    return `${test()} - ${test1()}`;
  });
  t.is(count, 1);
  t.is(comp(), "test - 123");
  comp.dispose();
  test("boom");
  t.is(count, 1);
  t.is(comp(), undefined);
});

test("Store should allow observables to be accessed as though they are vanilla js objects", t => {
  const store = Store({
    first: observable("Andy"),
    last: observable("Johnson")
  });

  t.is(store.first, "Andy");
  t.is(store.last, "Johnson");
});

test("Store should allow unobserved data access and update like normal", t => {
  const store = Store({
    first: "Andy"
  });
  t.is(store.first, "Andy");
  store.first = "test";
  t.is(store.first, "test");
});

test("Store should return undefined when trying to access key that has not been set", t => {
  const store = Store({});
  t.is(store.test, undefined);
});

test("Store should replace observable transparently", t => {
  const store = Store({
    first: observable("Andy")
  })
  t.is(store.first, "Andy");
  store.first = observable("Test");
  t.is(store.first, "Test");
  store.first = "boom";
  t.is(store.first, "boom");
});

test("Store should work with delete", t => {
  const store = Store({
    first: observable("Andy"),
    last: observable("Johnson"),
    unob: "test"
  });
  t.is(store.first, "Andy");
  t.is(store.last, "Johnson");
  t.is(store.unob, "test");
  delete store.last;
  delete store.first;
  delete store.unob;
  t.is(store.first, undefined);
  t.is(store.comp, undefined);
  t.is(store.unob, undefined);
});

test("Store should throw if you try to delete non-existent key", t => {
  const store = Store({});
  t.throws(() => {
    delete store.boom;
  });
});

test("Store should allow updating observable and unobservable values transparently", t => {
  const store = Store({
    test: observable("test"),
    unob: "123"
  });
  t.is(store.test, "test");
  t.is(store.unob, "123");
  store.test = observable("foobar");
  t.is(store.test, "foobar");
  store.test = "boom";
  t.is(store.test, "boom");
  store.unob = "456";
  t.is(store.unob, "456");
});

test("Store should dispose of and replace computed if user tries to set it", t => {
  const store = Store({
    first: observable("Andy"),
    last: observable("Johnson"),
    fullName: function() {
      return `${this.first} ${this.last}`
    }
  });

  t.is(store.fullName, "Andy Johnson");
  store.fullName = computed(function() {
    return `${this.first} ${this.first}`;
  }, store);
  t.is(store.fullName, "Andy Andy");
});

test("Store should handle actions being provided", t => {
  const store = Store({count: 0}, {increment: function() {
    this.count++;
  }});
  t.is(typeof store.increment, "function");
});

test("Store actions should be able to mutate state", t => {
  const store = Store({count: 0}, {increment: function() {
    this.count++;
  }});
  store.increment();
  t.is(store.count, 1);
});
