import test from "ava";
import { autorun, computed, observable, Store } from "../src";

test(t => {t.is(true, true)});

/* simplify autorun/computed api?
test("Store should dispose of and replace computed if user tries to set it", t => {
  const store = Store({
    first: observable("Andy"),
    last: observable("Johnson"),
    fullName: computed(function() {
      return `${this.first} ${this.last}`
    }).apply(store)
  });
  // not happy that I can't get "this" and context cleaned up...
  t.is(store.fullName, "Andy Johnson");
  store.fullName = computed(function() {
    return `${this.first} ${this.first}`;
  });
  t.is(store.fullName, "Andy Andy");
});
*/
/*
// recreate autorun observable bug...
test("recreate bug with autorun/observable", t => {
  let counter = 0;
  const store = Store({count: observable(1)});
  autorun(() => {
    //console.log("ran autorun...");
    counter++;
    let temp = store.count;
  });
  t.is(counter, 1);
  t.is(store.count, 1);
  //console.log("before update");
  store.count = 2;
  //console.log("after update");
  t.is(counter, 2);
  t.is(store.count, 2);
  store.count = 3;
  t.is(counter, 3);
  t.is(store.count, 3);
});
*/
