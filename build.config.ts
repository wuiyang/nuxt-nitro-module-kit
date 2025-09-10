import { writeFile } from "node:fs/promises";
import { defineBuildConfig } from "unbuild";

const typeDefDirs = ["runtime", "types", "utils"];

export default defineBuildConfig({
  declaration: true,
  entries: [
    // module entrypoint
    { input: "src/index.ts", outDir: "dist", format: "esm" },
    // Utils
    { input: "src/utils.ts" },
    // Types
    { input: "src/types.ts" },
  ],
  hooks: {
    async "build:prepare"() {
      await Promise.all(
        typeDefDirs.map(dir =>
          writeFile(`./${dir}.d.ts`, `export * from "./dist/${dir}/index";`),
        ),
      );
    },
  },
  externals: [
    "nuxt",
    "nitropack",
    "@nuxt/schema",
    "@nuxt/kit",
  ],
  // https://github.com/sindresorhus/globby/issues/260
  // alias: {
  //   'unicorn-magic': 'node_modules/unicorn-magic/src/unicorn-magic.js'
  // }
});
