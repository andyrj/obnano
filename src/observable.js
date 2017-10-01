const stack = [];

export function Store(state /*, actions*/) {
  const local = {};
  let proxy;
  const handler = {
    get(target, name) {
      if (name in target) {
        if (target[name].__observable === true) {
          return target[name]();
        }
        return target[name];
      } else {
        return undefined;
      }
    },
    set(target, name, value) {
      if (name in target) {
        if (target[name].__observable === true && value.__observable !== true) {
          if (target[name].__computed !== true) {
            target[name](value);
          } else {
            // //overwrite a computed, with a vanilla unobserved var...
            // target[name].getObserving().forEach(obs => {
  
            // });
          }
        } else {
          if (target[name].__observable === true) {
            // clean up for overwritten observable...
          }
          target[name] = value;
        }
      } else {
        target[name] = value;
      }
      return true;
    } /*,
    deleteProperty(target, name) {
      if (target[name].__observable === true) {

      }
    }*/
  };
  proxy = new Proxy(local, handler);
  Object.keys(state).forEach(key => {
    proxy[key] = state[key];
  });
  return proxy;
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
      value = arg;
      observers.forEach(o => o.run());
    }
  }
  data.__observable = true;
  data.__computed = false;
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
  const current = observable(undefined);
  const computation = function() {
    const result = context != null ? thunk.call(context) : thunk();
    current(result);
  };
  const runner = autorun(computation);
  function wrapper() {
    if (arguments.length > 0) {
      throw new RangeError("computed values cannot be set arbitrarily");
    } else {
      return current();
    }
  }
  wrapper.__observable = true;
  wrapper.__computed = true;
  wrapper.dispose = function() {
    current.dispose();
    runner.dispose();
  };
  //wrapper.getObserving = runner.getObserving();
  Object.freeze(wrapper);
  return wrapper;
}

export function autorun(thunk) {
  let observing = []; // array of { store, name }
  let disposed = false;
  const reaction = {
    addDependency: function(obs) {
      if (!disposed) {
        if (observing.indexOf(obs) === -1) {
          observing.push(obs);
        }
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
    /*getObserving: function() {
      return observing.slice(0);
    },
    setObserving: function(os) {
      observing = os;
      return true;
    },*/
    dispose: function() {
      // add code to clean up after autorun...
      disposed = true;
      observing.splice(0).forEach(o => o.unsubscribe(this));
    }
  };
  reaction.run();
}
