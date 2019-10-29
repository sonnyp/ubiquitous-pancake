module.exports = class HTTPError extends Error {
  constructor(response) {
    super(response.statusText);
    this.name = "HTTPError";
    this.response = response;
    this.status = response.status;
  }
};
