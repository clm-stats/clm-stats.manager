// import { render } from "preact-render-to-string";
// import { h } from "preact";
// import App from "../clm-stats.app/js/PureApp.jsx";
// import * as U from "../clm-stats.app/js/util.js";
import build from "#lib/build";

async function main() {
  const periodId = 14;
  const page = "stats";
  const props = () => ({
    periodId,
    page,
    isLoading: true,
    pids: [],
    sort: { by: U.resolveSortBy(), dir: U.resolveSortDir() },
    filter: {
      outOfRegion: true,
      inadAttendance: periodId !== U.timeline.current,
    },
    prevState: {},
    getPlayerData: () => null,
    isInitialPage: true,
    isInitialPeriod: true,
    isInitialTab: true,
  });
  // console.log(render(h(App, props, [])));
  // return;
  await build();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
