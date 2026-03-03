import _ from "#lib/_";
import paths from "#lib/paths";
import * as A from "#lib/action";

export default async function BuildManagedState(X) {
  const manageActions = await _.slurpOr(
    paths.data.state("manageActions.json"),
    [
      ...[
        "tournament/midlane-melee-207-the-one-without-the-pr/event/melee-singles",
        "tournament/midlane-melee-208-the-one-with-the-pr-real/event/melee-singles",
        "tournament/midlane-melee-209-sign-up-for-out-of-the-blue-5/event/melee-singles",
        "tournament/bowled-over-3/event/melee-singles",
        "tournament/midlane-melee-210-last-week-s-tagline-worked/event/melee-singles",
        "tournament/rpm-79/event/melee-singles",
        "tournament/rpm-77/event/melee-singles",
        "tournament/midlane-melee-206-goose447-commits-tax-evasion/event/melee-singles",
        "tournament/rpm-76/event/melee-singles",
        "tournament/midlane-melee-205-i-m-not-so-grunk/event/melee-singles",
        "tournament/midlane-melee-204-hey-i-m-grunk/event/melee-singles",
        "tournament/midlane-melee-203-new-year-same-yolk/event/melee-singles",
        "tournament/rpm-74/event/melee-singles",
      ].map((slug) => A.AddEvent(slug)),
      A.AddAltId("4253823", "Ashley"),
      A.AddAltId("5211563", "Killablue"),
      A.AddAltId("13423", "Trichael Man"),
      A.AddAltId("577632", "Farenhype"),
    ],
  );

  const spec = A.buildSpec(manageActions);
  return { manageActions, spec };
}
