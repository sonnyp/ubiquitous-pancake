function etag() {
  return (
    '"' +
    Math.random()
      .toString()
      .slice(2) +
    '"'
  );
}

function parse(path) {
  const nodes = path.split("/");

  let child;
  let parent;

  if (path.endsWith("/")) {
    child = nodes[nodes.length - 2] + "/";
    nodes.splice(-2);
    parent = nodes.join("/") + "/";
  } else {
    child = nodes[nodes.length - 1];
    nodes.splice(-1);
    parent = nodes.join("/") + "/";
  }

  return [child, parent];
}

function updateNode(tree, path) {
  const node = getNode(tree, path);
  if (!node) return false;

  node.ETag = etag();

  if (path === "/") return true;

  const [, parent] = parse(path);
  if (parent in tree) updateNode(tree, parent);
}

function createTree() {
  const tree = Object.create(null);
  tree["/"] = {
    children: [],
    ETag: etag(),
  };
  return tree;
}

function getNode(tree, path) {
  return tree[path];
}

function setNode(tree, path, node) {
  // FIXME use parse and recursive createParent + updateNode function
  // const [child, parent] = parse(path);

  const [, ...branches] = path.split("/");
  const name = branches.pop();
  let cursor = "/";

  for (let i = 0; i <= branches.length; i++) {
    let branch = tree[cursor];
    if (!branch) {
      branch = tree[cursor] = {
        children: [],
        ETag: etag(),
      };
    } else {
      if (!branch.children) {
        return false;
      }
      branch.ETag = etag();
    }

    const branchName = branches[i];
    if (i === branches.length) {
      if (!branch.children.includes(name)) {
        branch.children.push(name);
      }
    } else {
      if (!branch.children.includes(branchName + "/")) {
        branch.children.push(branchName + "/");
      }
    }

    cursor += branchName + "/";
  }

  tree[path] = node;
  return true;
}

function removeNode(tree, path) {
  if (path === "/") return false;

  const node = getNode(tree, path);
  if (!node) return false;

  delete tree[path];

  const [child, parent] = parse(path);
  const parentNode = getNode(tree, parent);
  parentNode.children = parentNode.children.filter(node => node !== child);

  if (parentNode.children.length === 0) {
    removeNode(tree, parent);
  } else {
    updateNode(tree, parent);
  }

  return true;
}

module.exports.etag = etag;
module.exports.createTree = createTree;
module.exports.getNode = getNode;
module.exports.setNode = setNode;
module.exports.removeNode = removeNode;
