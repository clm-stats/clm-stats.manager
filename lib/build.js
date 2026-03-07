import * as fs from "node:fs/promises";
import path from "node:path";
import { mkdirp } from "mkdirp";
import { rimraf } from "rimraf";
import _ from "#lib/_";
import paths from "#lib/paths";

const MOD_STATE = { steps: {}, orderedNames: [] };

const mkDefaultRunner =
  (name) =>
  async (...args) => {
    try {
      console.log(`#lib/build/${name}`);
      const mod = await import(`#lib/build/${name}`);
      return await mod.default(...args);
    } catch (e) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        console.log(`unimplemented runner for step:  [ ${name} ]`);
        console.error(e);
        return undefined;
      }
      console.error(e);
      console.error("-------------------");
      throw e;
    }
  };

const Step =
  (name, deps = []) =>
  (runner = mkDefaultRunner(name)) => {
    const stepInd = MOD_STATE.orderedNames.length;
    if (MOD_STATE.steps[name]) {
      throw `reused step name:  [ ${name} ]`;
    }
    for (const depName of deps) {
      if (!MOD_STATE.steps[depName]) {
        throw `unknown dependency  [ ${depName} ]  for  [ ${name} ]`;
      }
    }
    MOD_STATE.orderedNames.push(name);
    MOD_STATE.steps[name] = { name, stepInd, deps, runner };
  };

Step("build-legacy-data")();
Step("build-managed-state")();
Step("fetch-state-dependent-data", ["build-managed-state"])();
Step("build-full-data", ["fetch-state-dependent-data", "build-legacy-data"])();
Step("save-built-data", ["build-full-data"])();
Step("build-pages-app", ["save-built-data"])();

export default async function BUILD() {
  const X = { stepData: {} };

  const DOCS_FS = {};
  const writeVal = function (dst, val) {
    DOCS_FS[path.relative(paths.appCO(), dst)] = val;
    return Promise.resolve();
  };
  X.writeStr = (dst, s) => writeVal(dst, ["str", s]);
  X.spit = (dst, d) => writeVal(dst, ["json", d]);
  X.useStatic = (dst, src) => writeVal(dst, ["cp", src]);

  async function runStep(name) {
    async function runStepImpl() {
      const step = MOD_STATE.steps[name];
      const deps = {};
      for (const dep of step.deps) {
        deps[dep] = await runStep(dep);
      }
      X.stepData[name] = await step.runner({ ...X, deps });
      return X.stepData[name];
    }
    runStep.cache ||= {};
    runStep.cache[name] ||= runStepImpl();
    return await runStep.cache[name];
  }
  await Promise.all(MOD_STATE.orderedNames.map(runStep));
  await runStep("build-pages-app");
  await rimraf(paths.appCO("docs"));
  for (const k in DOCS_FS) {
    console.log(k);
    const [ftype, fdata] = DOCS_FS[k];
    if (ftype === "str") {
      await _.writeStr(paths.appCO(k), fdata);
    } else if (ftype === "json") {
      await _.spit(paths.appCO(k), fdata);
    } else if (ftype === "cp") {
      await mkdirp(path.dirname(paths.appCO(k)));
      await fs.copyFile(fdata, paths.appCO(k));
    }
  }
}
