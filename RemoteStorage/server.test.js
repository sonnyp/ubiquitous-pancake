const { createServer } = require("http");

const test = require("ava");

const {
  createRemoteStorageRequestHandler,
  WebFingerLink,
} = require("./server");
const superfetch = require("../superfetch");
const Storage = require("./Storage");

class MockStorage extends Storage {}

class SuccessMockStorage extends Storage {
  getFolder(path, req, res) {
    res.statusCode = 200;
    res.end();
  }
  getFile(path, req, res) {
    res.statusCode = 200;
    res.end();
  }
  putFile(path, req, res) {
    res.statusCode = 201;
    res.end();
  }
  deleteFile(path, req, res) {
    res.statusCode = 200;
    res.end();
  }
  headFolder(path, req, res) {
    res.statusCode = 200;
    res.end();
  }
  headFile(path, req, res) {
    res.statusCode = 200;
    res.end();
  }
}

async function mockAuthorize(token, path) {
  return true;
}

test("responds with 401 if Auhtorization header is missing", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/"
  );
  t.is(res.status, 401);
});

test("responds with 401 if Auhtorization header is invalid", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    {
      headers: {
        Authorization: "foo",
      },
    }
  );
  t.is(res.status, 401);
});

test("responds with 403 if token is not authorized", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: async () => false,
    }),
    "/",
    {
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.status, 403);
});

test("sets Access-Control-Allow-Origin response header set to *", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    {
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.headers.get("Access-Control-Allow-Origin"), "*");
});

test.cb("rejects if an operation throws or rejects", t => {
  t.plan(2);

  const storage = new MockStorage();
  const error = new Error("foobar");

  storage.deleteFile = () => Promise.reject(error);

  const requestHandler = createRemoteStorageRequestHandler({
    storage,
    authorize: mockAuthorize,
  });

  const app = createServer(async (req, res) => {
    const foo = await t.throwsAsync(requestHandler(req, res));
    t.is(foo, error);
    t.end();
  });

  superfetch(app, "/foo/bar", {
    method: "delete",
    headers: {
      Authorization: "Bearer foobar",
    },
  });
});

test("GET folder", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
  t.is(res.headers.get("Cache-Control"), "no-cache");
});

test("GET file", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    {
      method: "GET",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
  t.is(res.headers.get("Cache-Control"), "no-cache");
});

test("PUT folder", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/",
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.status, 405);
});

test("PUT file", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.headers.get("Access-Control-Expose-Headers"), "ETag");
});

test("PUT file - mode=ro", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
      mode: "ro",
    }),
    "/foo",
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.status, 405);
});

test("DELETE folder", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/",
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.status, 405);
});

test("DELETE file", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.headers.get("Access-Control-Expose-Headers"), "ETag");
});

test("DELETE file - ro", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
      mode: "ro",
    }),
    "/foo",
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(res.status, 405);
});

test("HEAD folder", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    {
      method: "HEAD",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
});

test("HEAD file", async t => {
  const res = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    {
      method: "head",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
});

test("OPTIONS file", async t => {
  const req = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    {
      method: "OPTIONS",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(
    req.headers.get("Access-Control-Allow-Methods"),
    "OPTIONS, HEAD, GET, PUT, DELETE"
  );
  t.is(
    req.headers.get("Access-Control-Allow-Headers"),
    "Authorization, Origin, If-Match, If-None-Match, Content-Length, Content-Type"
  );
  t.is(req.headers.get("Access-Control-Max-Age"), "600");
});

test("OPTIONS folder", async t => {
  const req = await superfetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/bar/",
    {
      method: "OPTIONS",
      headers: {
        Authorization: "Bearer foobar",
      },
    }
  );
  t.is(req.headers.get("Access-Control-Allow-Methods"), "OPTIONS, HEAD, GET");
  t.is(
    req.headers.get("Access-Control-Allow-Headers"),
    "Authorization, Origin, If-Match, If-None-Match"
  );
  t.is(req.headers.get("Access-Control-Max-Age"), "600");
});

test("dotfiles", async t => {
  const storage = new SuccessMockStorage();
  const authorize = mockAuthorize;
  const app = createRemoteStorageRequestHandler({
    storage,
    authorize,
  });
  const headers = { Authorization: "Bearer foobar" };

  const tests = [
    ["/foo/.bar"],
    ["/foo/.bar/foobar"],
    ["/foo/.bar/"],
    ["/foo/.bar/foobar/"],
  ];
  const methods = ["GET", "HEAD", "DELETE", "PUT"];

  for await (const method of methods) {
    for await (const [path] of tests) {
      t.is(
        (await superfetch(app, path, {
          method,
          headers,
        })).status,
        method === "PUT" ? 409 : 404
      );
    }
  }
});

test("WebFingerLink", t => {
  const href = "http://foobar.com/storage";
  const authorize = "http://foobar.com/authorize";

  t.deepEqual(
    WebFingerLink(href, {
      authorize,
      range: true,
    }),
    {
      href,
      rel: "http://tools.ietf.org/id/draft-dejong-remotestorage",
      properties: {
        "http://remotestorage.io/spec/version": "draft-dejong-remotestorage-13",
        "http://tools.ietf.org/html/rfc6749#section-4.2": authorize,
        "http://tools.ietf.org/html/rfc7233": null,
      },
    }
  );

  t.deepEqual(WebFingerLink(href, {}), {
    href,
    rel: "http://tools.ietf.org/id/draft-dejong-remotestorage",
    properties: {
      "http://remotestorage.io/spec/version": "draft-dejong-remotestorage-13",
    },
  });
});
