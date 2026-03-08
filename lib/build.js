import * as fs from "node:fs/promises";
import path from "node:path";
import stringHash from "string-hash";
import git from "git-client";
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

function gitFn(baseDir, prop, ...args) {
  const $gitDir = path.join(baseDir, ".git");
  return git[prop](...args, { $gitDir, $workTree: baseDir });
}

async function gitEnsureClean(baseDir) {
  const status = await gitFn(baseDir, "status", { porcelain: true });
  if (!!status) {
    throw [
      "expected porcelain git status:",
      `wd: ${baseDir}`,
      "cmd: git status --porcelain",
      "output",
      status,
    ].join("\n");
  }
}

async function gitIsClean(baseDir) {
  try {
    await gitEnsureClean(baseDir);
    return true;
  } catch (_e) {
    return false;
  }
}

async function gitEnsureCleanLatest(baseDir) {
  await gitEnsureClean(baseDir);
  await gitFn(baseDir, "pull");
  await gitEnsureClean(baseDir);
}

export default async function BUILD(newActions = []) {
  const X = { stepData: {}, newActions };

  const DOCS_FS = {};
  const writeVal = function (dst, val) {
    DOCS_FS[path.relative(paths.pagesCO(), dst)] = val;
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
      X.deps = deps;
      X.stepData[name] = await step.runner(X, deps);
      return X.stepData[name];
    }
    runStep.cache ||= {};
    runStep.cache[name] ||= runStepImpl();
    return await runStep.cache[name];
  }
  await gitEnsureCleanLatest(paths.appCO());
  await Promise.all(MOD_STATE.orderedNames.map(runStep));
  await runStep("build-pages-app");
  await gitEnsureCleanLatest(paths.pagesCO());
  await rimraf(paths.pagesDocs());
  for (const k in DOCS_FS) {
    const [ftype, fdata] = DOCS_FS[k];
    if (ftype === "str") {
      await _.writeStr(paths.pagesCO(k), fdata);
    } else if (ftype === "json") {
      await _.spit(paths.pagesCO(k), fdata);
    } else if (ftype === "cp") {
      await mkdirp(path.dirname(paths.pagesCO(k)));
      await fs.copyFile(fdata, paths.pagesCO(k));
    }
  }
  const isUnchanged = await gitIsClean(paths.pagesCO());
  if (isUnchanged) {
    console.log("build did not produce any changes. done now");
    return;
  }
  const jsonHash = (a) => stringHash(JSON.stringify(a));
  const message = [
    "clm-stats build |",
    ...[" ts@", X.builtAt],
    ...[" newActions[", X.newActions.length, "]"],
    ...(!X.newActions.length ? [""] : ["#", jsonHash(X.newActions)]),
    " app#",
    await gitFn(paths.appCO(), "revParse", { short: true }, "HEAD"),
  ].join("");
  await gitFn(paths.pagesCO(), "add", { all: true });
  await gitFn(paths.pagesCO(), "commit", { message });
  await gitFn(paths.pagesCO(), "push");
  console.log("complete build pushed to github");
}
