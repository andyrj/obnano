const stack = [];
let actions = 0;
const MAX_DEPTH = 100;
let depth = MAX_DEPTH;
const transaction = { observable: [], computed: [], autorun: [] };

const arrayMutators = [
  "splice",
  "push",
  "unshift",
  "pop",
  "shift",
  "copyWithin",
  "reverse"
];

function notifyObservers(obs) {
  obs.forEach(o => {
    if (actions === 0) {
      o.run();
    } else {
      if (o.__type === "computed") {
        const index = transaction.computed.indexOf(o);
        if (index > -1) {
          transaction.computed.splice(index, 1);
        }
        transaction.computed.push(o);
      } else {
        const index = transaction.autorun.indexOf(o);
        if (index > -1) {
          transaction.autorun.splice(index, 1);
        }
        transaction.autorun.push(o);
      }
    }
  });
}

function extendArray(val, observers) {
  const arrHandler = {
    get: function(target, name) {
      if (arrayMutators.indexOf(name) > -1) {
        return function() {
          const clone = target.slice(0);
          const res = Array.prototype[name].apply(clone, arguments);
          target[name] = clone;
          notifyObservers(observers);
          return res;
        };
      } else {
        return target[name];
      }
    },
    set: function(target, name, value) {
      if (name in target) {
        if (target[name].__type === "observable") {
          let val = value;
          if (value.__type === "observable") {
            val = value();
          }
          if (actions === 0) {
            target[name](val);
          } else {
            transaction.observable.push(() => {
              target[name](val);
            });
          }
        } else {
          if (actions === 0) {
            target[name] = value;
          } else {
            transaction.observable.push(() => {
              target[name] = value;
            });
          }
        }
        notifyObservers(observers);
      }
    }
  };
  return new Proxy(val, arrHandler);
}

export function Store(state = {}, actions = {}) {
  const local = {};
  let proxy;
  const handler = {
    get(target, name) {
      if (name in target) {
        if (
          target[name].__type === "observable" ||
          target[name].__type === "computed"
        ) {
          return target[name]();
        }
        return target[name];
      } else {
        return undefined;
      }
    },
    set(target, name, value) {
      if (name in target) {
        if (target[name].__type === "observable") {
          if (value.__observable) {
            target[name](value());
          } else {
            target[name](value);
          }
        } else {
          if (target[name].__type === "computed") {
            target[name].dispose();
          }
          target[name] = value;
        }
      } else {
        if (typeof value === "function") {
          if (value.__type === "action") {
            target[name] = value;
          } else {
            if (!value.__type === "computed") {
              target[name] = computed(value, proxy);
            } else {
              target[name] = value;
            }
          }
        } else {
          target[name] = value;
        }
      }
      return true;
    },
    deleteProperty(target, name) {
      if (name in target) {
        if (target[name].dispose !== undefined) {
          target[name].dispose;
        }
        delete target[name];
        return true;
      } else {
        return false;
      }
    }
  };
  proxy = new Proxy(local, handler);
  Object.keys(state).forEach(key => {
    if (typeof state[key] === "function" && !state[key].__observable) {
      proxy[key] = computed(state[key], proxy);
    } else {
      proxy[key] = state[key];
    }
  });
  Object.keys(actions).forEach(key => {
    proxy[key] = action(actions[key], proxy);
  });
  proxy.__type = "store";
  return proxy;
}

export function action(fn, context) {
  const func = function() {
    const args = arguments;
    actions++;
    fn.apply(context, args);
    if (actions === 1) {
      while (
        (transaction.observable.length > 0 ||
          transaction.computed.length > 0 ||
          transaction.autorun.length > 0) &&
        depth > 0
      ) {
        if (transaction.observable.length > 0) {
          transaction.observable.shift()();
        } else if (transaction.computed.length > 0) {
          if (transaction.computed.length === 1) {
            depth--;
          }
          transaction.computed.shift().run();
        } else {
          transaction.autorun.shift().run();
        }
      }
      if (depth === 0) {
        console.warn("circular dependency detected");
      }
      depth = MAX_DEPTH;
    }
    actions--;
  };
  func.__type = "action";
  return func;
}

export function observable(value) {
  const observers = [];
  const data = function(arg) {
    if (arg === undefined) {
      if (stack.length > 0) {
        stack[stack.length - 1].addDependency(data);
      }
      if (Array.isArray(value)) {
        return extendArray(value, observers);
      } else {
        return value;
      }
    } else {
      if (actions === 0) {
        value = arg;
      } else {
        transaction.observable.push(() => {
          value = arg;
        });
      }
      notifyObservers(observers);
    }
  };
  data.__type = "observable";
  data.subscribe = function(observer) {
    if (observers.indexOf(observer) === -1) {
      observers.push(observer);
    }
  };
  data.unsubscribe = function(observer) {
    const index = observers.indexOf(observer);
    if (index > -1) {
      observers.splice(index, 1);
    }
  };
  data.dispose = function() {
    flush(observers);
  };
  Object.freeze(data);
  return data;
}

export function computed(thunk, context) {
  const current = observable(undefined);
  let disposed = false;
  const computation = function() {
    const result = context != null ? thunk.call(context) : thunk();
    current(result);
  };
  let dispose = autorun(computation, true);
  function wrapper() {
    if (arguments.length > 0) {
      throw new RangeError("computed values cannot be set arbitrarily");
    } else {
      if (disposed) {
        return undefined;
      }
      return current();
    }
  }
  wrapper.__type = "computed";
  wrapper.dispose = function() {
    current.dispose();
    dispose();
    dispose = undefined;
    disposed = true;
  };
  Object.freeze(wrapper);
  return wrapper;
}

function flush(arr) {
  while (arr.length > 0) {
    arr.pop();
  }
}

export function autorun(thunk, computed = false) {
  const observing = [];
  let disposed = false;
  const reaction = {
    addDependency: function(obs) {
      if (observing.indexOf(obs) === -1) {
        observing.push(obs);
      }
    },
    run: function() {
      if (!disposed) {
        stack.push(this);
        observing.splice(0).forEach(o => o.unsubscribe(this));
        thunk();
        observing.forEach(o => o.subscribe(this));
        stack.pop(this);
      }
    },
    __type: computed ? "computed" : "autorun"
  };
  reaction.run();
  return function() {
    disposed = true;
    observing.splice(0).forEach(o => o.unsubscribe(this));
    flush(observing);
  };
}
