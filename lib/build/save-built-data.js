import _ from "#lib/_";
import paths from "#lib/paths";

export default async function SaveBuiltData(X) {
  const D = X.deps["build-full-data"];
  const timeline = { periods: [] };
  for (const period of D.timeline) {
    timeline.periods.push(period);
    timeline.current = period.periodId;
    if (period.periodId !== 14) {
      continue;
    }
    const periodData = D.periods[period.periodId];
    await _.spit(
      paths.appCO("docs", "db", "periods", `${period.periodId}.json`),
      periodData,
    );
  }
  for (const ident in D.players) {
    const clmId = D.getClmId(ident);
    for (const periodId in D.players[ident]) {
      if (periodId !== "14" && periodId !== 14) {
        continue;
      }
      const playerData = D.players[ident][periodId];
      await _.spit(
        paths.appCO("docs", "db", "players", `${clmId}`, `${periodId}.json`),
        playerData,
      );
    }
  }
  timeline.periods.reverse();
  await _.spit(paths.appCO("js", "timeline.json"), timeline);
  return {};
}
