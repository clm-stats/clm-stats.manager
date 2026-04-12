import build from "#lib/build";
/*
import * as A from "#lib/action";

const gamesUnknown = { w: "W", l: "L" };
*/

async function main() {
  await build.startBuild();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
