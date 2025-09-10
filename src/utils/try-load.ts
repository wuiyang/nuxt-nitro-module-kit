import { logger } from "../logger";

async function tryLoad<T>(loadHintName: string, loader: () => Promise<T> | T): Promise<T | null> {
  try {
    return await loader();
  } catch {
    logger.warn(`Failed to load ${loadHintName}, returning null`);
    return null;
  }
}

export function buildCachedTryLoad<T>(loadHintName: string, loader: () => Promise<T> | T): () => Promise<T | null> {
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
