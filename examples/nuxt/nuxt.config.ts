// https://nuxt.com/docs/api/configuration/nuxt-config
import exampleModule from "../module/example";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: [exampleModule],
  devServer: {
    port: 3002,
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
  example: {
    version: "1.2.3",
  },
});
