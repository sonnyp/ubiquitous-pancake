const fs = require("fs");
const { join, basename } = require("path");
const { promisify } = require("util");
const stream = require("stream");

const mime = require("mime-types");

const Storage = require("../Storage");

const pipeline = promisify(stream.pipeline);
const { readdir, stat } = fs.promises;

async function statsToEntry(stats, name) {
  const { mtime } = stats;

  const ETag = `"${mtime.getTime()}"`;

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

class FS extends Storage {
  constructor({ root, hidden = false }) {
    super();
    this.root = root;
    this.hidden = hidden;
  }

  resolve(...args) {
    return join(this.root, ...args);
  }

  async getFolder(path, req, res) {
    const dirents = (await readdir(this.resolve(path), {
      withFileTypes: true,
    })).filter(dirent => {
      console.log(dirent.name);
      console.log(dirent.name.startswith);
      if (!this.hidden && dirent.name.startsWith(".")) return false;
      return dirent.isDirectory() || dirent.isFile();
    });

    const entries = await Promise.all(
      dirents.map(async dirent => {
        const { name } = dirent;
        const stats = await stat(this.resolve(path, name));
        return statsToEntry(stats, name);
      })
    );

    const items = Object.fromEntries(entries);

    // res.setHeader("ETag", node.ETag);
    res.setHeader("Content-Type", "application/ld+json");
    res.statusCode = 200;
    res.write(
      JSON.stringify({
        items,
        "@context": "http://remotestorage.io/spec/folder-description",
      })
    );
  }

  async getFile(path, req, res) {
    const name = basename(path);
    if (!this.hidden && name.startsWith(".")) {
      res.statusCode = 404;
      return;
    }

    const filePath = this.resolve(path);

    const stats = await stat(filePath);

    const [, item] = await statsToEntry(stats);

    // const node = getNode(tree, path);
    // if (!node) {
    //   res.statusCode = 404;
    //   return;
    // }

    // if (req.headers["if-none-match"] === node.ETag) {
    //   res.statusCode = 304;
    //   return;
    // }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        const value = item[header];
        if (value) res.setHeader(header, value);
      }
    );

    return pipeline(fs.createReadStream(filePath), res);
  }

  async headFile(path, req, res) {
    const tree = await this.getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        const value = node[header];
        if (value) res.setHeader(header, value);
      }
    );
  }

  async headFolder(path, req, res) {
    const tree = await this.getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    const { ETag } = node;

    res.statusCode = 200;
    res.setHeader("ETag", ETag);
  }
}

module.exports.FS = FS;
