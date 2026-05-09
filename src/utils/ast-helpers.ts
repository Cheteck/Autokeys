import jscodeshift from 'jscodeshift';

export const isReactComponent = (path: any): boolean => {
  const node = path.node;
  // Simple check for PascalCase functions or functions returning JSX
  if (node.type === 'FunctionDeclaration' && /^[A-Z]/.test(node.id?.name || '')) return true;
  if (node.type === 'VariableDeclarator' && /^[A-Z]/.test((node.id as any)?.name || '')) return true;
  return false;
};

export const hasI18nImport = (root: any, i18nLib: string): boolean => {
  return root.find(jscodeshift.ImportDeclaration, {
    source: { value: (v: string) => v.includes(i18nLib) }
  }).size() > 0;
};
