/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ModuleMeta, Nuxt, NuxtModule } from "@nuxt/schema";
import type { Nitro, NitroHooks, NitroModule } from "nitropack";

export type Awaitable<T> = Promise<T> | T;
export type IsNuxtInstalled = unknown extends Nuxt ? false : true;

/** module options base pattern */
export type NuxtNitroModuleOptions = Record<string, any>;
/** Nuxt type if installed, else never */
export type MaybeNuxt = IsNuxtInstalled extends true ? Nuxt : null;
/** the current framework object. Nuxt type if Nuxt is installed, else Nitro */
export type NuxtNitroFramework = IsNuxtInstalled extends true ? Nuxt : Nitro;

export interface FrameworkContext {
  nitro: Nitro;
  nuxt: MaybeNuxt;
}

export type NuxtNitroModule<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
>
  = IsNuxtInstalled extends true
    ? NuxtModule<TOptions, TOptionsDefaults, false>
    : NitroModule["setup"];

export interface DefineNuxtNitroModule<
  TOptions extends NuxtNitroModuleOptions,
  TOptionsDefaults extends Partial<TOptions> = Partial<TOptions>,
> {
  meta?: ModuleMeta;
  defaults?: TOptionsDefaults | ((context: NuxtNitroFramework) => Awaitable<TOptionsDefaults>);
  schema?: TOptions;
  hooks?: Partial<NitroHooks>;
  setup?(this: void, resolvedOptions: TOptions, context: FrameworkContext): Awaitable<void>;
}
