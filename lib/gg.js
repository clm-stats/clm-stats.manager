import gql from "./gql.js";

async function tryGetGGDataImpl(slug, q) {
  let pageE = 0;
  let pageS = 0;
  const data = await gql(q, { slug, pageS, pageE });
  const totalE = data.event.entrants.pageInfo.total;
  const totalS = data.event.standings.pageInfo.total;

  const eids = new Set([]);
  const sids = new Set([]);

  while (eids.size < totalE) {
    pageE++;
    const next = await gql(q, { slug, pageS, pageE });
    for (const entrant of next.event.entrants.nodes) {
      if (!eids.has(entrant.id)) {
        eids.add(entrant.id);
        data.event.entrants.nodes.push(entrant);
      }
    }
  }

  while (sids.size < totalS) {
    pageS++;
    const next = await gql("tournamentData", { slug, pageS, pageE });
    for (const standing of next.event.standings.nodes) {
      if (!sids.has(standing.id)) {
        sids.add(standing.id);
        data.event.standings.nodes.push(standing);
      }
    }
  }

  for (const standing of data.event.standings.nodes) {
    eids.add(standing.entrant.id);
  }

  return data;
}

async function tryGetGGData(slug, q) {
  try {
    return await tryGetGGDataImpl(slug, q);
  } catch (_e) {
    return undefined;
  }
}

function getBaseEventData(slug) {
  const getDataBig = () => tryGetGGData(slug, "tournamentData");
  const getDataSmall = () => tryGetGGData(slug, "tournamentDataSmall");
  return gql
    .withoutNetwork(() => getDataBig().then((data) => data || getDataSmall()))
    .then((data) => data || getDataBig())
    .then((data) => data || getDataSmall());
}

export async function getEventData(slug) {
  const { event } = (await getBaseEventData(slug)) || {};
  if (!event) {
    return undefined;
  }
  event.tournamentName = event.tournament.name;
  event.date = event.tournament.endAt;
  event.imageUrl = (
    event.tournament.images.filter((i) => i.type === "profile")[0] || {}
  ).url;
  event.prPeriod = 14;
  for (const entrant of event.entrants.nodes) {
    for (const ptc of entrant.participants) {
      const player = ptc.player;
      const user = player.user || { name: player.gamerTag };
      player.name = user.name;
      player.pronouns = user.genderPronoun || "";
    }
  }
  const phaseGroups = [...event.phaseGroups];
  phaseGroups.sort((g1, g2) => g1.phase.phaseOrder - g2.phase.phaseOrder);
  for (const _pg of phaseGroups) {
    let page = 0;
    const data = await gql("setsData", { phaseGroupId: `${_pg.id}`, page });
    const total = data.phaseGroup.sets.pageInfo.total;
    const ids = new Set([]);
    while (ids.size < total) {
      page++;
      const next = await gql("setsData", { phaseGroupId: `${_pg.id}`, page });
      for (const set of next.phaseGroup.sets.nodes) {
        if (!ids.has(set.id)) {
          ids.add(set.id);
          data.phaseGroup.sets.nodes.push(set);
        }
      }
    }
    const pg = data.phaseGroup;
    for (const set of pg.sets.nodes) {
      set.hasWinner = !!set.winnerId;
      set.isDQ = set.displayScore === "DQ";
      set.isBye = false;
      for (const slot of set.slots) {
        if (!slot.entrant) {
          set.isBye = true;
          break;
        }
      }
      set.doesCount = !set.isBye && !set.isDQ && set.hasWinner;
    }
  }
  return event;
}
