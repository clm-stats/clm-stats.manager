import * as fs from "node:fs/promises";
import path from "node:path";
import stringHash from "string-hash";
import git from "git-client";
import { mkdirp } from "mkdirp";
import { rimraf } from "rimraf";
import _ from "#lib/_";
import paths from "#lib/paths";
import * as log from "#lib/log";

const MOD_STATE = { steps: {}, orderedNames: [] };

const mkDefaultRunner =
  (name) =>
  async (...args) => {
    try {
      const mod = await import(`#lib/build/${name}`);
      return await mod.default(...args);
    } catch (e) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        log.err(`unimplemented runner for step:  [ ${name} ]`);
        log.err(e);
        return undefined;
      }
      log.err(e);
      log.err("--------- UNKNOWN ERROR ----------");
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

async function buildNewActions(newActions = [], logFn) {
  const X = {
    stepData: {},
    newActions,
    logInfo: (...args) => logFn(args, false),
    logErr: (...args) => logFn(args, true),
  };

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
      X.logInfo(`executing build step ![${name}]`);
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
  X.logInfo("writing to file system...");
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
  X.logInfo("managing result via git");
  const isUnchanged = await gitIsClean(paths.pagesCO());
  if (isUnchanged) {
    X.logInfo("build did not produce any changes. done now");
    return;
  }
  const jsonHash = (a) => stringHash(JSON.stringify(a));
  const lastCommit = (gitDir) =>
    gitFn(gitDir, "revParse", { short: true }, "HEAD");
  const message = [
    "clm-stats build |",
    ...[" ts@", Math.floor(Date.now() / 1000)],
    ...[" newActions[", X.newActions.length, "]"],
    ...(!X.newActions.length ? [""] : ["#", jsonHash(X.newActions)]),
    ...[" app#", await lastCommit(paths.appCO())],
  ].join("");
  await gitFn(paths.pagesCO(), "add", { all: true });
  await gitFn(paths.pagesCO(), "commit", { message });
  await gitFn(paths.pagesCO(), "push");
  X.logInfo("complete build pushed to github");
  X.logInfo("view deploy status here:");
  X.logInfo("     https://github.com/clm-stats/clm-stats.github.io/actions");
  const selfHash = await lastCommit(paths.pagesCO());
  X.logInfo(`for commit: ${selfHash}`);
  return selfHash;
}

export default new (class BUILDER {
  constructor() {
    console.log("SHOULD ONLY EVER SEE THIS ONCE");
    this.isBuilding = false;
    this.lastHash = null;
    this.lastFinish = null;
    this.error = null;
    this.io = [];
  }

  getStatus(ioSeen = 0) {
    return {
      canBuild: this.canBuild,
      isBuilding: this.isBuilding,
      lastStartAt: this.lastStartAt,
      lastHash: this.lastHash,
      lastFinish: this.lastFinish,
      error: this.error,
      io: this.io.slice(ioSeen),
    };
  }

  assertBuildable() {
    if (this.isBuilding) {
      throw "already building";
    }
    if (this.lastFinish && Date.now() - this.lastFinish < 1000 * 60 * 5) {
      throw "wait at least 5 minutes between builds";
    }
  }

  get canBuild() {
    try {
      this.assertBuildable();
      return true;
    } catch (e) {
      return false;
    }
  }

  startBuild(newActions) {
    this.assertBuildable();
    this.isBuilding = true;
    this.lastStartAt = Date.now();
    this.io = [];
    return (async () => {
      try {
        const logFn = (...args) => {
          console.log(...args);
          this.io.push(args);
        };
        this.lastHash = await buildNewActions(newActions, logFn);
        this.error = null;
      } catch (e) {
        this.error = e;
      } finally {
        this.isBuilding = false;
        this.lastFinish = Date.now();
      }
    })();
  }
})();
