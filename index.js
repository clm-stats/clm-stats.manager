import express from "express";
import paths from "#lib/paths";

const PORT = process.env["PORT"] || 9182;

const app = express();
app.use(express.static(paths.npmRoot("static")));
app.use(express.static(paths.npmRoot("dist")));
app.get("/api/status", async (_req, res) => {
  res.json({ actions: [1, 2, 3], events: {}, playerGroups: {} });
});
app.listen(PORT, () => {
  console.log(" [| clm-stats manager |]  running on port", PORT);
});
