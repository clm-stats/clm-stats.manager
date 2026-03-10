import build from "#lib/build";

async function main() {
  await build.startBuild();
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
