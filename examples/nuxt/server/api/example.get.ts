import type { ExampleNuxtNitroModuleExtra } from "#example-nuxt-nitro-module";

export default defineEventHandler(() => {
  const data: ExampleNuxtNitroModuleExtra = {
    a: 1,
  };
  return {
    example: useRuntimeConfig().example,
    data,
  };
});
