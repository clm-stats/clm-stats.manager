import paths from "#lib/paths";
import { execa } from "execa";
import _ from "#lib/_";
import { build } from "vite";
import { render } from "preact-render-to-string";
import postcss from "postcss";

function mkHtml(timeline, appMarkup) {
  return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title> {{ page.title }} </title>
        <link href="/index.css" rel="stylesheet">
        <script>
            document.head[":tl"] = (${JSON.stringify(timeline)})
            var dbFutureCache = {};
            function fetchDbImpl(urlRest) {
                dbFutureCache[urlRest] = new Promise((done, fail) => {
                    fetch("/db/" + urlRest + ".json")
                        .then((res) => { if (res.status === 404) { throw 404; }; return res; })
                        .then((res) => res.json())
                        .then((data) => done(data))
                        .catch((error) => {
                            delete dbFutureCache[urlRest];
                            fail(error);
                        });
                });
                return dbFutureCache[urlRest];
            }
            function fetchDb(urlRest) {
                if (!dbFutureCache[urlRest]) {
                    return fetchDbImpl(urlRest);
                } else {
                    return dbFutureCache[urlRest];
                }
            };
            window.fetchPlayer = function(periodId, playerId) {
                return fetchDb("players/" + playerId + "/" + periodId);
            };
            window.fetchPeriod = function(periodId) {
                return fetchDb("periods/" + periodId);
            };
            window.fetchPeriod({{ page.periodId }});
        </script>
        <script defer src="/index.js"></script>
        <script>
            /*to prevent Firefox FOUC, this must be here*/
            let FF_FOUC_FIX;
        </script>
        <style>
@keyframes jump-in {
  0% {
    transform:scale(0.75);
    opacity:0.6;
  }
  80% {
    transform:scale(1.02);
    opacity:0.92;
  }
  to {
    transform:scale(1);
    opacity:1.0;
  }
}

@keyframes jump-out {
  0% {
    transform:scale(1);
    opacity:1.0;
  }
  20% {
    transform:scale(1.1);
    opacity:1.0;
  }
  to {
    transform:scale(0.01);
    opacity:0.0;
  }
}
        </style>
    </head>
    <body class="min-h-screen bg-info dark:bg-info-content">
        ${appMarkup}
    </body>
</html>
`.trim();
}

function mkLayout(createAppEl, timeline, periodId, page) {
  return mkHtml(timeline, render(createAppEl(periodId, page, timeline)));
}

export default async function BuildPagesApp(X) {
  const timeline = X.deps["save-built-data"];
  await build({ configFile: paths.npmRoot("clm-stats.app", "vite.client.js") });
  const jsStr = await _.readStr(paths.npmRoot("dist", "mountClient.js"));
  await X.writeStr(paths.appCO("docs", "index.js"), jsStr);
  await build({ configFile: paths.npmRoot("clm-stats.app", "vite.ssr.js") });
  const { createAppEl, getPageTitle } = await import(
    paths.npmRoot("dist", "ssrApp.cjs")
  );
  await Promise.all(
    timeline.periods.map(async (period, periodInd) => {
      const { periodId } = period;
      const layoutId = (page) => `l_${periodId}_${page}`;
      const layoutPath = (page) =>
        paths.appCO("docs", "_layouts", `${layoutId(page)}.html`);
      const writeLayout = (page) =>
        X.writeStr(
          layoutPath(page),
          mkLayout(createAppEl, timeline, periodId, page),
        );
      const mkMd = (page) =>
        [
          "---",
          `layout: ${layoutId(page)}`,
          `title: ${getPageTitle(periodId, page, timeline)}`,
          `periodId: ${periodId}`,
          "---",
          "",
        ].join("\n");
      const mdPath = (page, skipSeason) =>
        paths.appCO(
          "docs",
          skipSeason ? "../docs" : period.season,
          `${page}.md`,
        );
      const writeMd = (page, pagePath, skipSeason) =>
        X.writeStr(mdPath(pagePath || page, skipSeason), mkMd(page));
      await writeLayout("stats");
      await writeLayout("players");
      await writeMd("stats");
      await writeMd("players");
      await writeMd("stats", "index");
      await writeMd("players", "-");
      await writeMd("stats", "index", periodInd === 0);
      await writeMd("players", "-", periodInd === 0);
    }),
  );

  return { build: true };
}
