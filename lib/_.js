import * as fs from "node:fs/promises";
import path from "node:path";
import { mkdirp } from "mkdirp";

const E = {};

E.readStr = (f) => fs.readFile(f, "utf-8");
E.slurp = (f) => E.readStr(f).then((s) => JSON.parse(s));
E.slurpOr = (f, fb) => E.slurp(f).catch(() => fb);
E.writeStr = (f, s) => mkdirp(path.dirname(f)).then(() => fs.writeFile(f, s));
E.spit = (f, d) => E.writeStr(f, JSON.stringify(d));

export default E;
