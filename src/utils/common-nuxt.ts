import { buildCachedTryLoad } from "./try-load";

export const getNuxtKit = buildCachedTryLoad("@nuxt/kit", () => import("@nuxt/kit"));
export const tryUseNuxt = buildCachedTryLoad("tryUseNuxt", async () => (await getNuxtKit())!.tryUseNuxt());
export const getCheckNuxtCompatibility = buildCachedTryLoad("checkNuxtCompatibility", async () => (await getNuxtKit())!.checkNuxtCompatibility);
export const getUpdateTemplates = buildCachedTryLoad("updateTemplates", async () => (await getNuxtKit())!.updateTemplates);
