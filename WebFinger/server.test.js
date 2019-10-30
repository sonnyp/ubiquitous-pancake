const test = require("ava");

const fetch = require("../superfetch");
const { createWebFingerRequestHandler } = require("./server");
const { parseResource } = require("./WebFinger");

test("sends Access-Control-Allow-Origin response header set to *", async t => {
  const requestHandler = createWebFingerRequestHandler();
  const res = await fetch(requestHandler, "/.well-known/webfinger");
  t.is(res.headers.get("Access-Control-Allow-Origin"), "*");
});

test("responds with 405 if method is not GET", async t => {
  const requestHandler = createWebFingerRequestHandler();
  async function getStatus(method) {
    return (await fetch(requestHandler, "/.well-known/webfinger", { method }))
      .status;
  }

  t.is(await getStatus("PATCH"), 405);
  t.is(await getStatus("POST"), 405);
  t.is(await getStatus("PUT"), 405);
  t.is(await getStatus("HEAD"), 405);
  t.is(await getStatus("OPTIONS"), 405);
  t.is(await getStatus("DELETE"), 405);
  // t.is(await getStatus("CONNECT"), 405);
  t.is(await getStatus("TRACE"), 405);
});

test("responds with 400 if resource url parameter is not defuned", async t => {
  const requestHandler = createWebFingerRequestHandler();
  async function getStatus(path) {
    return (await fetch(requestHandler, path)).status;
  }

  t.is(await getStatus("/.well-known/webfinger"), 400);
  t.is(await getStatus("/.well-known/webfinger?"), 400);
  t.is(await getStatus("/.well-known/webfinger?resource"), 400);
  t.is(await getStatus("/.well-known/webfinger?resource="), 400);
});

test("responds with 404 if getInformation is not provided", async t => {
  const requestHandler = createWebFingerRequestHandler();
  t.is(
    (await fetch(
      requestHandler,
      "/.well-known/webfinger?resource=acct:foo@bar"
    )).status,
    404
  );
});

test("responds with 404 if getInformation returns anything else than an object", async t => {
  const values = ["foo", "", undefined, null, [], true];
  t.plan(values.length);

  for (const value of values) {
    t.is(
      (await fetch(
        createWebFingerRequestHandler(async () => {
          return value;
        }),
        "/.well-known/webfinger?resource=acct:foo@bar"
      )).status,
      404
    );
  }
});

test("responds with 200 and result of getInformation", async t => {
  const result = {
    foo: "bar",
  };
  const resource = "acct:foo@bar";

  async function getInformation(_resource) {
    t.deepEqual(_resource, parseResource(resource));
    return result;
  }

  const requestHandler = createWebFingerRequestHandler(getInformation);

  const res = await fetch(
    requestHandler,
    `/.well-known/webfinger?resource=${resource}`
  );
  t.is(res.status, 200);
  t.is(res.headers.get("Content-Type"), "application/jrd+json");
  t.deepEqual(await res.json(), result);
});
