import { getEventData } from "#lib/gg";
import build from "#lib/build";

async function main() {
  const data = await getEventData(
    "tournament/midlane-melee-198/event/melee-singles",
  );
  console.log(data);
  await build();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
