import { logger } from "../logger";

async function tryLoad<T>(loadHintName: string, loader: () => Promise<T> | T): Promise<T | null> {
  try {
    return await loader();
  } catch {
    logger.warn(`Failed to load ${loadHintName}, returning null`);
    return null;
  }
}

function buildCachedTryLoad<T>(loadHintName: string, loader: () => Promise<T> | T): () => Promise<T | null> {
  let value: Promise<T | null> | undefined = undefined;
  let loaded = false;

  return () => {
    if (!loaded) {
      value = tryLoad(loadHintName, loader);
      loaded = true;
    }
    return value!;
  };
}

export const getNuxtKit = buildCachedTryLoad("@nuxt/kit", () => import("@nuxt/kit"));
export const tryUseNuxt = buildCachedTryLoad("tryUseNuxt", async () => (await getNuxtKit())!.tryUseNuxt());
export const getCheckNuxtCompatibility = buildCachedTryLoad("checkNuxtCompatibility", async () => (await getNuxtKit())!.checkNuxtCompatibility);
