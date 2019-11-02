const { createServer } = require("http");
const { serverURL, listen } = require("./http/server");

const fetch = require("node-fetch");

module.exports = async function superfetch(app, path, init) {
  app = typeof app === "function" ? createServer(app) : app;

  await listen(app, 0);

  const url = new URL(path, serverURL(app));
  const req = await fetch(url, init);

  await new Promise(resolve => app.close(resolve));

  return req;
};
