import { FrameworkAdapter } from '../types.js';

export const vueAdapter: FrameworkAdapter = {
  framework: 'vue',
  i18n: 'vue-i18n',
  getImport: () => "import { useI18n } from 'vue-i18n';",
  getHook: () => "const { t } = useI18n();",
  canProcessFile: (path: string) => /\.vue$/.test(path)
};
