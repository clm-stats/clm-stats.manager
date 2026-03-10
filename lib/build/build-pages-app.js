import * as fs from "node:fs/promises";
import path from "node:path";
import paths from "#lib/paths";
import _ from "#lib/_";
import { build } from "vite";
import { render } from "preact-render-to-string";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";
import * as htmlTerser from "html-minifier-terser";
import * as log from "#lib/log";

async function buildCSS(X) {
  const cssInPath = paths.appCO("styles.css");
  const cssOutPath = paths.pagesDocs("index.css");
  const cssIn = await _.readStr(cssInPath);
  const plugins = [
    tailwindcss({ base: paths.appCO() }),
    cssnano({ preset: "default" }),
  ];
  const { css: cssOut } = await postcss(plugins).process(cssIn, {
    from: cssInPath,
    to: cssOutPath,
  });
  X.writeStr(cssOutPath, cssOut);
}

async function isDir(p) {
  try {
    const stats = await fs.stat(p);
    return stats.isDirectory();
  } catch (_e) {
    return false;
  }
}

async function buildStatic(X) {
  const staticRoot = paths.appCO("static");
  async function cpDir(p) {
    const filenames = await fs.readdir(p);
    for (const filename of filenames) {
      const fullPath = path.join(p, filename);
      if (await isDir(fullPath)) {
        await cpDir(fullPath);
      } else {
        const relPath = path.relative(staticRoot, fullPath);
        X.useStatic(paths.pagesDocs(relPath), fullPath);
      }
    }
  }
  await cpDir(staticRoot);
}

export default async function BuildPagesApp(X) {
  const timeline = X.deps["save-built-data"];
  X.logInfo("building javascript");
  await build({
    configFile: paths.appCO("vite.client.mjs"),
    configLoader: "native",
  });
  const jsStr = await _.readStr(paths.appCO("dist", "mountClient.js"));
  await X.writeStr(paths.pagesDocs("index.js"), jsStr);
  await build({
    configFile: paths.appCO("vite.ssr.mjs"),
    configLoader: "native",
  });
  const { createDocString } = await import(paths.appCO("dist", "ssrApp.cjs"));
  async function createPageDoc(periodId, page) {
    const base = createDocString(render, timeline, periodId, page);
    return await htmlTerser.minify(base, {
      collapseBooleanAttributes: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      noNewlinesBeforeTagClose: true,
      removeAttributeQuotes: true,
      removeComments: true,
    });
  }
  X.logInfo("building css");
  await buildCSS(X);
  X.logInfo("building jekyll pages");
  await Promise.all(
    timeline.periods.map(async (period, periodInd) => {
      const { periodId } = period;
      const layoutId = (page) => `l_${periodId}_${page}`;
      const layoutPath = (page) =>
        paths.pagesDocs("_layouts", `${layoutId(page)}.html`);
      const writeLayout = (page) =>
        createPageDoc(periodId, page).then((doc) =>
          X.writeStr(layoutPath(page), doc),
        );
      const mkMd = (page) =>
        ["---", `layout: ${layoutId(page)}`, "---", ""].join("\n");
      const mdPath = (page, skipSeason) =>
        paths.pagesDocs(skipSeason ? "../docs" : period.season, `${page}.md`);
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
  await buildStatic(X);

  return { build: true };
}
