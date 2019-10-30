const {
  createRemoteStorageRequestHandler,
} = require("../RemoteStorage/server");

module.exports = function RemoteStorage({ storage }) {
  return createRemoteStorageRequestHandler({
    storage,
    prefix: "/storage",
    authorize: async (token, path) => {
      return true;
    },
  });
};
