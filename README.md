# Nuxt/Nitro Module Kit

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
