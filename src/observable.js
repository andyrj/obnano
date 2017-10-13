const stack = [];
let actions = 0;
const MAX_DEPTH = 100;
const OBSERVABLE = 0;
const COMPUTED = 1;
const AUTORUN = 2;
const ACTION = 3;
const STORE = 4;
let depth = MAX_DEPTH;
const transaction = { o: [], c: [], a: [] };

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
      if (o.__type === COMPUTED) {
        const index = transaction.c.indexOf(o);
        if (index > -1) {
          transaction.c.splice(index, 1);
        }
        transaction.c.push(o);
      } else {
        const index = transaction.a.indexOf(o);
        if (index > -1) {
          transaction.a.splice(index, 1);
        }
        transaction.a.push(o);
      }
    }
  });
}

function extendArray(val, observers) {
  const arrHandler = {
    get: function(target, name) {
      if (arrayMutators.indexOf(name) > -1) {
        return function() {
          const res = Array.prototype[name].apply(target, arguments);
          notifyObservers(observers);
          return res;
        };
      } else {
        return target[name];
      }
    },
    set: function(target, name, value) {
      if (target[name] !== undefined) {
        if (target[name].__type === OBSERVABLE) {
          if (value !== undefined && value.__type === OBSERVABLE) {
            target[name](value());
          } else {
            target[name](value);
          }
        } else {
          target[name] = value;
        }
      } else {
        if (!isNaN(parseInt(name))) {
          target[name] = value;
        } else {
          return false;
        }
      }
      notifyObservers(observers);
      return true;
    }
  };
  return new Proxy(val, arrHandler);
}

/**
 * Store - creates a proxy wrapper that allows observables to be used as if they
 * were plain javascript objects.
 * 
 * @export
 * @param {any} [state={}] - Object that defines your state, should be made of 
 *   unobserved values, observables, and computed values.
 * @param {any} [actions={}] - Object that defines actions that operate on your state.
 * @returns 
 */
export function Store(state = {}, actions = {}) {
  const local = {};
  let proxy;
  const handler = {
    get(target, name) {
      if (name in target) {
        if (
          target[name].__type === OBSERVABLE ||
          target[name].__type === COMPUTED
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
        if (target[name].__type === OBSERVABLE) {
          if (value.__type === OBSERVABLE) {
            target[name](value());
          } else {
            target[name](value);
          }
        } else {
          if (target[name].__type === COMPUTED) {
            target[name].dispose();
          }
          target[name] = value;
        }
      } else {
        target[name] = value; // user must be explicit in setting values observable/computed/action
      }
      return true;
    },
    deleteProperty(target, name) {
      if (name in target) {
        if (target[name].dispose !== undefined) {
          target[name].dispose();
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
    if (typeof state[key] === "function" && state[key].__type !== OBSERVABLE) {
      proxy[key] = computed(state[key], proxy);
    } else {
      proxy[key] = state[key];
    }
  });
  Object.keys(actions).forEach(key => {
    if (proxy[key] !== undefined) {
      throw new RangeError("action key overlaps with existing state key");
    }
    proxy[key] = action(actions[key], proxy);
  });
  proxy.__type = STORE;
  return proxy;
}

/**
 * action - Batches changes to observables and computed values so that they are computed
 * without glitches and without triggering autoruns with stale data.
 * 
 * @export
 * @param {any} fn - the function that defines how to modify observables.
 * @param {any} context - the "this" context for this action.
 * @returns 
 */
export function action(fn, context) {
  const func = function() {
    const args = arguments;
    actions++;
    fn.apply(context, args);
    if (actions === 1) {
      while (
        (transaction.o.length > 0 ||
          transaction.c.length > 0 ||
          transaction.a.length > 0) &&
        depth > 0
      ) {
        if (transaction.o.length > 0) {
          transaction.o.shift()();
        } else if (transaction.c.length > 0) {
          if (transaction.c.length === 1) {
            depth--;
          }
          transaction.c.shift().run();
        } else {
          transaction.a.shift().run();
        }
      }
      if (depth === 0) {
        console.warn("circular dependency detected");
      }
      depth = MAX_DEPTH;
    }
    actions--;
  };
  func.__type = ACTION;
  return func;
}

/**
 * observable - function that creates a new observable value that is stored in a function closure.
 * 
 * @export
 * @param {any} value - value to store in the observable. 
 * @returns function that can be used to set and get your observed value.
 */
export function observable(value) {
  const observers = [];
  let disposed = false;
  const data = function(arg) {
    if (disposed) return;
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
        transaction.o.push(() => {
          value = arg;
        });
      }
      notifyObservers(observers);
    }
  };
  data.__type = OBSERVABLE;
  data.sub = function(observer) {
    if (observers.indexOf(observer) === -1) {
      observers.push(observer);
    }
  };
  data.unsub = function(observer) {
    const index = observers.indexOf(observer);
    if (index > -1) {
      observers.splice(index, 1);
    }
  };
  data.dispose = function() {
    disposed = true;
    flush(observers);
  };
  Object.freeze(data);
  return data;
}

/**
 * computed - creates a computed value that will automatically update
 * when the observables it depends upon are updated.
 * 
 * @export
 * @param {any} thunk - function that determines the computed value.
 * @param {any} context - context for the thunk.
 * @returns function that can be used to retrieve the latest computed value.
 */
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
  wrapper.__type = COMPUTED;
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

/**
 * autorun - thunk that is executed any time any of it's observable
 * or computed dependencies are updated.
 * 
 * @export
 * @param {any} thunk - function to execute that depends on observables/computed values.
 * @param {boolean} [computed=false] - is used to determine if 
 *   this autorun is being used for a computed value.
 * @returns a function that can be used to dispose of this autorun.
 */
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
        observing.splice(0).forEach(o => o.unsub(this));
        thunk();
        observing.forEach(o => o.sub(this));
        stack.pop(this);
      }
    },
    __type: computed ? COMPUTED : AUTORUN
  };
  reaction.run();
  return function() {
    disposed = true;
    observing.splice(0).forEach(o => o.unsub(this));
    flush(observing);
  };
}
