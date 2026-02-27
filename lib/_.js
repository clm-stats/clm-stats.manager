import * as fs from "node:fs/promises";

const E = {};

E.readStr = (f) => fs.readFile(f, "utf-8");
E.slurp = (f) => E.readStr(f).then((s) => JSON.parse(s));
E.slurpOr = (f, fb) => E.slurp(f).catch(() => fb);

export default E;
