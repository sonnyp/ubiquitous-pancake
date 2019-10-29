const test = require("ava");

const { getDomain } = require("./client");

test("getDomain", t => {
  const values = [
    // with acct:
    ["acct:foo@bar", "bar"],
    ["acct:foo@bar@example", "example"],
    // with http(s):
    ["http://foo", "foo"],
    ["https://foo", "foo"],
    ["https://foo/bar", "foo"],
    ["https://foo:1234/bar", "foo"],
  ];

  for (const [k, v] of values) {
    t.is(getDomain(k), v);
    t.is(getDomain(new URL(k)), v);
  }

  // invalid uri
  t.throws(
    () => {
      getDomain("foo");
    },
    TypeError,
    "Invalid URL"
  );
});
