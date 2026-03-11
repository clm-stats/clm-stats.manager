import * as gg from "#lib/gg";
import * as log from "#lib/log";

export async function fetchGGEvents(eventSlugs, ...restArgs) {
  const events = {};
  for (const slug of [...eventSlugs]) {
    const event = await gg.getEventData(slug, ...restArgs);
    events[slug] = event;
  }
  return events;
}

export default async function FetchStateDependentData(X) {
  const { spec, actions } = X.deps["build-managed-state"];
  X.logInfo("getting startgg event data [cached for completed events]");
  const events = await fetchGGEvents(spec.eventSlugs, true, X.logInfo);
  return { events, spec, actions };
}
