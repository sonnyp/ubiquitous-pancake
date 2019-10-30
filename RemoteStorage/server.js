const { parse } = require("url");

function handleOptions(path, req, res) {
  // const requestHeaders = req.headers["access-control-request-headers"];
  // const requestMethod = req.headers["access-control-request-method"];

  const allowMethods = ["OPTIONS", "HEAD", "GET"];
  if (!path.endsWith("/")) {
    allowMethods.push("PUT", "DELETE");
  }

  const allowHeaders = ["Authorization", "Origin", "If-Match", "If-None-Match"];
  if (!path.endsWith("/")) {
    allowHeaders.push(
      "Content-Length",
      // Content-Type is always allowed according to
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
      // but if it is included in the Access-Control-Request-Headers request header
      // then including it is required
      "Content-Type"
    );
  }

  res.statusCode = 200;
  // 10 minutes is the maximum for Chromium
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  res.setHeader("Access-Control-Max-Age", "600");
  res.setHeader("Access-Control-Allow-Methods", allowMethods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(", "));
}

function getAuthorizationToken(req) {
  const authorization = req.headers["authorization"];
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.substr("Bearer ".length);
  if (!token) {
    return null;
  }
  return token || null;
}

function shouldAuthorize(req, path) {
  const { method } = req;

  if (path === "/public/" || path.startsWith("/public/")) {
    return ["PUT", "DELETE"].includes(method);
  }

  return true;
}

function createRemoteStorageRequestHandler({ storage, prefix, authorize }) {
  return async function remoteStorageRequestHandler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { method, url } = req;
    const sufix = url.substr((prefix || "").length);
    const path = decodeURI(parse(sufix).pathname);

    if (method === "OPTIONS") {
      await handleOptions(path, req, res);
      res.end();
      return;
    }

    if (shouldAuthorize(req, path)) {
      const token = getAuthorizationToken(req);
      if (!token) {
        res.statusCode = 401;
        res.end();
        return;
      }

      const authorized = await authorize(token, path);
      if (!authorized) {
        res.statusCode = 401;
        res.end();
        return;
      }
    }

    // FIXME Access-Control-Expose-Headers is not in the spec
    // https://github.com/remotestorage/spec/issues/172
    // --
    // `Content-Type` and `Last-Modified` are always allowed
    // according to https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers

    switch (method) {
      case "GET":
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        if (path.endsWith("/")) {
          await storage.getFolder(path, req, res);
        } else {
          await storage.getFile(path, req, res);
        }
        break;
      case "PUT":
        if (path.endsWith("/")) {
          res.statusCode = 405;
        } else {
          res.setHeader("Access-Control-Expose-Headers", "ETag");
          await storage.putFile(path, req, res);
        }
        break;
      case "DELETE":
        if (path.endsWith("/")) {
          res.statusCode = 405;
        } else {
          res.setHeader("Access-Control-Expose-Headers", "ETag");
          await storage.deleteFile(path, req, res);
        }
        break;
      case "HEAD":
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, ETag");
        if (path.endsWith("/")) {
          await storage.headFolder(path, req, res);
        } else {
          await storage.headFile(path, req, res);
        }
        break;
      default:
        res.statusCode = 405;
        return;
    }

    res.end();
  };
}

module.exports.createRemoteStorageRequestHandler = createRemoteStorageRequestHandler;

function WebFingerLink(href, { authorize }) {
  return {
    href,
    rel: "http://tools.ietf.org/id/draft-dejong-remotestorage",
    properties: {
      "http://remotestorage.io/spec/version": "draft-dejong-remotestorage-13",
      "http://tools.ietf.org/html/rfc6749#section-4.2": authorize,
    },
  };
}
module.exports.WebFingerLink = WebFingerLink;
