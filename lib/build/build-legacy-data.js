import _ from "#lib/_";
import paths from "#lib/paths";

const titleByPeriod = {
  0: "All Time",
  2: "2022 Spring",
  3: "2022 Summer",
  4: "2022 Fall",
  5: "2023 Act I",
  6: "2023 Act II",
  7: "2023 Act III",
  8: "2024 Act I",
  9: "2024 Act II",
  10: "2024 Act III",
  11: "2025 Act I",
  12: "2025 Act II",
  13: "2025 Act III",
};

const PLACEHOLDER_IMG_IN =
  "https://storage.googleapis.com/chicago_2022-2/CLM_Logo_Avatar_Placeholder.png";
const PLACEHOLDER_IMG_OUT = "/img/CLM_Logo_Avatar_Placeholder.png";

export default async function BuildLegacyData(X) {
  const EVENTS = {};
  const ALL_IDENTS = {};
  const PLAYERS = {};
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
          PLAYERS[playerIdent] ||= {};
          PLAYERS[playerIdent][periodId] = [
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
        PLAYERS[playerIdent] ||= {};
        PLAYERS[playerIdent][periodId] = [
          dataByIdent[playerIdent][periodId][0],
          dataByIdent[playerIdent][periodId][1],
        ];
      }
    }
  }

  const UNKNOWNS = { ident: new Set([]), opps: new Set([]) };

  const PERIODS = {};
  const TIMELINE = [];
  async function addPeriodData() {
    const { periods } = await _.slurp(paths.v2Saved("playwright-crawl.json"));
    for (const periodId in periods) {
      if (periodId === "0") {
        continue;
      }
      const { players, season, _data: ranks } = periods[periodId];
      const playerIdentByName = {};
      for (const player in players) {
        playerIdentByName[players[player].name] = player;
      }
      TIMELINE.push({
        periodId: parseInt(periodId),
        title: titleByPeriod[periodId],
        timelineInd: TIMELINE.length,
        season,
      });
      const PERIOD = {
        periodId: parseInt(periodId),
        title: season,
        isAll: false,
        events: {},
        players: {},
        ranks: [],
      };
      for (const rank of ranks) {
        if (rank.event.imageUrl === PLACEHOLDER_IMG_IN) {
          rank.event.imageUrl = PLACEHOLDER_IMG_OUT;
        }
        if (rank.player.profileImage === PLACEHOLDER_IMG_IN) {
          rank.player.profileImage = PLACEHOLDER_IMG_OUT;
        }

        const playerIdent = playerIdentByName[rank.player.name];
        if (!playerIdent) {
          UNKNOWNS.ident.add(rank.player.name);
          continue;
        }
        const playerId = parseInt(rank.player.id);
        const image = rank.player.profileImage;
        const tag = rank.player.tag;
        const name = rank.player.name;
        const realName = rank.player.realName;
        const pronouns = rank.player.pronouns;
        if (!PERIOD.players[playerIdent]) {
          PERIOD.players[playerIdent] = {
            playerId,
            image,
            tag,
            name,
            realName,
            pronouns,
          };
          if (rank.player.prefix) {
            PERIOD.players[playerIdent].prefix = rank.player.prefix;
          }
          if (rank.player.twitter) {
            PERIOD.players[playerIdent].twitter = rank.player.twitter;
          }
          if (rank.player.twitch) {
            PERIOD.players[playerIdent].twitch = rank.player.twitch;
          }
        }

        rank.wins = rank.player.wins;
        rank.losses = rank.player.losses;
        rank.prWins = rank.player.prWins;
        rank.prEvents = rank.player.prEvents;
        rank.rating = rank.player.rating;
        rank.conservativeRating = rank.player.conservativeRating;
        rank.playerIdent = playerIdent;
        rank.eventId = parseInt(rank.event.id);
        rank.event.eventId = rank.eventId;
        PERIOD.events[rank.eventId] = rank.event;
        EVENTS[rank.eventId] = rank.event;

        delete rank.event;
        delete rank.player;

        ALL_IDENTS[playerIdent] = Math.max(
          ALL_IDENTS[playerIdent] || 0,
          parseInt(periodId),
        );
        PERIOD.ranks.push(rank);
      }
      PERIODS[periodId] = PERIOD;
    }
  }

  await addPlaywrightCrawlData();
  await addDirectDLData();
  await addPeriodData();

  function seededRandom(seed) {
    return function () {
      seed = Math.sin(seed) * 10000;
      return seed - Math.floor(seed);
    };
  }

  function shuff(rng, array) {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(rng() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  const IDENT_CLM_IDS = {};
  const RESERVED = { ["dz"]: 420 };
  const RESERVED_IDS = new Set(Object.values(RESERVED));

  let nextIdTry = 14;

  function getClmIdImpl(ident) {
    if (IDENT_CLM_IDS[ident]) {
      return IDENT_CLM_IDS[ident];
    }
    if (RESERVED[ident]) {
      return RESERVED[ident];
    }
    while (RESERVED_IDS.has(nextIdTry)) {
      nextIdTry++;
    }
    RESERVED_IDS.add(nextIdTry);
    return nextIdTry;
  }

  function getClmId(ident) {
    const res = getClmIdImpl(ident);
    IDENT_CLM_IDS[ident] = res;
    return res;
  }

  shuff(seededRandom(24), Object.keys(ALL_IDENTS)).forEach((ident) => {
    IDENT_CLM_IDS[ident] = getClmId(ident);
  });

  const GplayerIdentByName = {};
  for (const periodId in PERIODS) {
    const PERIOD = PERIODS[periodId];
    for (const player in PERIOD.players) {
      GplayerIdentByName[PERIOD.players[player].name] = player;
    }
  }

  for (const periodId in PERIODS) {
    const PERIOD = PERIODS[periodId];

    const playerIdentByName = {};
    for (const player in PERIOD.players) {
      playerIdentByName[PERIOD.players[player].name] = player;
    }

    for (const pid in PERIOD.players) {
      const clmId = IDENT_CLM_IDS[pid];
      if (!clmId) {
        continue;
      }
      PERIOD.players[pid].clmId = clmId;
      const playerData = PLAYERS[pid][periodId];
      playerData[1] = playerData[1].filter((h2h) => {
        if (
          !playerIdentByName[h2h.opponent] &&
          !GplayerIdentByName[h2h.opponent]
        ) {
          UNKNOWNS.opps.add(h2h.opponent);
          return false;
        }
        h2h.opponent =
          playerIdentByName[h2h.opponent] || GplayerIdentByName[h2h.opponent];
        return true;
      });
    }
    PERIOD.others = {};
    for (const ident in ALL_IDENTS) {
      if (PERIOD.players[ident]) {
        continue;
      }
      PERIOD.others[ident] = ALL_IDENTS[ident];
    }
  }

  for (const pid in PLAYERS) {
    const clmId = IDENT_CLM_IDS[pid];
    for (const periodId in PLAYERS[pid]) {
      PLAYERS[pid][periodId] = [pid, ...PLAYERS[pid][periodId], { clmId }];
    }
  }

  // console.log(UNKNOWNS);

  return {
    players: { ...PLAYERS },
    periods: { ...PERIODS },
    events: { ...EVENTS },
    timeline: [...TIMELINE],
    getClmId,
  };
}
