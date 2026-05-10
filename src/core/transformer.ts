import { generateKey } from '../utils/key-gen.js';
import { shouldIgnore } from './scanner.js';
import { getAdapter } from '../adapters/index.js';
import * as pathLib from 'node:path';
import { Config } from '../config/schema.js';

export default function transformer(file: any, api: any, options: Partial<Config> & { isDryRun?: boolean; existingMessages?: Record<string, string> }) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const { framework = 'next', i18nLib = 'next-intl', namespacing = { enabled: true, separator: '.' }, extraction = { attributes: ['placeholder', 'alt', 'title', 'label', 'aria-label'], customComponents: {} }, keyGeneration = { strategy: 'slug', maxLength: 50 }, existingMessages = {}, isDryRun = false } = options;
  const adapter = getAdapter(framework, i18nLib);
  let hasChanges = false;
  const extractedKeys: Record<string, string> = {};

  let prefix = '';
  if (namespacing.enabled) {
      const fullPath = file.path || 'component.tsx';
      const basePath = namespacing.basePath || '.';
      const relativePath = pathLib.relative(basePath, fullPath);
      const ext = pathLib.extname(relativePath);
      const pathWithoutExt = relativePath.slice(0, -ext.length);
      prefix = pathWithoutExt.split(pathLib.sep).filter(p => p && p !== '.').map(p => p.toLowerCase().replace(/[^a-z0-9]/g, '_')).join(namespacing.separator || '.') + (namespacing.separator || '.');
  }

  const getOrGenerateKey = (text: string, suffix = '') => {
      const trimmed = text.trim();
      const baseKey = prefix + generateKey(trimmed, keyGeneration);
      const key = baseKey + suffix;
      extractedKeys[key] = trimmed;
      return key;
  };

  // PASS 1: Trans Component Support
  root.find(j.JSXElement, { openingElement: { name: { name: 'Trans' } } }).forEach((path: any) => {
      const keyAttr = path.node.openingElement.attributes.find((a: any) => a.name?.name === 'i18nKey');
      if (!keyAttr) {
          const content = j(path).find(j.JSXText).nodes().map(n => n.value.trim()).join(' ');
          if (!shouldIgnore(content)) {
              const key = getOrGenerateKey(content);
              path.node.openingElement.attributes.push(j.jsxAttribute(j.jsxIdentifier('i18nKey'), j.stringLiteral(key)));
              hasChanges = true;
          }
      }
  });

  // PASS 2: JSX Text & Plurals
  root.find(j.JSXText).forEach((path: any) => {
    if (path.parent.node.type === 'JSXElement' && path.parent.node.openingElement.name.name === 'Trans') return;
    const text = path.node.value.trim();
    if (shouldIgnore(text)) return;
    const isPlural = text.toLowerCase().includes('item') || text.toLowerCase().includes('article');
    if (isPlural) {
        const keyOne = getOrGenerateKey(text, '_one');
        getOrGenerateKey(text, '_other');
        j(path).replaceWith(j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(keyOne), j.objectExpression([j.property('init', j.identifier('count'), j.identifier('count'))])])));
    } else {
        j(path).replaceWith(j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(getOrGenerateKey(text))])));
    }
    hasChanges = true;
  });

  // PASS 3: Attributes
  root.find(j.JSXAttribute).forEach((path: any) => {
    const name = path.node.name.name;
    if (typeof name === 'string' && (extraction.attributes || []).includes(name)) {
        const val = path.node.value;
        if (val?.type === 'StringLiteral' && !shouldIgnore(val.value)) {
            j(path).replaceWith(j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(getOrGenerateKey(val.value))]))));
            hasChanges = true;
        }
    }
  });

  // PASS 4: Template Literals
  root.find(j.TemplateLiteral).forEach((path: any) => {
      if (path.parent.node.type === 'CallExpression' && path.parent.node.callee.name === 't') return;
      const { quasis, expressions } = path.node;
      let raw = '';
      quasis.forEach((q: any, i: number) => { raw += q.value.cooked; if (i < expressions.length) raw += `{${i}}`; });
      if (shouldIgnore(raw)) return;
      const args: any[] = [j.stringLiteral(getOrGenerateKey(raw))];
      if (expressions.length > 0) args.push(j.objectExpression(expressions.map((e: any, i: number) => j.property('init', j.identifier(String(i)), e))));
      j(path).replaceWith(j.callExpression(j.identifier('t'), args));
      hasChanges = true;
  });

  if (hasChanges && !isDryRun) {
    if (root.find(j.ImportDeclaration, { source: { value: v => v.includes(adapter.i18n) } }).size() === 0) {
        const first = root.find(j.Program).get('body', 0);
        if (first.value?.type === 'ExpressionStatement' && first.value.expression.value?.startsWith('use ')) j(first).insertAfter(adapter.getImport());
        else root.find(j.Program).get('body', 0).insertBefore(adapter.getImport());
    }
    [j.FunctionDeclaration, j.VariableDeclarator, j.ExportDefaultDeclaration].forEach(type => {
        root.find(type).forEach((p: any) => {
            const node = p.node.init || p.node.declaration || p.node;
            if (node.body?.type === 'BlockStatement') {
                if (j(node.body).find(j.CallExpression, { callee: { name: 't' } }).size() > 0 && j(node.body).find(j.VariableDeclarator, { id: { name: 't' } }).size() === 0) {
                    node.body.body.splice(0, 0, j.template.statement([adapter.getHook()]));
                }
            }
        });
    });
  }

  return { source: root.toSource(), keys: extractedKeys };
}
