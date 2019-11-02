const HTTPError = require("../http/error");

function createNode(headers) {
  const node = Object.create(null);

  const contentLength = headers.get("content-length");
  if (contentLength !== null) {
    node.size = +contentLength;
  }

  const contentType = headers.get("content-type");
  if (contentType !== null) {
    node.type = contentType;
  }

  const etag = headers.get("etag");
  if (etag !== null) {
    node.version = etag;
  }

  const lastModified = headers.get("last-modified");
  if (lastModified !== null) {
    node.date = new Date(lastModified);
  }

  return node;
}

class RemoteStorage {
  constructor(url, token) {
    this.url = url;
    this.token = token;
  }

  async fetch(path, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Authorization"] = `Bearer ${this.token}`;

    const response = await fetch(this.url + path, {
      cache: "no-store",
      ...options,
    });
    // if (!response.ok) {
    // throw new HTTPError(response);
    // }
    return response;
  }

  async *createAsyncIterator(path) {
    const response = await this.fetch(path, { method: "GET" });
    const folder = await response.json();
    const node = {
      ...createNode(response.headers),
      items: folder.items,
    };

    yield [path, node];

    const { items } = folder;

    for (const [name, item] of Object.entries(items)) {
      if (name.endsWith("/")) {
        yield* this.createAsyncIterator(path + name);
      } else {
        const leafNode = {
          ...createNode(new Headers(item)),
        };

        yield [path + name, leafNode];
      }
    }
  }

  async *[Symbol.asyncIterator]() {
    yield* this.createAsyncIterator("/");
  }

  async get(path, ifNoneMatch) {
    const headers = {};
    if (ifNoneMatch) {
      headers["If-None-Match"] = ifNoneMatch;
    }

    const res = await this.fetch(path, {
      method: "GET",
      headers,
    });
    const { status } = res;

    if (status === 200) {
      return [createNode(res.headers), res];
    }

    if (status === 304) {
      return [null, res];
    }

    throw new HTTPError(res);
  }

  async head(path, options = {}) {
    const res = await this.fetch(path, {
      method: "HEAD",
      ...options,
    });
    return createNode(res.headers);
  }

  async delete(path, options = {}) {
    return this.fetch(path, {
      method: "DELETE",
      ...options,
    });
  }

  async put(path, data, ifMatch, options = {}) {
    const headers = {};
    if (ifMatch) {
      headers["If-Match"] = ifMatch;
    }

    const res = await this.fetch(path, {
      method: "PUT",
      body: data,
      headers,
      ...options,
    });
    const { status } = res;

    if (status === 412) {
      return [null, res];
    }

    if ([200, 201].includes(status)) {
      return [
        {
          ...createNode(res.headers),
          size: data.size,
          type: data.type || null,
        },
        res,
      ];
    }

    throw new HTTPError(res);
  }
}

// https://tools.ietf.org/html/draft-dejong-remotestorage-13#section-10
function getRemoteStorageRecord(JRD) {
  return JRD.links.find(link => {
    return (
      link.rel === "http://tools.ietf.org/id/draft-dejong-remotestorage" ||
      link.rel === "remotestorage"
    );
  });
}

function buildAuthURL(record, params = {}) {
  const authURL =
    record.properties["http://tools.ietf.org/html/rfc6749#section-4.2"];
  // let version = record.properties["http://remotestorage.io/spec/version"];

  const clientId = params.client_id || document.title;
  const redirectUri = params.redirect_uri || location.href;

  const url = new URL(authURL);
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("response_type", "token");
  url.searchParams.append("scope", params.scope);

  return url;
}

module.exports.getRemoteStorageRecord = getRemoteStorageRecord;
module.exports.buildAuthURL = buildAuthURL;
module.exports.RemoteStorage = RemoteStorage;
