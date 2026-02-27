const E = {};

E.clientId = process.env["CLM_STATS_DISCORD_CLIENT_ID"];
E.PORT = process.env["PORT"] || 9182;
E.redirect_uri = `http://localhost:1234/api/oauth`;
E.scope = ["identify"].join(" ");

export default E;
