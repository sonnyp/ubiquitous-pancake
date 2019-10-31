const { WebFingerLink } = require("../RemoteStorage/server");
const { createWebFingerRequestHandler } = require("../WebFinger/server");

module.exports = function WebFinger({ url, username }) {
  return createWebFingerRequestHandler((resource, req, res) => {
    // Not an `acct:`
    if (resource instanceof URL) {
      return null;
    }

    if (resource.username !== username) {
      return null;
    }

    if (resource.host !== url.host) {
      return null;
    }

    return {
      subject: `acct:${username}@${url.host}`,
      links: [
        WebFingerLink(new URL("/storage", url), {
          authorize: new URL("/authorize", url),
          range: true,
        }),
      ],
    };
  });
};
