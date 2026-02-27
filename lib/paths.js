import path from "node:path";
import { fileURLToPath } from "url";
import { getDataRoot } from "#lib/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataRoot = getDataRoot();

const E = {};

E.data = (...args) => path.join(dataRoot, ...args);
E.data.cache = (...args) => E.data("cache", ...args);
E.data.static = (...args) => E.data("static", ...args);
E.data.state = (...args) => E.data("state", ...args);
E.v2Saved = (...args) => E.data.static("clm-stats-v2.saved", ...args);
E.npmRoot = (...args) => path.join(__dirname, "..", ...args);
E.gqlCache = (...args) => `${E.data.cache("startgg.gqlCache", ...args)}.json`;
E.gqlQuery = (...args) => `${E.npmRoot("gql", ...args)}.gql`;

export default E;
