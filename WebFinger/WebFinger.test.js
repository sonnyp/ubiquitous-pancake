const test = require("ava");

const { parseResource } = require("./WebFinger");

test("parseResource", t => {
  t.deepEqual(parseResource("acct:foo@bar"), {
    host: "bar",
    hostname: "bar",
    username: "foo",
    port: "",
  });

  t.deepEqual(parseResource("acct:foo@bar:1234"), {
    host: "bar:1234",
    hostname: "bar",
    username: "foo",
    port: "1234",
  });
});
