import _ from "#lib/_";
import paths from "#lib/paths";

export default async function SaveBuiltData(X) {
  const D = X.deps["build-full-data"];

  const timeline = { periods: [] };
  for (const period of D.timeline) {
    timeline.periods.push(period);
    timeline.current = period.periodId;
    const periodData = D.periods[period.periodId];
    await X.spit(
      paths.pagesDB("periods", `${period.periodId}.json`),
      periodData,
    );
  }
  for (const ident in D.players) {
    const clmId = D.getClmId(ident);
    for (const periodId in D.players[ident]) {
      const playerData = D.players[ident][periodId];
      await X.spit(
        paths.pagesDB("players", `${clmId}`, `${periodId}.json`),
        playerData,
      );
    }
  }
  timeline.periods.reverse();
  await X.spit(paths.pagesCO("builtActions.json"), D.actions);

  return timeline;
}
