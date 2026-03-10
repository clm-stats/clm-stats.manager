import * as gg from "#lib/gg";
import * as log from "#lib/log";

export async function fetchGGEvents(eventSlugs) {
  const events = {};
  log.info("getting startgg event data [cached for completed events]");
  for (const slug of [...eventSlugs]) {
    const event = await gg.getEventData(slug);
    events[slug] = event;
  }
  return events;
}

export default async function FetchStateDependentData(X) {
  const { spec, actions } = X.deps["build-managed-state"];
  const events = await fetchGGEvents(spec.eventSlugs);
  return { events, spec, actions };
}
