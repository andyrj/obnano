import test from "ava";
import { JSDOM } from "jsdom";
import { Router, Route, Link } from "../src/components";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
  global.window.location.origin = "TEST";
  window.requestAnimationFrame = setTimeout;
  const handlers = {};
  global.addEventListener = (name, fn) => {
    handlers[name] = fn;
  };
  Object.defineProperty(window.location, "pathname", {
    writable: true
  });
  window.location.pathname = "/";
  global.location = window.location;
  global.history = {};
  Object.keys(handlers).forEach(key => {
    delete handlers[key];
  });
});

test("Route should return valid match object", t => {
  const expected = [
    {
      path: "/",
      props: {},
      onroute: {},
      component: {},
      meta: { title: "meta" }
    }
  ];
  const r = Route({
    path: "/",
    props: {},
    onroute: {},
    component: {},
    meta: { title: "meta" }
  });
  t.deepEqual(r, expected);
});

test("Route should return valid match object when using nested Routes", t => {
  const expected = [
    {
      path: "/test/foo",
      props: {},
      onroute: {},
      component: {},
      meta: {}
    },
    {
      path: "/test/bar",
      props: {},
      onroute: {},
      component: {},
      meta: {}
    }
  ];
  const r = Route(
    {
      path: "/test"
    },
    [
      Route({
        path: "/foo",
        props: {},
        onroute: {},
        component: {},
        meta: {}
      }),
      Route({
        path: "/bar",
        props: {},
        onroute: {},
        component: {},
        meta: {}
      })
    ]
  );
  t.deepEqual(r, expected);
});

test("Router component", t => {
  const expected = { name: "Home" };
  t.deepEqual(
    Router(
      {
        meta: params => ({ title: "test" }),
        pathname: "/",
        updateMeta: () => {}
      },
      [
        Route({
          path: "/",
          component: () => ({ name: "Home" })
        })
      ]
    ),
    expected
  );
  t.deepEqual(
    Router(
      {
        meta: params => ({}),
        pathname: "/"
      },
      [
        Route({
          path: "/",
          component: () => ({ name: "Home" })
        })
      ]
    ),
    expected
  );
});

test("Link component", t => {
  let count = 0;
  const go = href => {
    count++;
  };
  const expected = {
    tag: "a",
    props: {
      to: null,
      href: "/",
      go,
      onclick: () => {}
    },
    children: []
  };
  const testEvent = {
    button: 0,
    currentTarget: {
      origin: window.location.origin
    },
    preventDefault: () => {}
  };
  const failEvent = {
    currentTarget: {
      origin: window.location.origin
    },
    button: 1
  };
  const testLink = Link({ to: "/", go }, []);
  t.deepEqual(
    Object.keys(testLink.props).sort(),
    Object.keys(expected.props).sort()
  );
  testLink.props.onclick(testEvent);
  t.is(count, 1);
  testLink.props.onclick(failEvent);
  t.is(count, 1);
});

test("Router should call Route.onroute if specified", t => {
  let count = 0;
  const fn = match => count++;
  Router(
    {
      pathname: "/"
    },
    [
      Route({
        path: "/",
        onroute: fn,
        component: () => ({ name: "Home" })
      })
    ]
  );
  t.is(count, 1);
});
