const fs = require("fs");
const test = require("ava");
const { statsToEntry } = require("./FS");
const { basename } = require("path");

const { stat } = fs.promises;

test("statsToEntry for file", async t => {
  const stats = await stat(__filename);
  t.deepEqual(await statsToEntry(stats, basename(__filename)), [
    "FS.test.js",
    {
      "Content-Length": stats.size,
      "Content-Type": "application/javascript",
      ETag: `"${stats.mtime.getTime()}"`,
      "Last-Modified": stats.mtime.toUTCString(),
    },
  ]);
});

test("statsToEntry for dir", async t => {
  const stats = await stat(__dirname);
  t.deepEqual(await statsToEntry(stats, basename(__dirname)), [
    "stores/",
    {
      ETag: `"${stats.mtime.getTime()}"`,
    },
  ]);
});
