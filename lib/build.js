const MOD_STATE = { steps: {}, orderedNames: [] };

const mkDefaultRunner =
  (name) =>
  async (...args) => {
    try {
      const mod = await import(`#lib/build/${name}`);
      return await mod.default(...args);
    } catch (e) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        console.log(`unimplemented runner for step:  [ ${name} ]`);
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

export default async function BUILD() {
  const X = { stepData: {} };
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
}
