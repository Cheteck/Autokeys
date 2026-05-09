import { reactAdapter } from './react/index.js';
import { nextAdapter } from './next/index.js';
import { vueAdapter } from './vue/index.js';
import { svelteAdapter } from './svelte/index.js';
import { FrameworkAdapter } from './types.js';

export * from './types.js';

export const adapters: FrameworkAdapter[] = [
  reactAdapter,
  nextAdapter,
  vueAdapter,
  svelteAdapter
];

export function getAdapter(framework: string, i18n: string): FrameworkAdapter {
  return adapters.find(a => a.framework === framework && a.i18n === i18n) || reactAdapter;
}
