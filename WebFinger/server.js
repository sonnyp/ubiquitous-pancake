function noop() {}

function isObject(value) {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
}

module.exports.createWebFingerRequestHandler = function createWebFingerRequestHandler(
  getInformation = noop
) {
  return async function webFingerRequestHandler(req, res) {
    const { method } = req;
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (method !== "GET") {
      res.statusCode = 405;
      res.end();
      return;
    }

    const url = new URL(req.url, "http://example.net");
    const resource = url.searchParams.get("resource");
    if (!resource) {
      res.statusCode = 400;
      res.end();
      return;
    }

    let JRD;
    try {
      JRD = await getInformation(resource, req, res);
    } catch (err) {
      res.statusCode = 500;
      res.end();
      return;
    }

    if (!isObject(JRD)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/jrd+json");
    res.end(JSON.stringify(JRD));
  };
};
