import { GraphQLClient, gql } from "graphql-request";
import * as fs from "node:fs/promises";
import { getGGAuth } from "#lib/env";
import _ from "#lib/_";
import paths from "#lib/paths";
import * as log from "#lib/log";

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

const runGqlQuery =
  (token) =>
  async (qname, vars, opts = {}) => {
    const { logInfo = () => {} } = opts;
    const keys = Object.keys(vars || {});
    keys.sort();
    if (keys.length === 2 && keys[0] === "page" && keys[1] === "phaseGroupId") {
      keys.reverse();
    }
    const qpath = paths.gqlQuery(qname);
    const rawq = await _.readStr(qpath);
    const qkey = simpleHash(
      (() => {
        let qkey_ = `${rawq}|${qname}`;
        if (keys.length === 0) {
          return `${qkey_}|`;
        }
        for (const key of keys) {
          qkey_ += `|${vars[key]}`;
        }
        return qkey_;
      })(),
    );
    const qpathCached = paths.gqlCache(`${qname}.${qkey}`);
    // console.log(`FETCH::[ ${qname}.${qkey} ]  checking cache`, opts);
    const cached = await (async () => {
      try {
        if (opts.skipCache) {
          return undefined;
        }
        return [await _.slurp(qpathCached)];
      } catch (_) {
        return undefined;
      }
    })();
    if (cached) {
      return cached[0];
    }
    if (opts.cacheOnly) {
      return undefined;
    }
    const q = gql(rawq.split("\n"));
    logInfo("sgg:graphql", `![${qname}]`, `![${JSON.stringify(vars)}]`);
    await tout(6 * 1000);
    const res = await mkClient(token).request({
      url: `${API_URL}/v1/graphql`,
      document: q,
      ...(vars ? { variables: vars } : {}),
    });
    try {
      await fs.writeFile(qpathCached, JSON.stringify(res));
    } catch (_e) {
      // console.log(`FETCH::[ ${qname}.${qkey} ]  ERROR`);
      // console.log(_e);
    }
    return res;
  };

const runGqlQueryGGAuth = runGqlQuery(getGGAuth(() => {}));
runGqlQueryGGAuth.for = (token) => runGqlQuery(token);

export default runGqlQueryGGAuth;
