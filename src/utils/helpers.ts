// from https://github.com/nuxt/nuxt/blob/4b466816a0a84adb07d94c13be4c12713ef8f630/packages/kit/src/utils.ts#L12
export function filterInPlace<T>(array: T[], predicate: (item: T, index: number, arr: T[]) => unknown) {
  for (let i = array.length; i--; i >= 0) {
    if (!predicate(array[i]!, i, array)) {
      array.splice(i, 1);
    }
  }
  return array;
}
