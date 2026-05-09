import { reactAdapter } from './react/index.js';
import { nextAdapter } from './next/index.js';
import { FrameworkAdapter } from './types.js';

export * from './types.js';

export const adapters: FrameworkAdapter[] = [
  reactAdapter,
  nextAdapter
];

export function getAdapter(framework: string, i18n: string) {
  return adapters.find(a => a.framework === framework && a.i18n === i18n) || reactAdapter;
}
