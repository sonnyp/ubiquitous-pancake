const { WebFingerLink } = require("../RemoteStorage/server");
const { createWebFingerRequestHandler } = require("../WebFinger/server");

module.exports = function WebFinger({ url }) {
  return createWebFingerRequestHandler((resource, req, res) => {
    if (resource instanceof URL) {
      return null;
    }

    const { hostname, username } = resource;

    return {
      subject: `acct:${username}@${hostname}`,
      links: [
        WebFingerLink(new URL("/storage", url), {
          authorize: new URL("/authorize", url),
        }),
      ],
    };
  });
};
