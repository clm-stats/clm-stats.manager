const E = {};

E.clientId = (() => {
  return import.meta.env
    ? import.meta.env.VITE_CLM_STATS_DISCORD_CLIENT_ID
    : process.env.CLM_STATS_DISCORD_CLIENT_ID;
})();
E.PORT =
  (() => {
    return import.meta.env ? import.meta.VITE_PORT : process.env.PORT;
  })() || 9182;
const baseUrl = (() => {
  return "https://clm.public-universal-domain.org";
})();
E.redirect_uri = `${baseUrl}/api/oauth`;
E.scope = ["identify"].join(" ");

const ADMIN_IDENT_BY_DISCORD_ID = {
  ["82990112912179200"]: "Nicolet",
  ["116087452443082758"]: "mattpopa",
  ["129441645119799296"]: "jess dang3r",
  ["237821583614410764"]: "dz",
  ["268422181644402688"]: "kevin tenacity",
};

const discordIdByIdent = {};
for (const id in ADMIN_IDENT_BY_DISCORD_ID) {
  discordIdByIdent[ADMIN_IDENT_BY_DISCORD_ID[id]] = id;
}

const ADMIN_IDENT_PNG_ICON = new Set([
  ADMIN_IDENT_BY_DISCORD_ID["116087452443082758"],
  ADMIN_IDENT_BY_DISCORD_ID["237821583614410764"],
]);

const getIconExt = (ident) => (ADMIN_IDENT_PNG_ICON.has(ident) ? "png" : "jpg");

E.getAdminIdent = (discordId) => ADMIN_IDENT_BY_DISCORD_ID[discordId];
E.getIconUrl = (ident) => `/iconByIdent/${ident}.${getIconExt(ident)}`;

E.getPeriodStartTime = (periodId) => {
  if (periodId === 14) {
    return 1767225600;
  }
  return 0;
};

export default E;
