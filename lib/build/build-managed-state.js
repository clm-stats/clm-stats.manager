import _ from "#lib/_";
import consts from "#lib/consts";
import paths from "#lib/paths";
import * as A from "#lib/action";
import * as gg from "#lib/gg";
import * as log from "#lib/log";

export async function buildSpec(...args) {
  const lastBuild = await _.slurp(paths.pagesCO("build.json"));
  if (!lastBuild) {
    throw "could not load lasBuild's `build.json` file";
  }
  const [autoAction = lastBuild.autoAction, newActions = []] = args;
  const actions = [...lastBuild.actions, ...newActions];
  const spec = A.buildSpec([autoAction, ...actions]);
  return { actions, spec };
}

export default async function BuildManagedState(X) {
  const eventAutoActions = {
    "tournament/.*/event/.*": (slug) => A.AddEvent(slug),
    "tournament/.*bunker.*/event/.*crazy.*": (slug) => A.MakeIneligible(slug),
  };

  const now = 60 * 60 * Math.floor(Date.now() / 1000 / 60 / 60);
  X.logInfo(`getting clm events as of ${now}`);
  const periodStartTime = consts.getPeriodStartTime(14);
  const latestSlugs = await gg.getClmEvents(periodStartTime, now, X.logInfo);
  const autoAction = A.Bulk(
    latestSlugs.flatMap((slug) => {
      return Object.keys(eventAutoActions).flatMap((regexStr) => {
        const execd = new RegExp(regexStr).exec(slug);
        if (!execd) {
          return [];
        }
        const _mkers = eventAutoActions[regexStr];
        const mkers = Array.isArray(_mkers) ? _mkers : [_mkers];
        return mkers.map((mker) => mker(...execd));
      });
    }),
  );
  const { actions, spec } = await buildSpec(autoAction, X.newActions);
  await X.spit(paths.pagesCO("build.json"), { actions, autoAction });
  return { actions, spec };
}
