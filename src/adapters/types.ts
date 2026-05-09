export interface FrameworkAdapter {
  framework: string;
  i18n: string;
  getImport: () => string;
  getHook: () => string;
  canProcessFile: (path: string) => boolean;
  isServerComponent?: (source: string) => boolean;
}
