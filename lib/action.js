const D = new Proxy(
  {},
  {
    get:
      (_, actionType) =>
      (_mkPayload = () => ({})) =>
      (handler = () => {}) => {
        const mkPayload = !Array.isArray(_mkPayload)
          ? _mkPayload
          : (...args) => {
              const res = {};
              _mkPayload.forEach((k, ind) => {
                res[k] = args[ind];
              });
              return res;
            };
        return (...args) => {
          const payload = mkPayload(...args);
          return {
            type: actionType,
            payload,
            handle: (spec) => handler(spec, payload),
          };
        };
      },
  },
);

export const Undo = D.Undo(["targetId"])();
export const Bulk = D.Bulk(["actions"])((spec, { actions }) =>
  actions.forEach((action) => action.handle(spec)),
);
export const AddEvent = D.AddEvent(["slug"])((spec, { slug }) =>
  spec.eventSlugs.add(slug),
);
export const AddAltId = D.AddAltId(["baseId", "newId"])(
  (spec, { baseId, newId }) => (spec.identMasks[baseId] = newId),
);
export const IdForEvent = D.IdForEvent(["baseId", "newId", "slug"])((
  spec,
  { baseId, newId, slug },
) => {
  spec.eventIdentMasks[slug] ||= {};
  spec.eventIdentMasks[slug][baseId] = newId;
});

export const isUndo = (action) => action.type === "Undo";
export const isBulk = (action) => action.type === "Bulk";

function assignIds(actions, idBase = "") {
  actions.forEach((action, ind) => {
    const id = `${idBase}|${ind}`;
    action.id = id;
    if (isBulk(action)) {
      assignIds(action.payload.actions || [], id);
    }
  });
}

export const buildSpec = (actions) => {
  assignIds(actions);
  const spec = {
    undone: {},
    eventSlugs: new Set([]),
    identMasks: {},
    eventIdentMasks: {},
  };
  actions.reverse();
  for (const action of actions) {
    if (isUndo(action) && !spec.undone[action.id]) {
      spec.undone[action.payload.targetId] = action.id;
    }
  }
  actions.reverse();
  for (const action of actions) {
    action.handle(spec);
  }
  return spec;
};
