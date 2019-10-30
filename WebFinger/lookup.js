"use strict";

const { lookup } = require("./client");
const fetch = require("node-fetch");

global.fetch = fetch;

const [, , resource] = process.argv;

lookup(resource).then(r => {
  console.dir(r, {
    depth: null,
    colors: true,
  });
}, console.error);

// console.log(resource);
