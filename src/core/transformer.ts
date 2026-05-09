import { generateKey } from '../utils/key-gen.js';
import { shouldIgnore } from './scanner.js';
import { getAdapter } from '../adapters/index.js';
import * as pathLib from 'node:path';
import { Config } from '../config/schema.js';

export default function transformer(file: any, api: any, options: Partial<Config> & { isDryRun?: boolean; existingMessages?: Record<string, string> }) {
  const j = api.jscodeshift;
  const root = j(file.source);
  
  const { 
    framework = 'next', 
    i18nLib = 'next-intl', 
    namespacing = { enabled: true, separator: '.' },
    extraction = { attributes: ['placeholder', 'alt', 'title', 'label', 'aria-label'], customComponents: {} },
    keyGeneration = { strategy: 'slug', maxLength: 50 },
    existingMessages = {},
    isDryRun = false
  } = options;

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
      
      prefix = pathWithoutExt
          .split(pathLib.sep)
          .filter(part => part && part !== '.' && part !== '..')
          .map(part => part.toLowerCase().replace(/[^a-z0-9]/g, '_'))
          .join(namespacing.separator || '.') + (namespacing.separator || '.');
  }

  const getOrGenerateKey = (text: string) => {
      const trimmed = text.trim();
      // Industry Standard: exact match check first
      for (const [k, v] of Object.entries(extractedKeys)) {
          if (v === trimmed) return k;
      }
      for (const [k, v] of Object.entries(existingMessages)) {
          if (v === trimmed) return k;
      }
      const key = prefix + generateKey(trimmed, keyGeneration);
      extractedKeys[key] = trimmed;
      return key;
  };

  // PASS 1: JSX Text
  root.find(j.JSXText).forEach((path: any) => {
    const text = path.node.value.trim();
    if (shouldIgnore(text)) return;
    const key = getOrGenerateKey(text);
    const leading = path.node.value.match(/^\s+/)?.[0] || '';
    const trailing = path.node.value.match(/\s+$/)?.[0] || '';
    const tCall = j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(key)]));
    
    if (leading || trailing) {
        const nodes = [];
        if (leading) nodes.push(j.jsxText(leading));
        nodes.push(tCall);
        if (trailing) nodes.push(j.jsxText(trailing));
        j(path).replaceWith(nodes);
    } else {
        j(path).replaceWith(tCall);
    }
    hasChanges = true;
  });

  // PASS 2: Attributes
  root.find(j.JSXAttribute).forEach((path: any) => {
    const name = path.node.name.name;
    if (typeof name === 'string' && (extraction.attributes || []).includes(name)) {
        const val = path.node.value;
        if (val?.type === 'StringLiteral' && !shouldIgnore(val.value)) {
            const key = getOrGenerateKey(val.value);
            j(path).replaceWith(j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(key)]))));
            hasChanges = true;
        }
    }
  });

  // PASS 3: Template Literals (Dynamic Strings)
  root.find(j.TemplateLiteral).forEach((path: any) => {
      if (path.parent.node.type === 'CallExpression' && path.parent.node.callee.name === 't') return;

      const { quasis, expressions } = path.node;
      let raw = '';
      quasis.forEach((q: any, i: number) => {
          raw += q.value.cooked;
          if (i < expressions.length) raw += `{${i}}`;
      });

      if (shouldIgnore(raw)) return;

      const key = getOrGenerateKey(raw);
      const args: any[] = [j.stringLiteral(key)];
      if (expressions.length > 0) {
          args.push(j.objectExpression(expressions.map((e: any, i: number) => j.property('init', j.identifier(String(i)), e))));
      }

      const tCall = j.callExpression(j.identifier('t'), args);
      j(path).replaceWith(['JSXElement', 'JSXFragment', 'JSXExpressionContainer'].includes(path.parent.node.type) ? tCall : tCall);
      hasChanges = true;
  });

  // PASS 4: Imports & Hooks Injection (Optimized)
  if (hasChanges && !isDryRun) {
    if (root.find(j.ImportDeclaration, { source: { value: v => v.includes(adapter.i18n) } }).size() === 0) {
        const first = root.find(j.Program).get('body', 0);
        const hasDirective = first.value?.type === 'ExpressionStatement' && typeof first.value.expression.value === 'string' && first.value.expression.value.startsWith('use ');
        if (hasDirective) j(first).insertAfter(adapter.getImport());
        else root.find(j.Program).get('body', 0).insertBefore(adapter.getImport());
    }

    const componentSelectors = [
        root.find(j.FunctionDeclaration),
        root.find(j.VariableDeclarator, { init: { type: 'ArrowFunctionExpression' } }),
        root.find(j.ExportDefaultDeclaration, { declaration: { type: 'FunctionExpression' } })
    ];

    componentSelectors.forEach(selector => {
        selector.forEach((path: any) => {
            const node = path.node.init || path.node.declaration || path.node;
            if (node.body?.type === 'BlockStatement') {
                if (j(node.body).find(j.CallExpression, { callee: { name: 't' } }).size() > 0 && j(node.body).find(j.VariableDeclarator, { id: { name: 't' } }).size() === 0) {
                    let idx = 0;
                    for (let i = 0; i < node.body.body.length; i++) {
                        if (node.body.body[i].type === 'VariableDeclaration' && j(node.body.body[i]).toSource().includes('use')) idx = i + 1;
                        else if (idx > 0) break;
                    }
                    node.body.body.splice(idx, 0, j.template.statement([adapter.getHook()]));
                }
            }
        });
    });
  }

  return { source: root.toSource({ quote: 'single' }), keys: extractedKeys };
}
