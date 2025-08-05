import exampleModule from "../module/example";

// https://nitro.unjs.io/config
export default defineNitroConfig({
  modules: [exampleModule],
  srcDir: "server",
  compatibilityDate: "2025-06-24",
  typescript: {
    strict: true,
  },
});
