const getByVarname =
  (varname) =>
  (withRaiser = (raise) => raise()) => {
    const value = process.env[varname];
    return value
      ? value
      : withRaiser(() => {
          throw `No value supplied for ENVIRONMENTAL VARIABLE:  [ ${varname} ]`;
        });
  };

export const getGGAuth = getByVarname("CLM_STATS_GG_AUTH");
export const getClientSecret = getByVarname("CLM_STATS_DISCORD_CLIENT_SECRET");
export const getDataRoot = getByVarname("CLM_STATS_DATA_DIR");
export const getSessionSecret = getByVarname("CLM_STATS_SESSION_SECRET");
export const getAppCOPath = getByVarname("CLM_STATS_APP_CO");
export const getPagesCOPath = getByVarname("CLM_STATS_PAGES_CO");
