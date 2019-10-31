#!/usr/bin/env node

const { createServer } = require("http");
const { resolve } = require("path");

const minimist = require("minimist");

const { listen } = require("../http/server");
const RemoteStorage = require("./RemoteStorage");
const WebFinger = require("./WebFinger");
const OAuth = require("./OAuth");
const { FS } = require("../RemoteStorage/stores/FS");

const argv = minimist(process.argv.slice(2));

const port = argv.port || 8181;
const host = argv.host;
const mode = argv.mode || "rw";
const url = new URL(argv.url || `http://localhost:${port}/`);

const root = argv._[0] ? resolve(argv._[0]) : process.cwd();

const storage = new FS({
  root,
  mode,
});
const remoteStorage = RemoteStorage({
  storage,
});
const webFinger = WebFinger({
  url,
});
const oAuth = OAuth();

const server = createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url, url);

  if (pathname.startsWith("/storage/")) {
    return remoteStorage(pathname.slice("/storage".length), req, res).catch(
      err => {
        console.error(err);
        res.statusCode = 500;
        res.end();
      }
    );
  }

  if (pathname === "/.well-known/webfinger") {
    return webFinger(req, res).catch(err => {
      console.error(err);
      res.statusCode = 500;
      res.end();
    });
  }

  if (pathname === "/authorize") {
    return oAuth(searchParams, req, res).catch(err => {
      console.error(err);
      res.statusCode = 500;
      res.end();
    });
  }

  res.statusCode = 404;
  res.end();
});

(async () => {
  await storage.load();
  await listen(server, port, host);

  console.log(`Serving ${root} in mode ${mode} at ${url}`);
})().catch(console.error);
