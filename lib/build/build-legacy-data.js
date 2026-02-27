import _ from "#lib/_";
import paths from "#lib/paths";

export default async function BuildLegacyData(X) {
  const playerDataByPeriodByIdent = {};
  async function addPlaywrightCrawlData() {
    const { periods } = await _.slurp(paths.v2Saved("playwright-crawl.json"));
    for (const periodId in periods) {
      if (periodId === "0") {
        continue;
      }
      const { players, _data: ranks } = periods[periodId];
      const playerIdentByName = {};
      for (const player in players) {
        playerIdentByName[players[player].name] = player;
      }
      for (const rank of ranks) {
        const playerIdent = playerIdentByName[rank.player.name];
        const playerData = (players[playerIdent] || {})._data;
        if (playerData) {
          playerDataByPeriodByIdent[playerIdent] ||= {};
          playerDataByPeriodByIdent[playerIdent][periodId] = [
            playerData.tournaments,
            playerData.h2hs,
          ];
        }
      }
    }
  }

  async function addDirectDLData() {
    const dataByIdent = await _.slurp(paths.v2Saved("direct-json-dl.json"));
    for (const playerIdent in dataByIdent) {
      for (const periodId in dataByIdent[playerIdent]) {
        playerDataByPeriodByIdent[playerIdent] ||= {};
        playerDataByPeriodByIdent[playerIdent][periodId] = [
          dataByIdent[playerIdent][periodId][0],
          dataByIdent[playerIdent][periodId][1],
        ];
      }
    }
  }

  await addPlaywrightCrawlData();
  await addDirectDLData();

  let count = 0;
  for (const ident in playerDataByPeriodByIdent) {
    for (const periodId in playerDataByPeriodByIdent[ident]) {
      count++;
    }
  }
  console.log({ count });
}
