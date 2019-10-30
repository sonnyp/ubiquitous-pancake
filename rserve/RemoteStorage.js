const {
  createRemoteStorageRequestHandler,
} = require("../RemoteStorage/server");

module.exports = function RemoteStorage({ storage, mode }) {
  return createRemoteStorageRequestHandler({
    storage,
    mode,
    prefix: "/storage",
    authorize: async (token, path) => {
      return true;
    },
  });
};
