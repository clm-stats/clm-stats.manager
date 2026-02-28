const Action = (actionType, payload) => [actionType, payload];
export const Bulk = (...actions) => Action("Bulk", { actions });
export const Undo = (targetId) => Action("Undo", { targetId });
export const AddEvent = (slug) => Action("AddEvent", { slug });
export const AddSecondaryPlayerId = (basePlayerId, newPlayerId) =>
  Action("AddSecondaryPlayerId", { basePlayerId, newPlayerId });
export const OverridePlayer = (actPlayerId, expPlayerId, slug) =>
  Action("OverridePlayer", { slug, actPlayerId, expPlayerId });

export const buildSpec = (...actions) => {
  const spec = {};
  actions.reverse();
  for (const [actionType, payload] of actions) {
    if ("actionType") {
    }
  }
  actions.reverse();
};
