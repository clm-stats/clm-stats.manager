import gql from "#lib/gql";

async function qAll(query, constVars, pvSpecs) {
  const pageVars = {};
  for (const pageVar in pvSpecs) {
    pageVars[pageVar] = 0;
  }
  const q = () => {
    // console.log("\nQUERY");
    // console.log(query, JSON.stringify(constVars), JSON.stringify(pageVars));
    return gql(query, { ...constVars, ...pageVars });
  };
  const data = await q();
  const pageVarNames = Object.keys(pvSpecs);
  pageVarNames.sort();
  for (const pageVar of pageVarNames) {
    const { getPageData = (d) => d, getId = (e) => e.id } = pvSpecs[pageVar];
    const total = getPageData(data).pageInfo.total;
    const ids = new Set(getPageData(data).nodes.map(getId));
    while (ids.size < total) {
      pageVars[pageVar]++;
      const next = await q();
      const preSize = ids.size;
      for (const el of getPageData(next).nodes) {
        const id = getId(el);
        if (!ids.has(id)) {
          getPageData(data).nodes.push(el);
        }
        ids.add(id);
      }
      if (preSize === ids.size && pageVars[pageVar] > 1) {
        const cvs = JSON.stringify(constVars);
        const pvs = JSON.stringify(pageVars);
        throw `nodes unchanged ${query} ${cvs} ${pageVar} ${pvs}`;
      }
    }
  }
  return data;
}

async function tryGetGGDataImpl(slug, q) {
  return await qAll(
    q,
    { slug },
    {
      pageS: { getPageData: (d) => d.event.standings },
      pageE: { getPageData: (d) => d.event.entrants },
    },
  );
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
  const getDataBig = () => tryGetGGData(slug, "tournamentData");
  const dbr = (await getDataBig()) || {};
  const { event } = dbr;
  // console.log({ event });
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
  // console.log({ phaseGroups });
  for (const _pg of phaseGroups) {
    _pg.sets = {};
    let page = 0;
    const data = await gql("setsData", { phaseGroupId: `${_pg.id}`, page });
    const total = data.phaseGroup.sets.pageInfo.total;
    const ids = new Set([]);
    while (ids.size < total) {
      page++;
      // console.log([ids.size, total]);
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
      _pg.sets[set.id] = set;
    }
  }
  return event;
}

export async function getClmEvents(startTime, endTime) {
  const after = startTime;
  const before = endTime;
  const data = await qAll(
    "clmEvents",
    { after, before },
    {
      page: {
        getPageData: (d) => d.tournaments,
      },
    },
  );
  return data.tournaments.nodes.flatMap((n) => n.events).map((e) => e.slug);
}
