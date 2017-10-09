const stack = [];
let actions = 0; // track nested actions to determine when to reconcile
const MAX_DEPTH = 100;
let depth = MAX_DEPTH;
const transaction = { observable: [], computed: [], autorun: [] };

export function Store(state = {}, actions = {}) {
  const local = {};
  let proxy;
  const handler = {
    get(target, name) {
      if (name in target) {
        if (target[name].__observable || target[name].__computed) {
          return target[name]();
        }
        return target[name];
      } else {
        return undefined;
      }
    },
    set(target, name, value) {
      if (name in target) {
        if (target[name].__observable === true) {
          if (value.__observable) {
            target[name](value());
          } else {
            target[name](value);
          }
        } else {
          if (target[name].__computed === true) {
            target[name].dispose();
          }
          target[name] = value;
        }
      } else {
        if (typeof value === "function") {
          if (value.__action === true) {
            target[name] = value;
          } else {
            if (!value.__observable) {
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
  proxy.__store = true;
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
        while (transaction.observable.length > 0) {
          transaction.observable.shift()();
        }
        while (transaction.computed.length > 0) {
          transaction.computed.shift().run();
        }
        if (
          transaction.computed.length === 0 &&
          transaction.observable.length === 0
        ) {
          while (transaction.autorun.length > 0) {
            transaction.autorun.shift().run();
          }
        }
        depth--;
      }
      depth = MAX_DEPTH;
    }
    actions--;
  };
  func.__action = true;
  return func;
}

export function observable(value) {
  let observers = [];
  const data = function(arg) {
    if (arg === undefined) {
      if (stack.length > 0) {
        stack[stack.length - 1].addDependency(data);
      }
      return value;
    } else {
      if (actions === 0) {
        value = arg;
        observers.forEach(o => o.run());
      } else {
        transaction.observable.push(() => {
          value = arg;
        });
        observers.forEach(o => {
          if (o.__computed === true) {
            if (transaction.computed.indexOf(o) === -1) {
              transaction.computed.push(o);
            }
          } else {
            if (transaction.autorun.indexOf(o) === -1) {
              transaction.autorun.push(o);
            }
          }
        });
      }
    }
  };
  data.__observable = true;
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
    observers = [];
  };
  // data.getObservers = function() {
  //   return observers.slice(0);
  // };
  // data.setObservers = function(os) {
  //   observers = os;
  //   return true;
  // };
  Object.freeze(data);
  return data;
}

export function computed(thunk, context) {
  let current = observable(undefined);
  let disposed = false;
  const computation = function() {
    //if (disposed) return; // not needed?
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
  wrapper.__computed = true;
  wrapper.dispose = function() {
    current.dispose();
    dispose();
    dispose = undefined;
    current = undefined;
    disposed = true;
  };
  //wrapper.getObserving = runner.getObserving();
  Object.freeze(wrapper);
  return wrapper;
}

export function autorun(thunk, computed = false) {
  let observing = []; // array of { store, name }
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
    __computed: computed /*,
    getObserving: function() {
      return observing.slice(0);
    },
    setObserving: function(os) {
      observing = os;
      return true;
    },*/
  };
  reaction.run();
  return function() {
    disposed = true;
    observing.splice(0).forEach(o => o.unsubscribe(this));
  };
}
