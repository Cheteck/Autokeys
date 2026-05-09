import jscodeshift from 'jscodeshift';

/**
 * Advanced Extractor inspired by i18next-parser
 * Detects dynamic keys via comments or custom Trans components
 */
export function extractDynamicKeys(source: string): string[] {
  const j = jscodeshift.withParser('tsx');
  const root = j(source);
  const keys: string[] = [];

  // Parse comments like /* i18next-extract-mark: key_name */
  root.find(j.Comment).forEach(path => {
    const value = path.node.value;
    const match = value.match(/i18next-extract-mark:\s*([\w\.]+)/);
    if (match) keys.push(match[1]);
  });

  return keys;
}
