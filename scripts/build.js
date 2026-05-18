import commandLineArgs from "command-line-args";
import build from "#lib/build";
import * as A from "#lib/action";

const optionDefinitions = [
  { name: "add-event", alias: "e", lazyMultiple: true, type: String },
  { name: "bust-cache", alias: "b", lazyMultiple: true, type: String },
  { name: "stop-fetching", alias: "s", lazyMultiple: true, type: String },
  { name: "set-current-period", alias: "p", type: Number },
];

const options = commandLineArgs(optionDefinitions);

async function main() {
  const newActions = Object.entries(options).flatMap(([opt, vals]) => {
    if (opt === "add-event") {
      return vals.map((slug) => A.AddEvent(slug));
    } else if (opt === "bust-cache") {
      return vals.map((slug) => A.BustGQLCacheForEvent(slug));
    } else if (opt === "stop-fetching") {
      return vals.map((slug) => A.SetDoneUpdating(slug));
    } else if (opt === "set-current-period") {
      return [A.SetCurrentPeriodId(vals)];
    }
    return [];
  });
  await build.startBuild(newActions);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
