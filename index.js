import express from "express";
import paths from "#lib/paths";
import consts from "#lib/consts";
import { getClientSecret, getSessionSecret } from "#lib/env";
import { getIronSession } from "iron-session";

const sessionConfig = {
  cookieName: "my_app_session",
  password: getSessionSecret(),
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  },
};

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

class HttpErrorUnauthorized extends HttpError {
  constructor(message) {
    super(`Unauthorized  [ ${message} ]`, 401);
  }
}

const clientSecret = getClientSecret();

const app = express();
app.use(express.static(paths.npmRoot("static")));
app.use(express.static(paths.npmRoot("dist")));
app.use(express.static(paths.data.admin("static")));
app.get("/api/status", async (req, res) => {
  const session = await getIronSession(req, res, sessionConfig);
  if (req.query.logout) {
    session.destroy();
  }
  if (
    req.query.logout ||
    !session.user ||
    session.user.ident !== consts.getAdminIdent(session.user.discordId)
  ) {
    res.json({});
    return;
  }
  res.json({
    actions: [1, 2, 3],
    events: {},
    playerGroups: {},
    user: session.user,
  });
});
app.get("/api/oauth", async (req, res) => {
  const session = await getIronSession(req, res, sessionConfig);
  const body = new URLSearchParams({
    ["grant_type"]: "authorization_code",
    ["code"]: req.query.code,
    ["redirect_uri"]: consts.redirect_uri,
  });
  const baseUrl = "https://discord.com";
  const fetchUrl = `${baseUrl}/api/oauth2/token`;
  console.log(" __  FETCH  __");
  const { access_token } = await fetch(fetchUrl, {
    body,
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(consts.clientId + ":" + clientSecret).toString("base64"),
    },
  }).then((res) => res.json());
  const identity = await fetch(baseUrl + "/api/users/@me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then((res) => res.json());
  const adminIdent = consts.getAdminIdent(identity.id);
  if (!adminIdent) {
    throw new HttpErrorUnauthorized(`${discordName} is not an admin`);
  }
  const discordName = identity.global_name || identity.username;
  session.user = { discordName, discordId: identity.id, ident: adminIdent };
  await session.save();
  res.redirect(`/?authedIdent=${adminIdent}`);
});
app.listen(consts.PORT, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(" [| clm-stats manager |]  running on port", consts.PORT);
});
