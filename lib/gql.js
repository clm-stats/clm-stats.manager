import { GraphQLClient, gql } from "graphql-request";
import * as fs from "node:fs/promises";
import { getGGAuth } from "#lib/env";
import _ from "#lib/_";
import paths from "#lib/paths";

const API_URL = `https://api.start.gg/gql/alpha`;

const mkClient = (token) =>
  new GraphQLClient(API_URL, {
    ...(!token ? {} : { headers: { authorization: `Bearer ${token}` } }),
  });

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char; // A common bitwise operation
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const tout = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

let cacheOnly = false;

const runGqlQuery = (token) => async (qname, vars) => {
  const vals = Object.values(vars || {});
  const qpath = paths.gqlQuery(qname);
  const rawq = await _.readStr(qpath);
  const qkey = simpleHash(
    (() => {
      if (vals.length === 0) {
        return `${rawq}|${qname}|`;
      }
      if (vals.length === 1) {
        return `${rawq}|${qname}|${vals[0]}`;
      }
      if (vals.length === 2) {
        return `${rawq}|${qname}|${vars.phaseGroupId}|${vars.page}`;
      }
      if (vals.length === 3) {
        return `${rawq}|${qname}|${vars.pageE}|${vars.pageS}|${vars.slug}`;
      }
    })(),
  );
  const qpathCached = paths.gqlCache(`${qname}.${qkey}`);
  const cached = await (async () => {
    try {
      return [await _.slurp(qpathCached)];
    } catch (_) {
      return undefined;
    }
  })();
  if (cached) {
    return cached[0];
  }
  if (cacheOnly) {
    return undefined;
  }
  const q = gql(rawq.split("\n"));
  await tout(15 * 1000);
  const res = await mkClient(token).request({
    url: `${API_URL}/v1/graphql`,
    document: q,
    ...(vars ? { variables: vars } : {}),
  });
  try {
    await fs.writeFile(qpathCached, JSON.stringify(res));
  } catch (_) {}
  return res;
};

const runGqlQueryGGAuth = runGqlQuery(getGGAuth(() => {}));
runGqlQueryGGAuth.for = (token) => runGqlQuery(token);
runGqlQueryGGAuth.disableNetwork = () => {
  cacheOnly = true;
};
runGqlQueryGGAuth.enableNetwork = () => {
  cacheOnly = false;
};
runGqlQueryGGAuth.isNetworkEnabled = () => {
  return cacheOnly;
};
runGqlQueryGGAuth.withoutNetwork = async (f) => {
  const needsReenabled = runGqlQueryGGAuth.isNetworkEnabled();
  runGqlQueryGGAuth.disableNetwork();
  const res = await f();
  if (needsReenabled) {
    runGqlQueryGGAuth.enableNetwork();
  }
  return res;
};

export default runGqlQueryGGAuth;
