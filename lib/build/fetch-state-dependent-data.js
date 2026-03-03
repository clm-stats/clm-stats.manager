import * as gg from "#lib/gg";

export default async function FetchStateDependentData(X) {
  const { spec } = X.deps["build-managed-state"];
  const events = {};
  for (const slug of [...spec.eventSlugs]) {
    const event = await gg.getEventData(slug);

    events[slug] = event;
  }
  return { events, spec };
}
