module.exports.createOAuthRequestHandler = function createOAuthRequestHandler({
  domain,
  // authenticate,
  prefix,
  authorize,
  grant,
}) {
  return async function OAuthRequestHandler(req, res) {
    const { method, url } = req;

    if (method === "POST") {
      await grant(req, res);
      return;
    }

    if (method !== "GET") {
      res.statusCode = 405;
      res.end();
      return;
    }

    await authorize(req, res);

    // const sufix = url.substr((prefix || "").length);
    // const username = decodeURI(parse(sufix).pathname);

    // const token = await authenticate(username);
    // if (!token) {
    //   res.statusCode = 401;
    //   res.end();
    //   return;
    // }

    // const { searchParams } = new URL(req.url, `http://${domain}`);

    // // const clientId = searchParams.get("client_id");
    // const redirectUri = searchParams.get("redirect_uri");
    // // const responseType = searchParams.get("response_type");
    // // const scope = searchParams.get("scope");

    // const authorized = await authorize(username, searchParams);
    // if (!authorized) {
    //   res.statusCode = 403;
    //   res.end();
    //   return;
    // }

    // const redirectURL = new URL(redirectUri);
    // redirectURL.searchParams.set("access_token", token);
    // redirectURL.searchParams.set("token_type", "bearer");
    // redirectURL.hash = redirectURL.search.substr(1);
    // redirectURL.search = "";

    // res.statusCode = 302;
    // res.setHeader("Location", redirectURL.toString());
    // res.end();
  };
};
