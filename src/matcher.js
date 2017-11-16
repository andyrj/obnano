function getNameAndContent(el) {
  let res = {};
  [].forEach.call(el.attributes, attr => {
    if (attr.name === "name") {
      res.name = attr.value;
    }
    if (attr.name === "content") {
      res.content = attr.value;
    }
  });
  return res;
}

const staticMeta = ["", "origin", "referrer", "viewport"];

export function updateMeta(meta) {
  document.title = meta.title;

  const dynamicMeta = [].filter.call(
    document.getElementsByTagName("meta"),
    el => {
      const pair = getNameAndContent(el);
      if (staticMeta.indexOf(pair.name) > -1) {
        return false;
      } else {
        return true;
      }
    }
  );
  const keys = Object.keys(meta).filter(k => {
    return k !== "title" && staticMeta.indexOf(k) === -1;
  });
  const handled = [];
  keys.forEach(function(k) {
    const metaEl = dynamicMeta.filter(el => {
      const pair = getNameAndContent(el);
      return pair.name === k;
    })[0];
    if (metaEl === undefined) {
      // add missing meta element to head
      const newMeta = document.createElement("meta");
      newMeta.setAttribute("name", k);
      newMeta.setAttribute("content", meta[k]);
      document.head.appendChild(newMeta);
    } else {
      // update existing meta element
      metaEl.setAttribute("content", meta[k]);
    }
    handled.push(k);
  });
  dynamicMeta.forEach(el => {
    const pair = getNameAndContent(el);
    if (
      handled.indexOf(pair.name) === -1 &&
      staticMeta.indexOf(pair.name) === -1
    ) {
      document.head.removeChild(el);
    }
  });
}

export function Matcher(config, defaultMeta) {
  return {
    match: pathname => {
      var match;
      var meta;
      var component;
      var params = {};
      var onroute;
      var props;

      for (var i = 0; i < config.length && !match; i++) {
        var route = config[i].path;
        var keys = [];
        pathname.replace(
          RegExp(
            route === "*"
              ? ".*"
              : "^" +
                route.replace(/\//g, "\\/").replace(/:([\w]+)/g, (_, key) => {
                  keys.push(key);
                  return "([-\\.%\\w\\(\\)]+)";
                }) +
                "/?$",
            "g"
          ),
          function() {
            for (var j = 1; j < arguments.length - 2; ) {
              var value = arguments[j++];
              try {
                value = decodeURIComponent(value);
              } catch (_) {} // eslint-disable-line
              params[keys.shift()] = value;
            }

            match = route;
            component = config[i].component;
            let routeMeta;
            if (
              config[i].meta !== undefined &&
              typeof config[i].meta === "function"
            ) {
              routeMeta = config[i].meta(params);
            } else {
              routeMeta = {};
            }
            props = config[i].props;
            onroute = config[i].onroute;
            meta = Object.assign({}, defaultMeta, routeMeta);
          }
        );
      }

      return {
        component,
        match,
        meta,
        onroute,
        params,
        props
      };
    }
  };
}
