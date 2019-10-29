class Storage {
  load() {}
  unload() {}
  getFolder(path, req, res) {}
  getFile(path, req, res) {}
  putFile(path, req, res) {}
  deleteFile(path, req, res) {}
  headFolder(path, req, res) {}
  headFile(path, req, res) {}
}

module.exports = Storage;
