import { relative } from "path";
import { join } from "pathe";

import type { FrameworkContext, NuxtNitroFramework } from "../types";

import { useNuxtNitroContext } from "./async-context";

export interface NuxtNitroLayerMeta {
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface NuxtNitroLayer {
  meta: NuxtNitroLayerMeta;
  cwd: string;
  options: NuxtNitroFramework["options"];
  dirs: {
    rootDir: string;
    serverDir: string;
  };
}

const nitroLayerMap = new Map<string, NuxtNitroLayer>();
/**
 * NOTE: using this method to get nitro layer, based on nuxt layers data structure
 * this should be changed when nitro layer is supported
 * @see https://github.com/nitrojs/nitro/discussions/2784
 */
function extractNitroLayers(framework: FrameworkContext) {
  const rootDirRelative = relative(framework.nitro.options.srcDir, framework.nitro.options.rootDir);

  return framework.nitro.options.scanDirs.map((serverDir) => {
    // if has cached result, use cached result
    if (nitroLayerMap.has(serverDir)) {
      return nitroLayerMap.get(serverDir)!;
    }

    const rootDir = join(serverDir, rootDirRelative);
    const layerInfo: NuxtNitroLayer = {
      meta: {},
      cwd: rootDir,
      options: framework.nitro.options as never,
      dirs: {
        rootDir,
        serverDir,
      },
    };

    // is layer
    if (rootDir !== framework.nitro.options.rootDir) {
      const relativePath = relative(framework.nitro.options.rootDir, rootDir);
      const lastSlashIndex = relativePath.lastIndexOf("/");
      const name = lastSlashIndex >= 0 ? relativePath.substring(lastSlashIndex + 1) : relativePath;
      layerInfo.meta.name = name;
    }

    nitroLayerMap.set(serverDir, layerInfo);
    return layerInfo;
  });
}

const nuxtLayerMap = new WeakMap<object, NuxtNitroLayer>();
function extractNuxtLayers(framework: FrameworkContext) {
  return framework.nuxt.options._layers.map((layer) => {
    if (nuxtLayerMap.has(layer)) {
      return nuxtLayerMap.get(layer)!;
    }

    const layerInfo: NuxtNitroLayer = {
      meta: layer.meta || {},
      cwd: layer.cwd,
      options: layer.config as never,
      dirs: {
        rootDir: layer.config.rootDir,
        serverDir: layer.config.serverDir || `${layer.config.rootDir}`,
      },
    };

    nuxtLayerMap.set(layer, layerInfo);
    return layerInfo;
  });
}

export function getLayerDirectories() {
  const framework = useNuxtNitroContext();
  return framework.nuxt ? extractNuxtLayers(framework) : extractNitroLayers(framework);
}
