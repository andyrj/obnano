import test from "ava";
import { JSDOM } from "jsdom";
import { Matcher, updateMeta } from "../src/matcher";

test.beforeEach(t => {
  const dom = new JSDOM("<!DOCTYPE html><head></head><body></body></html>");
  t.dom = dom;
  global.window = dom.window;
  global.document = dom.window.document;
});

const defaultMeta = { keywords: "one, two, three" };
const config = [
  {
    path: "/",
    component: { name: "Home" },
    props: {},
    meta: params => ({ title: "Home" })
  },
  {
    path: "/about",
    component: { name: "About" },
    props: {},
    meta: params => ({ title: "About" })
  },
  {
    path: "/profile/:user",
    component: { name: "Profile" },
    props: {},
    meta: params => ({ title: "Profile" })
  },
  {
    path: "*",
    component: { name: "Error" },
    meta: params => ({ title: "404" })
  }
];

const refMeta = {
  referrer: "no-referrer"
};

const defaultTestMeta = Object.assign({}, defaultMeta, refMeta);

function buildTestMeta() {
  document.head = document.createElement("head");
  Object.keys(defaultTestMeta).forEach(key => {
    const newMeta = document.createElement("meta");
    newMeta.setAttribute("name", key);
    newMeta.setAttribute("content", defaultTestMeta[key]);
    document.head.appendChild(newMeta);
  });
}

document.getElementsByTagName = name => {
  if (name === "meta") {
    return document.head.childNodes;
  } else {
    return undefined;
  }
};

function testMeta(t, expected) {
  document.head.childNodes.forEach(node => {
    let name;
    let content;
    node.attributes.forEach(attr => {
      if (attr.name === "name") {
        name = attr.value;
      }
      if (attr.name === "content") {
        content = attr.value;
      }
    });
    t.is(content, expected[name]);
  });
}

test("updateMeta should properly diff/patch meta tags...", t => {
  buildTestMeta();
  testMeta(t, defaultTestMeta);
  const changedMeta = {
    author: "Andy Johnson",
    keywords: "a b c"
  };
  updateMeta(changedMeta);
  testMeta(t, Object.assign({}, changedMeta, refMeta));
  const removeMeta = {
    author: "Jon Doe"
  };
  updateMeta(removeMeta);
  testMeta(t, Object.assign({}, removeMeta, refMeta));
  const invalidMeta = {
    author: "Jon Doe",
    origin: "bam",
    referrer: "pow",
    viewport: "bang"
  };
  updateMeta(invalidMeta);
  testMeta(t, Object.assign({}, removeMeta, refMeta));
  updateMeta({});
  testMeta(t, Object.assign({}, {}, refMeta));
});

test("matcher should return proper route object", t => {
  const matcher = Matcher(config, defaultMeta);
  t.deepEqual(matcher.match("/"), {
    match: "/",
    component: { name: "Home" },
    meta: {
      title: "Home",
      keywords: "one, two, three"
    },
    onroute: undefined,
    params: {},
    props: {}
  });

  t.deepEqual(matcher.match("/about"), {
    match: "/about",
    component: { name: "About" },
    meta: {
      title: "About",
      keywords: "one, two, three"
    },
    onroute: undefined,
    params: {},
    props: {}
  });

  t.deepEqual(matcher.match("/profile/andy"), {
    match: "/profile/:user",
    component: { name: "Profile" },
    meta: {
      title: "Profile",
      keywords: "one, two, three"
    },
    onroute: undefined,
    params: { user: "andy" },
    props: {}
  });

  t.deepEqual(matcher.match("/404"), {
    match: "*",
    component: { name: "Error" },
    meta: {
      title: "404",
      keywords: "one, two, three"
    },
    onroute: undefined,
    params: {},
    props: undefined
  });
});
