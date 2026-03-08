import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const publicDir = "./static";

const target = "http://localhost:9182";
const server = {
  proxy: {
    "/api": { target, changeOrigin: true },
    "/iconByIdent": { target, changeOrigin: true },
  },
};
const plugins = [preact()];
export default defineConfig({ server, publicDir, plugins });
