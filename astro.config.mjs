import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://itfti.org",
  trailingSlash: "never",
  build: { format: "file" },
});
