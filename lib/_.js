import * as fs from "node:fs/promises";
import path from "node:path";
import { mkdirp } from "mkdirp";

const E = {};

E.readStr = (f) => fs.readFile(f, "utf-8");
E.slurp = (f) => E.readStr(f).then((s) => JSON.parse(s));
E.slurpOr = (f, fb) => E.slurp(f).catch(() => fb);
E.spit = (f, d) =>
  mkdirp(path.dirname(f)).then(() => fs.writeFile(f, JSON.stringify(d)));

export default E;
