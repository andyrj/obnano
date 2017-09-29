const stack = [];

function observable(state) {
  const observersMap = {}; // map of array of observers per state[key]...
  const handler = {
    get(target, name) {
      if (target[name] !== undefined) {
        if (stack.length > 0) {
          stack[stack.length - 1].addDependency(this);
        }
        return target[name];
      }
    },
    set(target, name, value) {
      if (value !== undefined) {
        target[name] = value;
        observersMap[name].forEach(function(o) {
          o.run();
        });
        return true;
      } else {
        // clear observers when value set to undefined...?
        observersMap[name] = [];
      }
    }
  };
  return new Proxy(state, handler);
}

/*
// inspired by @mweststrate
// initial observable implementation from -> https://www.youtube.com/watch?v=TfxfRkNCnmk
import { randomString } from "@ajces/utils";

var stack = [];
var transaction = {}; // {[randomString(KEY_LENGTH)]: {reaction, count}}
var KEY_LENGTH = 8;

var isTransaction = false;
var actions = 0;

export function startTransaction() {
  actions++;
  if (isTransaction === false) {
    isTransaction = true;
  }
}

export function endTransaction() {
  if (actions > 0) {
    actions--;
  }
  while(isTransaction && actions === 0) {
    var keys = Object.keys(transaction);
    if (keys.length === 0) {
      isTransaction = false;
      break;
    }
    keys.forEach(function(key) {
      var obj = transaction[key];
      if (obj.count === 0) {
        obj.reaction.run();
        delete transaction[key];
      } else {
        obj.count -= 1;
      }
    })
  }
}

function asObservable(initialValue) {
  var value = initialValue;
  var observers = [];
  return {
    subscribe: function(observer) {
      observers.push(observer);
    },
    unsubscribe: function(observer) {
      observers.splice(observers.indexOf(observer), 1);
    },
    set: function(newValue) {
      value = newValue;
      observers.forEach(function(o) {
        if (isTransaction) {
          var key = o.key;
          if (key in transaction) {
            transaction[key].count += 1;
          } else {
            transaction[key] = { count: 1, reaction: o };
          }
        } else {
          o.run();
        }
      });
    },
    get: function() {
      if (stack.length > 0) {
        stack[stack.length - 1].addDependency(this);
      }
      return value;
    }
  }
}

export function observable(orig) {
  var obs = {};
  var proxy = new Proxy(obs, {
    get: function(target, name) {
      if (name in target && target[name] !== undefined) {
        if (target[name].get != null) {
          return target[name].get();
        } else {
          return target[name];
        }
      } else {
        return undefined;
      }
    },
    set: function(target, name, value, receiver) {
      if (name in target) {
        if (target[name].set != null) {
          target[name].set(value);
        } else {
          target[name] = observable(value);
        }
      } else {
        if (typeof value === "object" || typeof value === "undefined") {
          target[name] = observable(value);
        } else if (typeof value === "function" && target[name] == null) {
          target[name] = computed(value, receiver);
        } else {
          target[name] = asObservable(value);
        }
      }
      return true;
    },
    deleteProperty: function(target, name) {
      if (name in target) {
        delete target[name];
        return true;
      }
      return false;
    }
  });
  Object.keys(orig).forEach(function(key) {
    proxy[key] = orig[key];
  });
  return proxy;
}

export function autorun(thunk) {
  var observing = new Set();
  var reaction = {
    addDependency: function(observable) {
      observing.add(observable);
    },
    run: function() {
      stack.push(this);
      observing.forEach(function(o) {
        o.unsubscribe(this);
      });
      thunk();
      observing.forEach(function(o) {
        o.subscribe(this);
      });
      stack.pop();
    },
    key: thunk.key ? thunk.key : randomString(KEY_LENGTH)
  }
  reaction.run();
}

export function computed(thunk, context) {
  var current = asObservable(undefined);
  var computation = function() {
    var result = context != null ? thunk.call(context) : thunk();
    current.set(result);
  }
  computation.key = randomString(KEY_LENGTH);
  autorun(computation);
  return current;
}
*/
/*
var state = observable({
  counter: 0,
  first: "Andy",
  last: "Johnson",
  nested: {
    data: "foobar"
  },
  test: function() {
    return this.first + " " + this.last;
  },
  test2: function() {
    return this.test + ": " + this.counter;
  }
});

autorun(function() {
  console.log(state.test2);
});

autorun(function() {
  console.log(state.test);
})

autorun(function() {
  console.log(state.nested.data);
})

startTransaction()
state.counter += 1;
endTransaction();
startTransaction()
state.first = "Jon";
state.counter += 1;
endTransaction()
startTransaction()
state.counter += 10;
startTransaction();
state.last = "Doe";
state.nested.data = "fizzbuzz";
endTransaction();
endTransaction();
*/
