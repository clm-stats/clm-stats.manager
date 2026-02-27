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
export const getClientId = getByVarname("CLM_STATS_GG_CLIENT_ID");
export const getClientSecret = getByVarname("CLM_STATS_GG_CLIENT_SECRET");
export const getDataRoot = getByVarname("CLM_STATS_DATA_DIR");
