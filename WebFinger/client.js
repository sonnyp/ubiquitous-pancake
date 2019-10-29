const HTTPError = require("../HTTPError");

function getDomain(resource) {
  let domain;

  const url = typeof resource === "string" ? new URL(resource) : resource;

  if (url.protocol === "acct:") {
    const idx = resource.toString().lastIndexOf("@");
    domain = resource.toString().substring(idx + 1);
  } else {
    domain = url.hostname;
  }

  return domain;
}

async function lookup(resource, options = {}) {
  const domain = getDomain(resource);

  const url = new URL(`https://${domain}/.well-known/webfinger`);
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

module.exports.getDomain = getDomain;
module.exports.lookup = lookup;
