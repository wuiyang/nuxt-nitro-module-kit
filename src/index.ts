/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ModuleSetupReturn, Nuxt, NuxtModule } from "@nuxt/schema";
import type { Nitro } from "nitropack";

import defu from "defu";
import { applyDefaults } from "untyped";

import type { NuxtNitroModuleOptions, DefineNuxtNitroModule, NuxtNitroModule, NuxtNitroFramework, IsNuxtInstalled, FrameworkContext } from "./types";

import { logger } from "./logger";
import { runWithNuxtNitroContext, tryUseNuxtNitroContext } from "./utils/async-context";
import { getCheckNuxtCompatibility, tryUseNuxt } from "./utils/try-load";

async function getOptions<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
>(
  framework: Nitro | Nuxt,
  definition: DefineNuxtNitroModule<TOptions, TOptionsDefaults>,
  inlineOptions?: Partial<TOptions>,
): Promise<TOptions> {
  const frameworkOptions = framework.options;
  const meta = definition.meta || {};
  const nuxtConfigOptionsKey = meta.configKey || meta.name;
  const nuxtConfigOptions = (nuxtConfigOptionsKey && nuxtConfigOptionsKey in frameworkOptions ? frameworkOptions[nuxtConfigOptionsKey as never] : {}) as TOptions;
  const optionsDefaults = definition.defaults instanceof Function ? await definition.defaults(framework as NuxtNitroFramework) : definition.defaults ?? {};
  let options = defu(inlineOptions, nuxtConfigOptions, optionsDefaults) as TOptions;
  if (definition.schema) {
    options = await applyDefaults(definition.schema, options) as any;
  }
  return options;
}

async function toNuxtModule<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
>(
  definition: DefineNuxtNitroModule<TOptions, TOptionsDefaults>,
  inlineOptions: TOptions,
  nuxt: Nuxt,
): Promise<ModuleSetupReturn> {
  const meta = definition.meta || {};
  const uniqueKey = meta.name || meta.configKey;
  if (uniqueKey) {
    nuxt.options._requiredModules ||= {};
    if (nuxt.options._requiredModules[uniqueKey]) {
      return false;
    }
    nuxt.options._requiredModules[uniqueKey] = true;
  }
  if (meta.compatibility) {
    const issues = await (await getCheckNuxtCompatibility())!(meta.compatibility, nuxt);
    if (issues.length) {
      logger.warn(`Module \`${meta.name}\` is disabled due to incompatibility issues:
  ${issues.toString()}`);
      return;
    }
  }

  const options = await getOptions(nuxt, definition, inlineOptions);
  const start = performance.now();
  nuxt.hooks.hook("nitro:config", (nitroConfig) => {
    nitroConfig.modules ||= [];
    nitroConfig.modules.push(async (nitro) => {
      const context: FrameworkContext = {
        nuxt,
        nitro,
      };
      await runWithNuxtNitroContext(context, () => toNitroModule(definition, nitro, options));
    });
  });
  const perf = performance.now() - start;
  const setupTime = Math.round(perf * 100) / 100;
  if (setupTime > 5e3 && uniqueKey !== "@nuxt/telemetry") {
    logger.warn(`Slow module \`${uniqueKey || "<no name>"}\` took \`${setupTime}ms\` to setup.`);
  } else if (nuxt.options.debug && nuxt.options.debug.modules) {
    logger.info(`Module \`${uniqueKey || "<no name>"}\` took \`${setupTime}ms\` to setup.`);
  }
  return {
    timings: {
      setup: setupTime,
    },
  };
}

async function toNitroModule<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
>(
  definition: DefineNuxtNitroModule<TOptions, TOptionsDefaults>,
  nitro: Nitro,
  options?: TOptions,
): Promise<void> {
  const context = tryUseNuxtNitroContext();
  // see if context is provided
  if (!context) {
    // if not provided, in nitro context
    // run all the things needed
    options = await getOptions(nitro, definition);
  }

  if (definition.hooks) {
    nitro.hooks.addHooks(definition.hooks);
  }

  const withNitroContext = context || { nuxt: null, nitro } as unknown as FrameworkContext;
  await runWithNuxtNitroContext(withNitroContext, async () => {
    await definition.setup?.(options!, withNitroContext);
  });
}

export function defineNuxtNitroModule<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
>(
  definition: DefineNuxtNitroModule<TOptions, TOptionsDefaults>,
): NuxtNitroModule<TOptions, TOptionsDefaults> {
  const meta = definition.meta || {};
  meta.configKey ||= meta.name;

  function normalizedModule(
    optionsOrNitro: IsNuxtInstalled extends true ? TOptions : Nitro,
    nuxtOrEmpty: IsNuxtInstalled extends true ? Nuxt : never,
  ) {
    // nuxt loaded
    if (nuxtOrEmpty) {
      return toNuxtModule(definition, optionsOrNitro as unknown as TOptions, (nuxtOrEmpty || tryUseNuxt()) as unknown as Nuxt);
    } else {
      const nitro = optionsOrNitro as unknown as Nitro;
      return toNitroModule(definition, nitro);
    }
  }

  // nuxt additional info
  (normalizedModule as NuxtModule<TOptions>).getMeta = () => Promise.resolve(meta);
  (normalizedModule as NuxtModule<TOptions>).getOptions = async (inlineOptions, nuxt) => {
    if (!nuxt) {
      nuxt = (await import("@nuxt/kit")).useNuxt();
    }
    return getOptions(nuxt, definition, inlineOptions);
  };

  return normalizedModule as NuxtNitroModule<TOptions, TOptionsDefaults>;
}
