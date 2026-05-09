import { FrameworkAdapter } from '../adapters/types.js';

export interface ExtractedText {
  text: string;
  key: string;
  path: string;
  isAttribute: boolean;
}

export interface Config {
  framework: 'react' | 'next';
  i18n: 'next-intl' | 'react-i18next' | 'custom';
  locale: string;
  outDir: string;
}
