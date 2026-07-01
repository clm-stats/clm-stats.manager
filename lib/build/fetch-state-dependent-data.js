import * as R from "@dz/h2hRanking";
import { GQLNetworkControl } from "@dz/-/node";
import consts from "#lib/consts";

async function getGGEventData(slug, shouldRefetchEvent, gqlOpts) {
  const event = await R.getGGEventData(slug, gqlOpts);
  if (event && shouldRefetchEvent && event.state !== "COMPLETED") {
    gqlOpts.log(
      "event",
      `![${event.tournament.name}|${event.name}]`,
      "incomplete",
      `![${event.state}]`,
      "refetching...",
    );
    return await R.getGGEventData(slug, {
      ...gqlOpts,
      networkControl: GQLNetworkControl.forceFetch,
    });
  }
  return event;
}

export async function fetchGGEvents(
  spec,
  shouldRefetch = false,
  logInfo = () => {},
) {
  const { eventSlugs, doneUpdating, eventsToRefetch } = spec;
  const events = {};
  for (const slug of [...eventSlugs]) {
    const isDone = doneUpdating.has(slug);
    const needsRefetch = eventsToRefetch.has(slug);
    const wantsRefetch = !isDone || needsRefetch;
    const shouldRefetchEvent = shouldRefetch && wantsRefetch;
    const gqlOpts = consts.gqlOpts({
      log: logInfo,
      ...(isDone
        ? { networkControl: GQLNetworkControl.cacheOnly }
        : {
            ...(needsRefetch
              ? { networkControl: GQLNetworkControl.forceFetch }
              : {}),
          }),
    });
    const event = spec.challongeSlugs.has(slug)
      ? await R.getChallongeEventData(slug, gqlOpts)
      : await getGGEventData(slug, shouldRefetchEvent, gqlOpts);
    events[slug] = event;
  }
  return events;
}

export default async function FetchStateDependentData(X) {
  const { spec, actions } = X.deps["build-managed-state"];
  X.logInfo("getting startgg event data [cached for completed events]");
  const events = await fetchGGEvents(spec, true, X.logInfo);
  return { events, spec, actions };
}
