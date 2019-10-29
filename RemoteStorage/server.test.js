const test = require("ava");

const { createRemoteStorageRequestHandler } = require("./server");
const superfetch = require("../superfetch");
const Storage = require("./Storage");

class MockStorage extends Storage {}

async function fetch(app, path, options) {
  if (!options.headers) {
    options.headers = {};
  }

  if (!options.headers["Authorization"]) {
    options.headers["Authorization"] = "Bearer foobar";
  }

  return superfetch(app, path, options);
}

async function mockAuthorize(token, path) {
  return true;
}

// const { createServer } = require("http");
// describe("createRemoteStorageRequestHandler", () => {
//   test("responds with 401 if Auhtorization header is missing", async () => {
//     const res = await superfetch(
//       createRemoteStorageRequestHandler({
//         storage: new MockStorage(),
//         authorize: mockAuthorize,
//       }),
//       "/"
//     );
//     expect(res.status).toBe(401);
//   });

//   test("responds with 401 if Auhtorization header is invalid", async () => {
//     const res = await superfetch(
//       createRemoteStorageRequestHandler({
//         storage: new MockStorage(),
//         authorize: mockAuthorize,
//       }),
//       "/",
//       {
//         headers: {
//           Authorization: "foo",
//         },
//       }
//     );
//     expect(res.status).toBe(401);
//   });

//   test("sends Access-Control-Allow-Origin response header set to *", async () => {
//     const res = await fetch(
//       createRemoteStorageRequestHandler({
//         storage: new MockStorage(),
//         authorize: mockAuthorize,
//       }),
//       "/"
//     );
//     expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
//   });

//   test("rejects if an operation throws or rejects", cb => {
//     const storage = new MockStorage();
//     const error = new Error("foobar");

//     storage.deleteDocument = jest.fn().mockRejectedValue(error);

//     const requestHandler = createRemoteStorageRequestHandler({
//       storage,
//       authorize: mockAuthorize,
//     });

//     const app = createServer((req, res) => {
//       expect(requestHandler(req, res))
//         .rejects.toBe(error)
//         .then(cb);
//     });

//     fetch(app, "/foo/bar", {
//       method: "delete",
//     });
//   });
// });

test("GET folder", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    { method: "GET" }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
  t.is(res.headers.get("Cache-Control"), "no-cache");
});

test("GET file", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    { method: "GET" }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
  t.is(res.headers.get("Cache-Control"), "no-cache");
});

test("PUT folder", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/",
    {
      method: "PUT",
    }
  );
  t.is(res.status, 405);
});

test("PUT file", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    { method: "PUT" }
  );
  t.is(res.headers.get("Access-Control-Expose-Headers"), "ETag");
});

test("DELETE folder", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/",
    {
      method: "DELETE",
    }
  );
  t.is(res.status, 405);
});

test("DELETE file", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    { method: "DELETE" }
  );
  t.is(res.headers.get("Access-Control-Expose-Headers"), "ETag");
});

test("HEAD folder", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/",
    { method: "HEAD" }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
});

test("HEAD file", async t => {
  const res = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    { method: "head" }
  );
  t.is(
    res.headers.get("Access-Control-Expose-Headers"),
    "Content-Length, ETag"
  );
});

test("OPTIONS file", async t => {
  const req = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo",
    { method: "OPTIONS" }
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
  const req = await fetch(
    createRemoteStorageRequestHandler({
      storage: new MockStorage(),
      authorize: mockAuthorize,
    }),
    "/foo/bar/",
    { method: "OPTIONS" }
  );
  t.is(req.headers.get("Access-Control-Allow-Methods"), "OPTIONS, HEAD, GET");
  t.is(
    req.headers.get("Access-Control-Allow-Headers"),
    "Authorization, Origin, If-Match, If-None-Match"
  );
  t.is(req.headers.get("Access-Control-Max-Age"), "600");
});
