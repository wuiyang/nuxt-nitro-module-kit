import type { ConsolaInstance, LogType } from "consola";

import { consola } from "consola";

// FIXME: to be replace with env to control debug logging
const enableLogger = false;
export const logger = enableLogger
  ? consola.withTag("nuxt-nitro-module-kit")
  : getStubConsola();

function noop() {}
noop.raw = function () {};

function getStubConsola(): ConsolaInstance {
  const logLevels: LogType[] = ["silent", "fatal", "error", "warn", "log", "info", "success", "fail", "ready", "start", "box", "debug", "trace", "verbose"];
  return logLevels.reduce(
    (obj, level) => {
      obj[level] = noop;
      return obj;
    },
    {} as ConsolaInstance,
  );
}
