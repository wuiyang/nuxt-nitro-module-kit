import { defineNuxtNitroModule } from "../..";

export interface ExampleNuxtNitroModuleOptions {
  version?: string;
  useDebug?: boolean;
}

export default defineNuxtNitroModule<ExampleNuxtNitroModuleOptions>({
  meta: {
    name: "example-nuxt-nitro-module",
    compatibility: {
      nuxt: ">=3.0.0",
    },
    configKey: "example",
    version: "1.0.0",
  },
  hooks: {
    "dev:start"() {
      console.log("dev server started, tracked by example nuxt/nitro module");
    },
    "compiled"() {
      console.log("nitro completed compile, tracked by example nuxt/nitro module");
    },
  },
  defaults: {
    version: "1.0.0",
  },
  setup(resolvedOptions, context) {
    console.log("Provided options", resolvedOptions);

    if (resolvedOptions.useDebug) {
      console.log("using debug mode");
    }

    if (context.nuxt) {
      console.log("Nuxt exists!");
    }
  },
});
