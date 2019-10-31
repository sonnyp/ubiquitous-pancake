const fs = require("fs");
const { join } = require("path");
const { once } = require("events");

const send = require("send");
const etag = require("etag");

const Storage = require("../Storage");

const { mime } = send;
const { readdir, stat } = fs.promises;

async function statsToEntry(stats, name) {
  const { mtime } = stats;

  const ETag = etag(stats);

  if (stats.isDirectory()) {
    return [
      name + "/",
      {
        ETag,
      },
    ];
  }

  return [
    name,
    {
      "Content-Type": mime.lookup(name) || "application/octet-stream",
      "Content-Length": stats.size,
      "Last-Modified": mtime.toUTCString(),
      ETag,
    },
  ];
}
module.exports.statsToEntry = statsToEntry;

async function directory(res, path, dotfiles) {
  const dirents = (await readdir(path, {
    withFileTypes: true,
  })).filter(dirent => {
    if (!dotfiles && dirent.name.startsWith(".")) return false;
    return dirent.isDirectory() || dirent.isFile();
  });

  const entries = await Promise.all(
    dirents.map(async dirent => {
      const { name } = dirent;
      const stats = await stat(join(path, name));
      return statsToEntry(stats, name);
    })
  );

  const buffer = Buffer.from(
    JSON.stringify({
      items: Object.fromEntries(entries),
      "@context": "http://remotestorage.io/spec/folder-description",
    })
  );

  res.statusCode = 200;
  res.setHeader("ETag", etag(buffer));
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Content-Type", "application/ld+json; charset=UTF-8");
  res.end(buffer);
}

class FS extends Storage {
  constructor({ root, dotfiles = false }) {
    super();
    this.sendOptions = {
      root,
      index: false,
      dotfiles: dotfiles ? "allow" : "ignore",
    };
    this.dotfiles = dotfiles;
    this.root = root;
  }

  async sendFile(path, req, res) {
    // FIXME
    // Cannot use pipeline with HEAD
    // Error [ERR_STREAM_DESTROYED]: Cannot call pipe after a stream was destroyed
    const sendStream = send(req, path, this.sendOptions);
    sendStream.once("directory", (res, path) => {
      res.statusCode = 404;
      res.end();
    });
    sendStream.pipe(res);

    return once(sendStream, "end");
  }

  async sendFolder(path, req, res) {
    const sendStream = send(req, path, this.sendOptions);
    sendStream.once("directory", directory);
    sendStream.pipe(res);

    return once(sendStream, "end");
  }

  async getFolder(path, req, res) {
    return this.sendFolder(path, req, res);
  }

  async headFolder(path, req, res) {
    return this.sendFolder(path, req, res);
  }

  async getFile(path, req, res) {
    return this.sendFile(path, req, res);
  }

  async headFile(path, req, res) {
    return this.sendFile(path, req, res);
  }
}

module.exports.FS = FS;
