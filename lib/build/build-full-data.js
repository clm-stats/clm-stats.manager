import { WholeHistoryRating } from "whr";
import _ from "#lib/_";
import paths from "#lib/paths";

const PLACEHOLDER_IMG_OUT = "/img/CLM_Logo_Avatar_Placeholder.png";

const sggCharIdSlippiIdMap = {
  1: 5,
  2: 0,
  3: 1,
  4: 22,
  5: 20,
  6: 2,
  7: 25,
  8: 14,
  9: 15,
  10: 4,
  11: 6,
  12: 7,
  13: 8,
  14: 9,
  15: 10,
  16: 3,
  18: 12,
  20: 13,
  21: 23,
  22: 16,
  23: 19,
  24: 17,
  25: 21,
  26: 18,
};

const _1 = (a, fb) => (!a || !a.length ? fb : a[a.length - 1]);

const weirdOrdinals = new Set([11, 12, 13]);
const rawOrdinal = (n) => {
  if (weirdOrdinals.has(n)) {
    return "th";
  }
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
};
const ordinal = (n) => `${n}${rawOrdinal(n)}`;

function unique(a) {
  const seen = new Set([]);
  return a.filter((el) => {
    const hadSeen = seen.has(el);
    seen.add(el);
    return !hadSeen;
  });
}

const CHAR_MAP = {
  Peach: "PEACH",
  Luigi: "LUIGI",
  Marth: "MARTH",
  "Ice Climbers": "ICE_CLIMBERS",
  Sheik: "SHEIK",
  Samus: "SAMUS",
  Fox: "FOX",
  "Donkey Kong": "DONKEY_KONG",
  Pikachu: "PIKACHU",
  "Captain Falcon": "CAPTAIN_FALCON",
  Jigglypuff: "JIGGLYPUFF",
  Falco: "FALCO",
  "Mr. Game & Watch": "GAME_AND_WATCH",
  "Dr. Mario": "DR_MARIO",
  Yoshi: "YOSHI",
  Ganondorf: "GANONDORF",
  Bowser: "BOWSER",
  Roy: "ROY",
  Zelda: "ZELDA",
  Mario: "MARIO",
  Mewtwo: "MEWTWO",
  Link: "LINK",
  Kirby: "KIRBY",
  "Young Link": "YOUNG_LINK",
};

export async function buildFullData(legacyData, events, spec, actions) {
  const D = legacyData;
  const periodId = 14;
  const title = "2026 Act I";
  const timelineInd = 12;
  const season = "chicago_2026-1";
  D.timeline.push({ periodId, title, timelineInd, season });
  const nameData = await _.slurp(paths.v2Utils("nameDataByPlayerId.json"));
  const isAll = false;
  const PERIOD = { isAll, periodId, title, ranks: [], events: {}, players: {} };
  const SETS = {};
  const slugs = Object.keys(events);
  slugs.sort((s1, s2) => events[s1].date - events[s2].date);
  const setIdGroups = [];
  const clmIdByEntrantId = {};
  const identByClmId = {};

  const eventIdBySetId = {};
  const rankData = {};
  function getRankData(clmId) {
    const raw = rankData[clmId] || {};
    rankData[clmId] = raw;
    raw.prTournamentIds ||= new Set([]);
    raw.chars ||= {};
    raw.colorChars ||= [{}, {}, {}, {}, {}, {}];
    raw.prWins ||= 0;
    raw.wins ||= 0;
    raw.losses ||= 0;
    raw.h2hs ||= {};
    return raw;
  }
  function getEventRankData(clmId, eventId) {
    const raw = getRankData(clmId);
    raw.eventsData ||= {};
    raw.eventsData[eventId] ||= {};
    raw.eventsData[eventId].wins ||= 0;
    raw.eventsData[eventId].losses ||= 0;
    raw.eventsData[eventId].setIds ||= [];
    raw.eventsData[eventId].beaters ||= [];
    return raw.eventsData[eventId];
  }
  function getSortedEventIds(clmId) {
    const eventIds = Object.keys(getRankData(clmId).eventsData || {});
    function sortVal(id) {
      return PERIOD.events[id].date;
    }
    eventIds.sort((i1, i2) => sortVal(i1) - sortVal(i2));
    return eventIds;
  }
  function getH2hRankData(clmId, oppId) {
    const raw = getRankData(clmId);
    raw.h2hs[oppId] ||= [];
    return raw.h2hs[oppId];
  }
  function getH2hSortedOppIds(clmId) {
    const oppIds = Object.keys(getRankData(clmId).h2hs);
    function sortVal(id) {
      const { rating = 1000 } = PERIOD.players[identByClmId[id]].RANK || {};
      return 0 - rating;
    }
    oppIds.sort((i1, i2) => sortVal(i1) - sortVal(i2));
    return oppIds;
  }
  function addCharTo(item, clmId) {
    let cmax = null;
    let cmaxCnt = 0;
    for (const char in getRankData(clmId).chars) {
      const cnt = getRankData(clmId).chars[char];
      if (cnt > cmaxCnt) {
        cmax = char;
        cmaxCnt = cnt;
      }
    }
    if (cmax) {
      item.charId = parseInt(cmax);
      let clmaxCnt = 0;
      let clmax = 0;
      getRankData(clmId).colorChars.forEach((chars, colorId) => {
        const usage = chars[item.charId] || 0;
        if (usage > clmaxCnt) {
          clmaxCnt = usage;
          clmax = colorId;
        }
      });
      item.colorId = clmax;
    }
  }
  for (const slug of slugs) {
    const event = events[slug];
    let isNotSingles = false;
    for (const entrant of event.entrants.nodes) {
      if ((entrant.participants || []).length > 1) {
        isNotSingles = true;
        break;
      }
    }
    if (isNotSingles) {
      continue;
    }
    setIdGroups.push([]);
    function nameDataFromParticipant(participant) {
      const playerId = participant.player.id;
      const eventIdentMasks = spec.eventIdentMasks[slug] || {};
      const name = participant.gamerTag;
      return (() => {
        if (eventIdentMasks[playerId]) {
          return { name, ident: eventIdentMasks[playerId], isMask: true };
        }
        if (spec.identMasks[playerId]) {
          return { name, ident: spec.identMasks[playerId], isMask: true };
        }
        return nameData[playerId] || { name, ident: name };
      })();
    }

    const EVENT = { id: `${event.id}`, imageUrl: event.imageUrl };
    EVENT.eventId = event.id;
    EVENT.eventName = event.name;
    EVENT.date = event.date;
    EVENT.tournamentName = event.tournamentName;
    EVENT.numEntrants = event.entrants.nodes.length;
    EVENT.prPeriod = `${periodId}`;
    EVENT.slug = event.slug;
    const prIneligible = spec.ineligibleSlugs.has(event.slug);
    if (prIneligible) {
      EVENT.prIneligible = true;
    }
    PERIOD.events[event.id] = EVENT;
    for (const entrant of event.entrants.nodes) {
      for (const participant of entrant.participants) {
        const nameData = nameDataFromParticipant(participant);
        const { ident, isMask } = nameData;
        const PLAYER = PERIOD.players[ident] || {};
        const player = participant.player || {};
        const user = player.user || {};
        const images = user.images || [];
        const profImage = images
          .filter((i) => i.type === "profile")
          .map((i) => i.url)[0];
        PLAYER.clmId = D.getClmId(ident);
        PLAYER.id = D.getClmId(ident);
        getRankData(PLAYER.clmId).eventId ||= event.id;
        if (!prIneligible) {
          getRankData(PLAYER.clmId).eventId = event.id;
          getRankData(PLAYER.clmId).prTournamentIds.add(event.tournament.id);
        }
        PLAYER.eventId = event.id;
        clmIdByEntrantId[entrant.id] = PLAYER.clmId;
        getEventRankData(PLAYER.clmId, event.id).participant = participant;
        PLAYER.image ||= profImage;
        PLAYER.name = nameData.name;
        PLAYER.tag ||= player.gamerTag || participant.gamerTag;
        PLAYER.prefix ||= player.prefix || participant.prefix;
        PLAYER.realName ||= user.name || player.name;
        PLAYER.pronouns ||= user.genderPronoun || player.pronouns;
        PLAYER.playerId = isMask ? PLAYER.playerId || player.id : player.id;
        identByClmId[PLAYER.clmId] = isMask
          ? identByClmId[PLAYER.clmId] || ident
          : ident;
        const authorizations = user.authorizations || [];
        for (const authorization of authorizations) {
          const propByType = { TWITCH: "twitch", TWITTER: "twitter" };
          const prop = propByType[authorization.type];
          if (!prop) {
            continue;
          }
          PLAYER[prop] = authorization.externalUsername;
        }
        PERIOD.players[ident] = PLAYER;
      }
    }
    const eventSets = {};
    for (const phaseGroup of event.phaseGroups) {
      Object.assign(eventSets, phaseGroup.sets);
      Object.assign(SETS, phaseGroup.sets);
    }
    const setIds = Object.keys(eventSets);
    setIds.sort((i1, i2) => parseInt(i1) - parseInt(i2));
    for (const setId of setIds) {
      eventIdBySetId[setId] = event.id;
      _1(setIdGroups).push(setId);
    }
    for (const standing of event.standings.nodes) {
      const clmId = clmIdByEntrantId[standing.entrant.id];
      getRankData(clmId).eventIds ||= [];
      getRankData(clmId).eventIds.push(event.id);
      getRankData(clmId).placings ||= {};
      getEventRankData(clmId, event.id).placing = standing.placement;
      getRankData(clmId).placing = standing.placement;
      getRankData(clmId).placingString = ordinal(standing.placement);
    }
  }
  const whr = new WholeHistoryRating({ w2: 20 });
  const whrKey = (clmId) => `clmId::[ ${clmId} ]`;
  let groupCount = 0;
  for (const setIdGroup of setIdGroups) {
    let anyCount = false;
    for (const setId of setIdGroup) {
      const set = SETS[setId];
      const eventId = eventIdBySetId[setId];
      const { prIneligible } = PERIOD.events[eventId];
      const [{ entrant: e1 }, { entrant: e2 }] = set.slots;
      const [w, l] = set.winnerId === e1.id ? [e1, e2] : [e2, e1];
      const wclm = clmIdByEntrantId[w.id];
      const lclm = clmIdByEntrantId[l.id];
      getEventRankData(wclm, eventId).wins++;
      getEventRankData(lclm, eventId).losses++;
      getEventRankData(wclm, eventId).setIds.push(setId);
      getEventRankData(lclm, eventId).setIds.push(setId);
      getEventRankData(lclm, eventId).beaters.push(wclm);
      getEventRankData(wclm, eventId).didDQ = false;
      getEventRankData(lclm, eventId).didDQ = set.isDQ;
      getH2hRankData(wclm, lclm).push(setId);
      getH2hRankData(lclm, wclm).push(setId);
      if (!set.doesCount || prIneligible) {
        continue;
      }
      for (const game of set.games || []) {
        for (const selection of game.selections || []) {
          const charId = sggCharIdSlippiIdMap[selection.character.id];
          const clmId = selection.entrant.id === w.id ? wclm : lclm;
          const score =
            selection.entrant.id === e1.id
              ? game.entrant1Score
              : game.entrant2Score;
          if (Number.isInteger(score) && score >= 100) {
            const colorId = Math.floor(score / 100) - 1;
            getRankData(clmId).colorChars[colorId][charId] ||= 0;
            getRankData(clmId).colorChars[colorId][charId]++;
          }
          getRankData(clmId).chars[charId] ||= 0;
          getRankData(clmId).chars[charId]++;
        }
      }
      anyCount = true;
      getRankData(wclm).wins++;
      getRankData(lclm).losses++;
      const wkey = whrKey(wclm);
      const lkey = whrKey(lclm);
      whr.createGame(wkey, lkey, "B", groupCount, 0);
    }
    if (!anyCount) {
      continue;
    }
    groupCount++;
  }
  whr.iterate(100);

  function getSetInfo(setId, forId) {
    const set = SETS[setId];
    const eventId = eventIdBySetId[setId];
    const event = PERIOD.events[eventId];
    const setInfo = { id: `${setId}` };
    const [{ entrant: e1 }, { entrant: e2 }] = set.slots;
    const is1w = set.winnerId === e1.id;
    const [w, l] = is1w ? [e1, e2] : [e2, e1];
    const wclm = clmIdByEntrantId[w.id];
    const lclm = clmIdByEntrantId[l.id];
    const [clm1, clm2] = is1w ? [wclm, lclm] : [lclm, wclm];
    const wonH2hSet = wclm === forId;
    const opClm = wonH2hSet ? lclm : wclm;
    const meEntrantId = wonH2hSet ? w.id : l.id;
    const meName = PERIOD.players[identByClmId[forId]].name;
    const opName = PERIOD.players[identByClmId[opClm]].name;
    const [wonGames, lostGames] = (() => {
      const games = set.games || [];
      if (games.length) {
        for (const game of games) {
        }
        const doneGamesL = games.filter((g) => !!g.winnerId);
        const wonGamesL = games.filter((g) => g.winnerId === meEntrantId);
        const wonGames = wonGamesL.length;
        const lostGames = doneGamesL.length - wonGames;
        return [`${wonGames}`, `${lostGames}`];
      }

      function getDisplayName(id) {
        const { gamerTag, prefix } = getEventRankData(id, eventId).participant;
        return ((prefix && `${prefix} | `) || "") + gamerTag;
      }
      const [s1, s2] = (() => {
        if (set.displayScore === "DQ") {
          return wclm === clm1 ? ["-", "DQ"] : ["DQ", "-"];
        }
        const s2m = [...set.displayScore.matchAll(/ (\d+)$/g)];
        if (s2m.length === 1) {
          const s2 = s2m[0][1];
          const s1m = [...set.displayScore.matchAll(/ (\d+) -/g)];
          if (s1m.length === 1) {
            const res = [s1m[0][1], s2];
            return res;
          }
        }
        return set.displayScore
          .split(getDisplayName(clm1))[1]
          .split("- " + getDisplayName(clm2))
          .map((s) => s.trim());
      })();
      const res = wonH2hSet === is1w ? [s1, s2] : [s2, s1];
      return res;
    })();
    setInfo.won = wonH2hSet;
    setInfo.dq = set.isDQ;
    setInfo.round = set.fullRoundText;
    setInfo.opponentName = opName;
    setInfo.winnerName = wonH2hSet ? meName : opName;
    setInfo.loserName = wonH2hSet ? opName : meName;
    setInfo.wonGames = wonGames;
    setInfo.lostGames = lostGames;
    setInfo.opClmId = opClm;
    if (event.prIneligible) {
      setInfo.prIneligible = true;
    }
    return setInfo;
  }

  for (const ident in PERIOD.players) {
    const PLAYER = PERIOD.players[ident];
    const clmId = D.getClmId(ident);
    identByClmId[clmId] = ident;
    const ratings = whr.ratingsForPlayer(whrKey(clmId));
    PLAYER.hasRating = false;
    PLAYER.image ||= PLACEHOLDER_IMG_OUT;
    const RANK = { rating: 1000 };
    PLAYER.RANK = RANK;
    if (!D.players[ident]) {
      D.players[ident] = {};
      for (const addToPeriodId in D.periods) {
        D.periods[addToPeriodId].others[ident] = periodId;
      }
    }
    if (!ratings.length) {
      continue;
    }
    PLAYER.hasRating = true;
    const trueRate = _1(ratings)[1] + 1000;
    RANK.rating = trueRate;
    RANK.playerIdent = ident;
    RANK.eventId = getRankData(clmId).eventId;
    RANK.placing = getRankData(clmId).placing;
    RANK.placingString = getRankData(clmId).placingString;
    RANK.wins = getRankData(clmId).wins;
    RANK.losses = getRankData(clmId).losses;
    RANK.prWins = getRankData(clmId).prWins;
    RANK.prEvents = getRankData(clmId).prTournamentIds.size;
    RANK.conservativeRating = RANK.prEvents < 3 ? -Infinity : trueRate;
    const totalSets = RANK.wins + RANK.losses;
    RANK.winrate = (!totalSets ? 0 : RANK.wins / totalSets) * 100;
    PERIOD.ranks.push(RANK);
  }
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  for (const ident in PERIOD.players) {
    const PLAYER = PERIOD.players[ident];
    const clmId = D.getClmId(ident);
    const H2HS = [];
    for (const oppId of getH2hSortedOppIds(clmId)) {
      const opponent = identByClmId[oppId];
      const h2h = { opponent, sets: [] };
      for (const setId of getH2hRankData(clmId, oppId)) {
        const eventId = eventIdBySetId[setId];
        const event = PERIOD.events[eventId];
        const h2hSet = {};
        h2hSet.slug = event.slug;
        h2hSet.tournamentName = event.tournamentName;
        h2hSet.date = new Intl.DateTimeFormat("en-US", options).format(
          event.date * 1000,
        );
        h2hSet.setInfo = getSetInfo(setId, clmId);
        h2h.sets.push(h2hSet);
      }
      H2HS.push(h2h);
    }
    PLAYER.H2HS = H2HS;
  }
  PERIOD.ranks.sort((r1, r2) => r2.conservativeRating - r1.conservativeRating);
  PERIOD.ranks.forEach((rank, ind) => {
    rank.rank = ind + 1;
  });
  for (const ident in PERIOD.players) {
    const PLAYER = PERIOD.players[ident];
    for (const h2h of PLAYER.H2HS) {
      h2h.rank = PERIOD.players[h2h.opponent].RANK.rank;
    }
    const clmId = D.getClmId(ident);
    const TOURNEYS = [];
    PLAYER.TOURNEYS = TOURNEYS;
    for (const eventId of getSortedEventIds(clmId)) {
      const event = PERIOD.events[eventId];
      const T = { event: { ...event, id: `${eventId}` } };
      T.placingString = ordinal(getEventRankData(clmId, eventId).placing);
      T.DQ = getEventRankData(clmId, eventId).didDQ;
      T.losses = getEventRankData(clmId, eventId).beaters.map(
        (clmId) => PERIOD.players[identByClmId[clmId]].name,
      );
      T.setSummaries = [];
      T.numWins = getEventRankData(clmId, eventId).wins;
      T.numLosses = getEventRankData(clmId, eventId).losses;
      T.setSummaries = getEventRankData(clmId, eventId).setIds.map((setId) => {
        return getSetInfo(setId, clmId);
      });
      TOURNEYS.push(T);
    }
  }
  for (const ident in PERIOD.players) {
    const PLAYER = PERIOD.players[ident];
    const clmId = D.getClmId(ident);
    const h2hs = [...PLAYER.H2HS];
    const tourneys = [...PLAYER.TOURNEYS];
    delete PLAYER.RANK;
    delete PLAYER.H2HS;
    delete PLAYER.TOURNEYS;
    D.players[ident][periodId] = [ident, tourneys, h2hs, { ...PLAYER, clmId }];
  }

  PERIOD.others = {};
  for (const pid in D.players) {
    if (!PERIOD.players[pid]) {
      PERIOD.others[pid] = D.periods[periodId - 1].others[pid] || periodId - 1;
    }
  }

  D.periods[periodId] = PERIOD;

  for (const pid in D.players) {
    const periodIds = Object.keys(D.players[pid]).map((k) => parseInt(k));
    for (const periodId of periodIds) {
      D.players[pid][periodId] = [
        D.players[pid][periodId][0],
        D.players[pid][periodId][1],
        D.players[pid][periodId][2],
        [...periodIds, ...periodIds.map((id) => `${id}`)],
        D.players[pid][periodId][3],
      ];
    }
  }

  for (const pid in D.players) {
    for (const periodId in D.players[pid]) {
      for (const tourney of D.players[pid][periodId][1]) {
        tourney.setSummaries.sort(
          (s1, s2) => parseInt(s1.id) - parseInt(s2.id),
        );
        const isGrandsSet1 = (s) => s.round === "Grand Final";
        const isGrandsReset = (s) => s.round === "Grand Final Reset";
        const isntGrands = (s) => !isGrandsSet1(s) && !isGrandsReset(s);
        tourney.setSummaries = [
          ...tourney.setSummaries.filter(isntGrands),
          ...tourney.setSummaries.filter(isGrandsSet1),
          ...tourney.setSummaries.filter(isGrandsReset),
        ];
      }
      D.players[pid][periodId][1].sort(
        (t1, t2) => t1.event.date - t2.event.date,
      );
    }
  }

  for (const periodId in D.periods) {
    for (const pid in D.periods[periodId].others) {
      const latestPeriodId = D.periods[periodId].others[pid];
      const clmId = D.getClmId(pid);
      D.periods[periodId].others[pid] = [latestPeriodId, clmId];
    }
    for (const pid in D.periods[periodId].players) {
      const PLAYER = D.periods[periodId].players[pid];
      const clmId = D.getClmId(pid);
      addCharTo(PLAYER, clmId);
      const currIdent = identByClmId[clmId];
      const currPlayer = PERIOD.players[currIdent];
      if (!currPlayer) {
        continue;
      }
      PLAYER.image = currPlayer.image;
      PLAYER.name = currPlayer.name;
      PLAYER.tag = currPlayer.tag;
      PLAYER.prefix = currPlayer.prefix;
      PLAYER.realName = currPlayer.realName;
      PLAYER.pronouns = currPlayer.pronouns;
    }
  }

  D.actions = actions;
  return D;
}
export default async function BuildFullData(X) {
  const D = X.deps["build-legacy-data"];
  const { events, spec, actions } = X.deps["fetch-state-dependent-data"];
  return await buildFullData(D, events, spec, actions);
}
