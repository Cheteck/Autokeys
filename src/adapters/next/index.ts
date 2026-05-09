import { FrameworkAdapter } from '../types.js';

export const nextAdapter: FrameworkAdapter = {
  framework: 'next',
  i18n: 'next-intl',
  getImport: () => "import { useTranslations } from 'next-intl';",
  getHook: () => "const t = useTranslations();",
  canProcessFile: (path: string) => /\.(tsx|jsx|js|ts)$/.test(path)
};
