import type { Nitro } from "nitropack";

import { captureStackTrace } from "errx";
import { fileURLToPath } from "mlly";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve } from "pathe";

import type { FrameworkContext } from "../../types";
import type { MaybeNuxt } from "../types";

import { logger } from "../logger";
import { useNuxtNitroContext } from "./async-context";
import { filterInPlace } from "./helpers";

declare module "nitropack" {
  interface NitroHooks {
    "prepare:types"(args: {
      references: { path: string }[];
      declarations: string[];
    }): void | Promise<void>;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TemplateDefaultOptions = Record<string, any>;

// from https://github.com/nuxt/nuxt/blob/4b466816a0a84adb07d94c13be4c12713ef8f630/packages/kit/src/template.ts#L72
export interface NuxtNitroTemplate<Options = TemplateDefaultOptions> {
  /** resolved output file path (generated) */
  dst?: string;
  /** The target filename once the template is copied into the Nuxt buildDir */
  filename?: string;
  /** An options object that will be accessible within the template via `<% options %>` */
  options?: Options;
  /** The resolved path to the source file to be template */
  // src?: string; // not supported for now
  /** Provided compile option instead of src */
  getContents: (data: {
    nuxt: MaybeNuxt;
    nitro: Nitro;
    options: Options;
  }) => string | Promise<string>;
  /** Write to filesystem */
  write?: boolean;
  /**
     * The source path of the template (to try resolving dependencies from).
     * @internal
     */
  _path?: string;
}

export interface NuxtNitroTypeTemplate<Options = TemplateDefaultOptions> extends Omit<NuxtNitroTemplate<Options>, "write" | "filename"> {
  filename: `${string}.d.ts`;
  write?: true;
}

export interface ResolvedNuxtNitroTemplate<Options = TemplateDefaultOptions> extends NuxtNitroTemplate<Options> {
  filename: string;
  dst: string;
  modified?: boolean;
}

/** simplified version of nuxt/kit's normalizeTemplate */
function normalizeTemplate<T>(template: NuxtNitroTemplate<T>, context: FrameworkContext): ResolvedNuxtNitroTemplate<T> {
  template = { ...template };

  if (!template.filename?.endsWith(".d.ts")) {
    throw new Error(`Invalid type template. Filename must end with .d.ts : "${template.filename}"`);
  }

  if (!template.getContents) {
    throw new Error("Invalid template. `getContents` must be provided: " + JSON.stringify(template));
  }

  // Always write declaration files
  if (template.filename.endsWith(".d.ts")) {
    template.write = true;
  }

  // Resolve dst
  const buildDir = context.nuxt ? context.nuxt.options.buildDir : context.nitro.options.buildDir;
  template.dst ||= resolve(buildDir, template.filename);

  return template as ResolvedNuxtNitroTemplate<T>;
}

const distDirURL = new URL(".", import.meta.url);

export function addTemplate<T>(_template: NuxtNitroTemplate<T>) {
  const context = useNuxtNitroContext();

  // Normalize template
  const template = normalizeTemplate(_template, context);

  if (context.nuxt) {
  // Remove any existing template with the same destination path
    filterInPlace(
      context.nuxt.options.build.templates,
      p => typeof p === "object" && (p.dst || normalizeTemplate(p as never, context).dst) !== template.dst,
    );
  }

  try {
    const distDir = distDirURL.toString();
    const { source } = captureStackTrace().find(e => e.source && !e.source.startsWith(distDir)) ?? {};
    if (source) {
      const path = normalize(fileURLToPath(source));
      if (existsSync(path)) {
        template._path = path;
      }
    }
  } catch {
    // ignore errors as this is an additive feature
  }

  // Add to templates array
  if (context.nuxt) {
    context.nuxt.options.build.templates.push({
      ...template,
      getContents(data) {
        return template.getContents({
          ...data,
          nitro: context.nitro,
        });
      },
    });
  }

  return template;
}

async function compileTemplate<T>(template: NuxtNitroTemplate<T>, context: FrameworkContext) {
  return await template.getContents({ ...context, options: template.options! });
}

const FORWARD_SLASH_RE = /\//g;
async function processTemplate<T>(template: ResolvedNuxtNitroTemplate<T>, context: FrameworkContext) {
  const vfs = context.nuxt ? context.nuxt.vfs : context.nitro.vfs;
  const dirs = new Set<string>();
  const writes: Array<() => void> = [];

  const fullPath = template.dst;
  const start = performance.now();

  const oldContents = vfs[fullPath];
  const contents = await compileTemplate(template, context).catch((e) => {
    logger.error(`Could not compile template \`${template.filename}\`.`);
    logger.error(e);
    throw e;
  });

  template.modified = oldContents !== contents;
  if (template.modified) {
    vfs[fullPath] = contents;

    const aliasPath = "#build/" + template.filename;
    vfs[aliasPath] = contents;

    // In case a non-normalized absolute path is called for on Windows
    if (process.platform === "win32") {
      vfs[fullPath.replace(FORWARD_SLASH_RE, "\\")] = contents;
    }
  }

  const perf = performance.now() - start;
  const setupTime = Math.round((perf * 100)) / 100;

  if ((context.nitro.options.debug) || setupTime > 500) {
    logger.info(`Compiled \`${template.filename}\` in ${setupTime}ms`);
  }

  if (template.modified && template.write) {
    dirs.add(dirname(fullPath));
    writes.push(() => writeFileSync(fullPath, contents, "utf8"));
  }

  // Write template files in single synchronous step to avoid (possible) additional
  // runtime overhead of cascading HMRs from vite/webpack
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
  for (const write of writes) {
    write();
  }
}

/** Mimic nuxt's nitro:prepare:types */
function addDtsReferences(context: FrameworkContext) {
  const options = context.nitro.options as { _addedDtsReferences?: true };
  if (options._addedDtsReferences) {
    return;
  }

  options._addedDtsReferences = true;
  const typescript = context.nitro.options.typescript ||= {} as never;
  typescript.tsConfig ||= {};
  const includes = typescript.tsConfig.include ||= [];
  includes.push("./nuxt-nitro-bridge.d.ts");

  context.nitro.hooks.hook(
    "types:extend",
    () => processTemplate(
      normalizeTemplate(
        {
          filename: "types/nuxt-nitro-bridge.d.ts",
          getContents: async () => {
            const references: { path: string }[] = [];
            const declarations: string[] = [];
            await context.nitro.hooks.callHook("prepare:types", { references, declarations });

            const sourceDir = join(context.nitro.options.buildDir, "types");
            const lines = [
              ...references.map((ref) => {
                if (isAbsolute(ref.path)) {
                  ref.path = relative(sourceDir, ref.path);
                }
                return `/// <reference path="${ref.path}" />`;
              }),
              ...declarations,
              "",
            ];

            return lines.join("\n");
          },
        },
        context,
      ),
      context,
    ))
  ;
}

/**
 * Renders given types during build to disk in the project `buildDir`
 * and register them as types.
 *
 * You can pass a second context object to specify in which context the type should be added.
 *
 * If no context object is passed, then it will only be added to the nuxt context.
 */
export function addTypeTemplate<T>(_template: NuxtNitroTypeTemplate<T>): ResolvedNuxtNitroTemplate<T> {
  const context = useNuxtNitroContext();
  const template = addTemplate(_template);

  if (context.nuxt) {
    context.nuxt.hook("nitro:prepare:types", ({ references }) => {
      references.push({ path: template.dst });
    });
  } else {
    addDtsReferences(context);
    context.nitro.hooks.hook("prepare:types", ({ references }) => {
      references.push({ path: template.dst });
    });
    context.nitro.hooks.hook("types:extend", () => processTemplate(template, context));
  }

  return template;
}
