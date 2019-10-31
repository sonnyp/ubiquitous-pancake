const { createServer } = require("http");
const { resolve } = require("path");

const RemoteStorage = require("./RemoteStorage");
const WebFinger = require("./WebFinger");
const OAuth = require("./OAuth");
const { FS } = require("../RemoteStorage/stores/FS");

function logger(req, res) {
  res.once("finish", () => {
    console.log(req.method, req.url, "-", res.statusCode, res.statusMessage);
  });
}

module.exports = function rserve(options) {
  const port = options.port || 0;
  const host = options.host || "localhost";
  const mode = options.mode || "rw";
  const username = "rserve";
  const url = new URL(options.url || `http://${host}:${port}/`);

  const path = options._[0] ? resolve(options._[0]) : process.cwd();

  const storage = new FS({
    root: path,
    mode,
  });
  const remoteStorage = RemoteStorage({
    storage,
  });
  const webFinger = WebFinger({
    url,
    username,
  });
  const oAuth = OAuth();

  const server = createServer((req, res) => {
    logger(req, res);

    const { pathname, searchParams } = new URL(req.url, url);

    function error(err) {
      res.statusCode = err.statusCode || 500;

      if (res.statusCode === 500) {
        console.error(err);
      }

      if (!res.finished) {
        res.end();
      }
    }

    if (pathname.startsWith("/storage/")) {
      return remoteStorage(req, res, pathname.slice("/storage".length)).catch(
        error
      );
    }

    if (pathname === "/.well-known/webfinger") {
      return webFinger(req, res).catch(error);
    }

    if (pathname === "/authorize") {
      return oAuth(req, res, searchParams).catch(error);
    }

    res.statusCode = 404;
    res.end();
  });

  return { server, storage, username, url, host, port, mode, path };
};
