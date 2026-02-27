import _ from "#lib/_";
import paths from "#lib/paths";

export default async function BuildManagedState(X) {
  const manageActions = await _.slurpOr(
    paths.data.state("manageActions.json"),
    [],
  );
  return { manageActions: [] };
}
