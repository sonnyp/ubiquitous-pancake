const { once } = require("events");

module.exports.listen = function listen(server, ...args) {
  server.listen(...args);
  return once(server, "listening");
};

module.exports.getBearerToken = function getBearerToken(req) {
  const authorization = req.headers["authorization"];
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.substr("Bearer ".length);
  if (!token) {
    return null;
  }
  return token || null;
};
