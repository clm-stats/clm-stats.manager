import gql from './lib/gql.js'

async function tryGetGGData(slug, q) {
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
                    eids.add(entrant.id)
                    data.event.entrants.nodes.push(entrant);
               }
          }
     }

     while (sids.size < totalS) {
          pageS++;
          const next = await gql('tournamentData', { slug, pageS, pageE });
          for (const standing of next.event.standings.nodes) {
               if (!sids.has(standing.id)) {
                    sids.add(standing.id)
                    data.event.standings.nodes.push(standing);
               }
          }
     }

     for (const standing of data.event.standings.nodes) {
          eids.add(standing.entrant.id)
     }

     return data
}

async function getGGData(slug) {
  try {
    if (slug === 'tournament/smash-n-splash-2-1/event/melee-singles') {
      throw slug;
    }
    return await tryGetGGData(slug, 'tournamentData');
  } catch (e) {
    return await tryGetGGData(slug, 'tournamentDataSmall');
  }
}

const STATE = {
     events: {},
     entrants: {},
     tournaments: {},
     players: {},
     setIdGroups: [],
     sets: {},
}

const lst = (arr) => arr[arr.length - 1]

const processTourneyData = async (slug) => {
     const { event } = await getGGData(slug)
     STATE.setIdGroups.push([])
     STATE.events[event.slug] = event
     STATE.tournaments[event.tournament.id] = event.tournament
     event.tournamentName = event.tournament.name
     event.date = event.tournament.endAt
     event.imageUrl = (
      event.tournament.images.filter((i) => i.type === 'profile')[0] || {}
     ).url;
     event.prPeriod = 14
     for (const entrant of event.entrants.nodes) {
          STATE.entrants[entrant.id] = entrant
          for (const ptc of entrant.participants) {
               const player = ptc.player
               STATE.players[player.id] ||= player
               STATE.players[player.id].entrants ||= []
               STATE.players[player.id].entrants.push(entrant.id)
               const user = player.user || { name: player.gamerTag }
               player.name = user.name
               player.pronouns = user.genderPronoun || ''
          }
     }
     for (const standing of event.standings.nodes) {
          STATE.entrants[standing.entrant.id].placement = standing.placement
     }
     const phaseGroups = [...event.phaseGroups];
     phaseGroups.sort((g1, g2) => g1.phase.phaseOrder - g2.phase.phaseOrder);
     for (const _pg of phaseGroups) {
          let page = 0;
          const data = await gql('setsData', { phaseGroupId: `${_pg.id}`, page });
          const total = data.phaseGroup.sets.pageInfo.total;
          const ids = new Set([]);
          while (ids.size < total) {
               page++;
               const next = await gql('setsData', { phaseGroupId: `${_pg.id}`, page });
               for (const set of next.phaseGroup.sets.nodes) {
                    if (!ids.has(set.id)) {
                         ids.add(set.id)
                         data.phaseGroup.sets.nodes.push(set);
                    }
               }
          }
          const pg = data.phaseGroup
          for (const set of pg.sets.nodes) {
               set.hasWinner = !!set.winnerId
               set.isDQ = set.displayScore === 'DQ'
               set.isBye = false
               for (const slot of set.slots) {
                    if (!slot.entrant) { set.isBye = true; break; }
                    STATE.entrants[slot.entrant.id].setIds ||= []
                    STATE.entrants[slot.entrant.id].setIds.push(set.id)
               }
               set.doesCount = !set.isBye && !set.isDQ && set.hasWinner
               STATE.sets[set.id] = set
               lst(STATE.setIdGroups).push(set.id)
          }
     }
}

async function main() {
  await processTourneyData('tournament/midlane-melee-198/event/melee-singles');
}

main().then(() => process.exit()).catch(error => {
  console.error(error);
  process.exit(1);
})
