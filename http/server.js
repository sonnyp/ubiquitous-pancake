const { once } = require("events");
const tls = require("tls");

module.exports.listen = async function listen(server, ...args) {
  if (server.listening) return;
  server.listen(...args);
  await once(server, "listening");
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

function isSecureServer(server) {
  return server instanceof tls.Server;
}
module.exports.isSecureServer = this.isSecureServer;

module.exports.serverURL = function(server) {
  const { port, address, family } = server.address();
  const hostname = family === "IPv6" ? `[${address}]` : address;

  const protocol = isSecureServer(server) ? "https" : "http";
  return new URL(protocol + "://" + hostname + ":" + port);
};
