import build from "#lib/build";
import * as A from "#lib/action";

const gamesUnknown = { w: "W", l: "L" };

async function main() {
  await build.startBuild([
    ...[
      "tournament/fudds-house-17-last-fudds/event/melee-singles",
      "tournament/fudds-house-17-last-fudds/event/melee-amateur-bracket",
      "tournament/fgc-at-dane-s-games-10/event/melee-singles",
    ].map(A.SetDoneUpdating),
    A.OverrideSetData(99917754, { winnerId: 22766305, games: gamesUnknown }),
  ]);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
