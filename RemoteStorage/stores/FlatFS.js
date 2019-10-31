const fs = require("fs");
const { join, resolve } = require("path");
const { promisify } = require("util");
const stream = require("stream");

const uuid = require("uuid/v4");
const { CRC32Stream } = require("crc32-stream");

const { setNode, getNode, removeNode, createTree } = require("../tree");
const Storage = require("../Storage");

const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const pipeline = promisify(stream.pipeline);
const unlink = promisify(fs.unlink);

class FlatFS extends Storage {
  constructor({ root }) {
    super();
    this.tree = null;
    this.root = root;
  }

  async load() {
    await mkdir(join(this.root, "files"), { recursive: true });

    let data;

    const path = resolve(join(this.root, "tree.json"));
    try {
      data = await readFile(path, {
        encoding: "utf8",
      });
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      this.tree = createTree();
      await this.setTree();
      return;
    }

    try {
      this.tree = JSON.parse(data);
    } catch (err) {
      throw new Error(`File "${path}" corrupted, could not parse.`);
    }
  }

  async unload() {
    return this.setTree();
  }

  async getTree() {
    return this.tree;
  }

  async setTree() {
    return writeFile(
      join(this.root, "tree.json"),
      JSON.stringify(this.tree, null, 2),
      {
        encoding: "utf8",
      }
    );
  }

  async getFolder(path, req, res) {
    const tree = await this.getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    if (req.headers["if-none-match"] === node.ETag) {
      res.statusCode = 304;
      return;
    }

    const items = node.children.reduce((acc, item) => {
      const node = getNode(tree, path + item);
      if (item.endsWith("/")) {
        acc[item] = {
          ETag: node.ETag,
        };
      } else {
        acc[item] = {
          "Content-Type": node["Content-Type"],
          "Content-Length": node["Content-Length"],
          "Last-Modified": node["Last-Modified"],
          ETag: node["ETag"],
        };
      }

      return acc;
    }, {});

    res.setHeader("ETag", node.ETag);
    res.setHeader("Content-Type", "application/ld+json");
    res.statusCode = 200;
    res.write(
      JSON.stringify({
        items,
        "@context": "http://remotestorage.io/spec/folder-description",
      })
    );
  }

  async putFile(path, req, res) {
    const tree = await this.getTree();

    const ifNoneMatch = req.headers["if-none-match"];
    const ifMatch = req.headers["if-match"];

    if (ifNoneMatch) {
      const currentNode = getNode(tree, path);
      if (ifNoneMatch === "*" && currentNode) {
        res.statusCode = 412;
        return;
      }
    }

    if (ifMatch) {
      const currentNode = getNode(tree, path);
      if (!currentNode || ifMatch !== currentNode.ETag) {
        res.statusCode = 412;
        return;
      }
    }

    const id = uuid();
    const date = new Date().toUTCString();

    const checksum = new CRC32Stream();

    await pipeline(
      req,
      checksum,
      fs.createWriteStream(join(this.root, "files", id), {
        flags: "w",
      })
    );

    const ETag = '"' + checksum.hex() + '"';

    const node = {
      "Content-Type": req.headers["content-type"],
      "Content-Length": req.headers["content-length"],
      "Last-Modified": date,
      ETag,
      id,
    };

    const wasSet = setNode(tree, path, node);
    if (!wasSet) {
      res.statusCode = 409;
      return;
    }
    await this.setTree();

    res.statusCode = 200;
    res.setHeader("ETag", ETag);
    // not in the spec
    // https://github.com/remotestorage/spec/issues/173
    res.setHeader("Last-Modified", date);
  }

  async getFile(path, req, res) {
    const tree = await this.getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    if (req.headers["if-none-match"] === node.ETag) {
      res.statusCode = 304;
      return;
    }

    res.statusCode = 200;
    ["Content-Length", "Last-Modified", "ETag", "Content-Type"].forEach(
      header => {
        const value = node[header];
        if (value) res.setHeader(header, value);
      }
    );

    await pipeline(fs.createReadStream(join(this.root, "files", node.id)), res);
  }

  async deleteFile(path, req, res) {
    const tree = await this.getTree();

    const node = getNode(tree, path);
    if (!node) {
      res.statusCode = 404;
      return;
    }

    const wasDeleted = removeNode(tree, path);
    if (!wasDeleted) {
      res.statusCode = 409;
      return;
    }
    await this.setTree();

    res.statusCode = 200;

    unlink(join(this.root, "files", node.id)).catch(err => {
      // TODO
      console.error(err);
    });
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

module.exports = FlatFS;
