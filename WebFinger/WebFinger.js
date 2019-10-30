function parseResource(resource) {
  const url = new URL(resource);
  if (url.protocol !== "acct:") return url;

  const acctUrl = new URL(`http://${url.pathname}`);
  const { username, host, port, hostname } = acctUrl;

  return {
    username,
    host,
    port,
    hostname,
  };
}
module.exports.parseResource = parseResource;
