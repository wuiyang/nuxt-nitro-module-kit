# Nuxt/Nitro Module Kit

[![npm version](https://img.shields.io/npm/v/nuxt-nitro-module-kit)](https://npmjs.com/package/nuxt-nitro-module-kit)

Easily develop nitro modules that integrates to both Nitro and Nuxt natively with Nuxt Kit experience.

## Usage

### Install Module

Install `nuxt-nitro-module-kit` packages as a dependency:
```sh
npm install nuxt-nitro-module-kit
pnpm install nuxt-nitro-module-kit
```

You could also use [unjs/nypm](https://nypm.unjs.io), it will automatically detect your package manager!

```sh
npx nypm@latest add nuxt-nitro-module-kit
```

### Development

For detailed example, check out [example module](./examples/module/) and [nitro](./examples/nitro/) or [nuxt](./examples/nuxt/) usage example.

Similar to `defineNuxtModule` provided by `@nuxt/kit`, use `defineNuxtNitroModule` provided by `nuxt-nitro-module-kit` instead.

Due to typescript build infer issue, it is recommended to wrap return value of `defineNuxtNitroModule` with `NuxtNitroModule<T>`.

```ts
import type { NuxtNitroModule } from "nuxt-nitro-module-kit/types";

import { defineNuxtNitroModule } from "nuxt-nitro-module-kit";

export interface ExampleNuxtNitroModuleOptions {}

export default (defineNuxtNitroModule<ExampleNuxtNitroModuleOptions>({
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
}) as NuxtNitroModule<ExampleNuxtNitroModuleOptions>);
```

### Helper functions

Currently only specific subset of Nuxt Kit functions are ported to Nuxt/Nitro Module Kit.
In the future there should be almost 100% exact behavior between both, with just change on import from `nuxt-nitro-module-kit`.

Additional helpers provided to improve development:
- `useNuxtNitroContext`, `tryUseNuxtNitroContext`, `runWithNuxtNitroContext` - `unctx` value for getting current nuxt/nitro. Not that in only works inside `setup` context.
- `getNuxtKit` - get `@nuxt/kit` if installed.
- `tryUseNuxt` - run `tryUseNuxt` if Nuxt is installed.
- `getCheckNuxtCompatibility` - get `checkNuxtCompatibility` function if Nuxt is installed.
- `getLayerConfigurations` - get layer options and directories

### Nuxt Kit Bridge Status

Nuxt Kit Function     | Behavior Note
 -------------------- | -------------------------
`addTemplate`         | Currently only works for type template.
`addTypeTemplate`     | Same behavior as `@nuxt/kit`.
`getLayerDirectories` | Same behavior as `@nuxt/kit` but only having `root` and `server` directory.

## Developed Module Usage

Once your module is ready, you may deploy to npm or private npm registry. The package can be used as shown below.

### Nuxt

```typescript
// nuxt.config.ts
// via string reference
export default defineNuxtConfig({
  modules: ["my-nuxt-nitro-package"],
  myNuxtNitroConfig: {
    // config here
  },
});
```

```typescript
// nuxt.config.ts
// or via imports
import myNuxtNitroPackage from "my-nuxt-nitro-package";

export default defineNuxtConfig({
  modules: [myNuxtNitroPackage],
  myNuxtNitroConfig: {
    // config here
  },
});
```

### Nitro

```typescript
// nitro.config.ts
// via string reference
export default defineNitroConfig({
  modules: ["my-nuxt-nitro-package"],
  myNuxtNitroConfig: {
    // config here
  },
});
```

```typescript
// nitro.config.ts
// or via imports
import nitroGraphqlServer from "my-nuxt-nitro-package";

export default defineNitroConfig({
  modules: [nitroGraphqlServer],
  myNuxtNitroConfig: {
    // config here
  },
});
```

## Development

- Clone this repository
- Install the latest LTS version of [Node.js](https://nodejs.org/en/)
- Install dependencies using `npm install`
- Build in stub mode using `npm run prepare`
- Run Nitro playground using `npm run dev:nitro` or Nuxt playground using `npm run dev:nuxt`
