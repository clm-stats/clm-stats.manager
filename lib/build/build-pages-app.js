import paths from "#lib/paths";
import { execa } from "execa";
// import _ from "#lib/_";

export default async function BuildPagesApp() {
  /*
  await execa("just", ["build"], {
    cwd: paths.appCO(),
    stdout: "inherit",
    stderr: "inherit",
  });
  */
  return { build: true };
}
