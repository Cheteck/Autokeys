import { FrameworkAdapter } from '../types.js';

export const reactAdapter: FrameworkAdapter = {
  framework: 'react',
  i18n: 'react-i18next',
  getImport: () => "import { useTranslation } from 'react-i18next';",
  getHook: () => "const { t } = useTranslation();"
};
