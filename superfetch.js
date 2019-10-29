const { createServer } = require("http");
const https = require("https");
const fetch = require("node-fetch");

function serverAddress(app, path, host = "127.0.0.1") {
  const addr = app.address();
  if (!addr) app.listen(0);

  const port = app.address().port;
  const protocol = app instanceof https.Server ? "https" : "http";
  return protocol + "://" + host + ":" + port + path;
}

module.exports = async function superfetch(app, path, init) {
  app = typeof app === "function" ? createServer(app) : app;

  if (!app.listening) {
    await new Promise(resolve => app.listen(0, resolve));
  }

  const url = serverAddress(app, path);
  const req = await fetch(url, init);

  await new Promise(resolve => app.close(resolve));

  return req;
};
