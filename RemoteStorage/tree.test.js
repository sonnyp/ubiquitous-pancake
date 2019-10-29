const test = require("ava");
const { etag, createTree, getNode, setNode, removeNode } = require("./tree");

test("createTree", t => {
  const tree = createTree();
  t.deepEqual(tree, {
    "/": {
      children: [],
      ETag: tree["/"].ETag,
    },
  });
});

test("getNode", t => {
  t.is(getNode({}, "/"), undefined);
  t.is(getNode({}, "/foo"), undefined);
  t.is(getNode({}, "/foo/"), undefined);
  t.is(getNode({}, "/foo/bar"), undefined);
  t.is(getNode({}, "/foo/bar/"), undefined);

  const tree = createTree();
  t.is(getNode(tree, "/"), tree["/"]);
});

test("setNode", t => {
  const tree = createTree();

  const node = {
    ETag: etag(),
    foo: "bar",
  };

  t.is(setNode(tree, "/foo", node), true);
  t.is(getNode(tree, "/foo"), node);
});

test("setNode creates missing intermediary", t => {
  const tree = createTree();

  const node = {
    ETag: etag(),
    foo: "bar",
  };

  t.is(setNode(tree, "/foo/bar", node), true);

  const { ETag } = getNode(tree, "/foo/");
  t.deepEqual(getNode(tree, "/foo/"), { ETag, children: ["bar"] });

  t.is(tree["/foo/bar"], node);
});

test("setNode updates intermediary folders", t => {
  const tree = {
    "/": {
      children: ["public/"],
      ETag: '"6741893013153855"',
    },
    "/a/": {
      children: ["a/"],
      ETag: '"8321645986433857"',
    },
    "/a/b/": {
      children: ["foo"],
      ETag: '"1231231312312535"',
    },
    "/a/b/foo": {
      "Content-Type": "image/png",
      "Content-Length": "613335",
      "Last-Modified": "Mon, 01 Apr 2019 12:34:45 GMT",
      ETag: '"452BDB0F"',
      id: "94e2d126-48a6-4427-ae60-be7e54ed9306",
    },
  };

  const node = {
    "Content-Type": "image/png",
    "Content-Length": "126005",
    "Last-Modified": "Mon, 01 Apr 2019 12:36:30 GMT",
    ETag: '"06835C66"',
    id: "8088965b-3a95-41d3-be75-3599c0156ca6",
  };

  const rootETag = tree["/"].ETag;
  const parentETag = tree["/a/b/"].ETag;
  t.is(setNode(tree, "/a/b/bar", node), true);
  t.is(tree["/a/b/bar"], node);

  t.deepEqual(tree["/a/b/"].children, ["foo", "bar"]);
  t.not(tree["/a/b/"].ETag, parentETag);
  t.not(tree["/"].ETag, rootETag);
});

test("removeNode updates intermediary folders", t => {
  const tree = {
    "/": {
      children: ["public/"],
      ETag: '"6741893013153855"',
    },
    "/a/": {
      children: ["a/"],
      ETag: '"8321645986433857"',
    },
    "/a/b/": {
      children: ["foo", "bar"],
      ETag: '"1231231312312535"',
    },
    "/a/b/foo": {
      "Content-Type": "image/png",
      "Content-Length": "613335",
      "Last-Modified": "Mon, 01 Apr 2019 12:34:45 GMT",
      ETag: '"452BDB0F"',
      id: "94e2d126-48a6-4427-ae60-be7e54ed9306",
    },
    "/a/b/bar": {
      "Content-Type": "image/png",
      "Content-Length": "126005",
      "Last-Modified": "Mon, 01 Apr 2019 12:36:30 GMT",
      ETag: '"06835C66"',
      id: "8088965b-3a95-41d3-be75-3599c0156ca6",
    },
  };

  const rootETag = tree["/"].ETag;
  const parentETag = tree["/a/b/"].ETag;
  removeNode(tree, "/a/b/foo");
  t.deepEqual(tree["/a/b/foo"], undefined);

  t.deepEqual(tree["/a/b/"].children, ["bar"]);

  t.not(tree["/"].ETag, rootETag);
  t.not(tree["/a/b/"].ETag, parentETag);
});

test("removeNodes deletes empty intermediary folders", t => {
  const tree = {
    "/": {
      children: ["a/"],
      ETag: '"6741893013153855"',
    },
    "/a/": {
      children: ["b/"],
      ETag: '"8321645986433857"',
    },
    "/a/b/": {
      children: ["foo"],
      ETag: '"1231231312312535"',
    },
    "/a/b/foo": {
      "Content-Type": "image/png",
      "Content-Length": "613335",
      "Last-Modified": "Mon, 01 Apr 2019 12:34:45 GMT",
      ETag: '"452BDB0F"',
      id: "94e2d126-48a6-4427-ae60-be7e54ed9306",
    },
  };

  removeNode(tree, "/a/b/foo");

  t.deepEqual(tree["/a/b/foo"], undefined);

  const { ETag } = tree["/"];
  t.deepEqual(tree, { "/": { children: [], ETag } });
});
