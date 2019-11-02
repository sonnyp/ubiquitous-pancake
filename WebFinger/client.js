const HTTPError = require("../http/error");
const { parseResource } = require("./WebFinger");

async function lookup(resource, options = {}) {
  const { port, host } = parseResource(resource);

  const protocol = port && port !== "443" ? "http" : "https";
  const url = new URL(`${protocol}://${host}/.well-known/webfinger`);

  url.searchParams.append("resource", resource.toString());

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Accept: "application/jrd+json",
      ...options.headers,
    },
  });

  if (response.status !== 200) {
    throw new HTTPError(response);
  }

  return response.json();
}

module.exports.lookup = lookup;
