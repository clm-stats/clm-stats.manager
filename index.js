import * as gg from "./lib/gg.js";

async function main() {
  const data = await gg.getEventData(
    "tournament/midlane-melee-198/event/melee-singles",
  );
  console.log(data);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
