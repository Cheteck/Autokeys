import { reactAdapter } from './react/index.js';
import { nextAdapter } from './next/index.js';
export * from './types.js';
export const adapters = [
    reactAdapter,
    nextAdapter
];
export function getAdapter(framework, i18n) {
    return adapters.find(a => a.framework === framework && a.i18n === i18n) || reactAdapter;
}
