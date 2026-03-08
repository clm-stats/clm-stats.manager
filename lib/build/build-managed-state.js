import _ from "#lib/_";
import consts from "#lib/consts";
import paths from "#lib/paths";
import * as A from "#lib/action";
import * as gg from "#lib/gg";

export default async function BuildManagedState(X) {
  const lastBuild = await _.slurp(paths.pagesCO("build.json"));
  if (!lastBuild) {
    throw "could not load lasBuild's `build.json` file";
  }

  const eventAutoActions = {
    "tournament/.*/event/.*": (slug) => A.AddEvent(slug),
    "tournament/.*bunker.*/event/.*crazy.*": (slug) => A.MakeIneligible(slug),
  };

  const now = 60 * 60 * Math.floor(Date.now() / 1000 / 60 / 60);
  const latestSlugs = await gg.getClmEvents(consts.getPeriodStartTime(14), now);
  const actions = [...lastBuild.actions, ...X.newActions];
  const spec = A.buildSpec([
    A.Bulk(
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
    ),
    ...actions,
  ]);
  await X.spit(paths.pagesCO("build.json"), { actions, builtAt: now });
  X.builtAt = now;
  return { actions, spec };
}
