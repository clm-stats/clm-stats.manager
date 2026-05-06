import * as gg from "#lib/gg";

export async function fetchGGEvents(
  spec,
  shouldRefetch = false,
  logInfo = () => {},
) {
  const { eventSlugs, doneUpdating, eventsToRefetch } = spec;
  const events = {};
  for (const slug of [...eventSlugs]) {
    const wantsRefetch = !doneUpdating.has(slug) || eventsToRefetch.has(slug);
    const shouldRefetchEvent = shouldRefetch && wantsRefetch;
    const event = await gg.getEventData(slug, shouldRefetchEvent, logInfo);
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
