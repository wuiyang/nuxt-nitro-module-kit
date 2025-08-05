import { AsyncLocalStorage } from "node:async_hooks";
import { createContext } from "unctx";

import type { FrameworkContext } from "../types";

const asyncNuxtNitroStorage = createContext<FrameworkContext>({
  asyncContext: true,
  AsyncLocalStorage,
});

export function useNuxtNitroContext() {
  const context = asyncNuxtNitroStorage.tryUse();
  if (!context) {
    throw new Error("Nuxt Nitro module context is unavailable!");
  }
  return context;
}

export function tryUseNuxtNitroContext() {
  return asyncNuxtNitroStorage.tryUse();
}

export function runWithNuxtNitroContext<T>(context: FrameworkContext, fn: () => T): T {
  return asyncNuxtNitroStorage.call(context, fn);
}
