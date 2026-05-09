import { FrameworkAdapter } from '../types.js';

export const svelteAdapter: FrameworkAdapter = {
  framework: 'svelte',
  i18n: 'svelte-i18n',
  getImport: () => "import { t } from 'svelte-i18n';",
  getHook: () => "", // Svelte-i18n is usually global or store-based
  canProcessFile: (path: string) => /\.svelte$/.test(path)
};
