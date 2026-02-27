import express from "express";
import paths from "#lib/paths";
import consts from "#lib/consts";
import { getClientSecret } from "#lib/env";

const ADMIN_BY_DISCORD_ID = {
  ["82990112912179200"]: "nicolet",
  ["129441645119799296"]: "jessdang3r",
  ["237821583614410764"]: "dz",
  ["268422181644402688"]: "tenacity",
};

const clientSecret = getClientSecret();

const app = express();
app.use(express.static(paths.npmRoot("static")));
app.use(express.static(paths.npmRoot("dist")));
app.get("/api/status", async (_req, res) => {
  res.json({ actions: [1, 2, 3], events: {}, playerGroups: {} });
});
app.get("/api/oauth", async (req, res) => {
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
  console.log(identity);
  res.redirect("/");
});
app.listen(consts.PORT, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(" [| clm-stats manager |]  running on port", consts.PORT);
});
