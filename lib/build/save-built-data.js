import _ from "#lib/_";
import paths from "#lib/paths";

const OUT_OF_REGION = new Set([
  "Zamu",
  "macdaddy69",
  "Sp1nda",
  "essy",
  "Slowking",
  "Will Pickles",
  "kate wisconsin",
  "Preeminent",
  "Olivia :3",
  "Smash Papi",
  "Lowercase hero",
  "Nakamaman",
  "Chango",
  "Moe",
  "DannyPhantom",
  "Ginger",
  "AbsentPage",
  "Ben",
  "KJH",
  "Drephen",
  "Morsecode762",
  "Fraggin&Laggin",
  "PRZ",
  "Grab2Win",
  "MOF",
  "Wevans",
  "max",
  "Epoodle",
  "lexor",
  "Seal",
]);

export default async function SaveBuiltData(X) {
  const D = X.deps["build-full-data"];
  const { spec } = X.deps["build-managed-state"];

  const timeline = { periods: [] };
  for (const period of D.timeline) {
    const periodData = D.periods[period.periodId];
    if (periodData.hasNoVisibleRanks) {
      continue;
    }
    const ranks = (periodData || {}).ranks || [];
    period.top10ClmIds = ranks
      .filter((rank) => !OUT_OF_REGION.has(rank.playerIdent))
      .slice(0, 10)
      .map((rank) => periodData.players[rank.playerIdent].clmId);
    timeline.periods.push(period);
    timeline.current = period.periodId;
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
  timeline.outOfRegionIdents = [...OUT_OF_REGION];
  timeline.current = spec.currentPeriodId;
  await X.spit(paths.pagesDocs("timeline.json"), timeline);

  return timeline;
}
