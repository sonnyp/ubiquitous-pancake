module.exports = function OAuth() {
  return async function authorize(searchParams, req, res) {
    const redirectUri = searchParams.get("redirect_uri");
    const token = Math.random()
      .toString()
      .slice(2);

    const redirectURL = new URL(redirectUri);
    redirectURL.searchParams.set("access_token", token);
    redirectURL.searchParams.set("token_type", "bearer");
    redirectURL.hash = redirectURL.search.substr(1);
    redirectURL.search = "";

    res.statusCode = 302;
    res.setHeader("Location", redirectURL.toString());
    res.end();
  };
};
