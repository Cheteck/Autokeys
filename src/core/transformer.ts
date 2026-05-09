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

  root.find(j.JSXText).forEach((path: any) => {
    const originalValue = path.node.value;
    const text = originalValue.trim();
    if (shouldIgnore(text)) return;

    const key = getOrGenerateKey(text);
    const leadingSpace = originalValue.match(/^\s+/)?.[0] || '';
    const trailingSpace = originalValue.match(/\s+$/)?.[0] || '';

    const tCall = j.jsxExpressionContainer(
        j.callExpression(j.identifier('t'), [j.stringLiteral(key)])
    );

    if (leadingSpace || trailingSpace) {
        const nodes: any[] = [];
        if (leadingSpace) nodes.push(j.jsxText(leadingSpace));
        nodes.push(tCall);
        if (trailingSpace) nodes.push(j.jsxText(trailingSpace));
        j(path).replaceWith(nodes);
    } else {
        j(path).replaceWith(tCall);
    }
    hasChanges = true;
  });

  root.find(j.JSXAttribute).forEach((path: any) => {
    const attrName = path.node.name.name;
    if (typeof attrName === 'string' && (extraction.attributes || []).includes(attrName)) {
        const value = path.node.value;
        if (value && value.type === 'StringLiteral') {
            const text = value.value;
            if (shouldIgnore(text)) return;
            const key = getOrGenerateKey(text);
            j(path).replaceWith(
                j.jsxAttribute(
                    j.jsxIdentifier(attrName),
                    j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(key)]))
                )
            );
            hasChanges = true;
        }
    }
  });

  root.find(j.TemplateLiteral).forEach((path: any) => {
      let p = path.parent;
      while (p) {
          if (p.node.type === 'CallExpression' && p.node.callee.name === 't') return;
          p = p.parent;
      }

      const { quasis, expressions } = path.node;
      let templateStr = '';
      quasis.forEach((q: any, i: number) => {
          templateStr += q.value.cooked;
          if (i < expressions.length) templateStr += `{${i}}`;
      });

      if (shouldIgnore(templateStr.trim())) return;

      const key = getOrGenerateKey(templateStr);
      const tArgs: any[] = [j.stringLiteral(key)];
      if (expressions.length > 0) {
          const props = expressions.map((expr: any, i: number) => 
              j.property('init', j.identifier(String(i)), expr)
          );
          tArgs.push(j.objectExpression(props));
      }

      const tCall = j.callExpression(j.identifier('t'), tArgs);
      if (['JSXElement', 'JSXFragment', 'JSXExpressionContainer'].includes(path.parent.node.type)) {
          j(path).replaceWith(tCall);
      } else {
          j(path).replaceWith(tCall);
      }
      hasChanges = true;
  });

  if (hasChanges && !isDryRun) {
    const imports = root.find(j.ImportDeclaration);
    const existingI18n = imports.filter((p: any) => p.node.source.value.includes(adapter.i18n));
    
    if (existingI18n.size() === 0) {
        const firstNode = root.find(j.Program).get('body', 0);
        const isDirective = firstNode.value?.type === 'ExpressionStatement' && 
                          typeof firstNode.value.expression.value === 'string' &&
                          firstNode.value.expression.value.startsWith('use ');
        
        if (isDirective) j(firstNode).insertAfter(adapter.getImport());
        else root.find(j.Program).get('body', 0).insertBefore(adapter.getImport());
    }

    const componentPaths = [
        ...root.find(j.FunctionDeclaration).paths(),
        ...root.find(j.VariableDeclarator, { init: { type: 'ArrowFunctionExpression' } }).paths(),
        ...root.find(j.ExportDefaultDeclaration, { declaration: { type: 'FunctionExpression' } }).paths()
    ];

    componentPaths.forEach((path: any) => {
        const node = path.node.init || path.node.declaration || path.node;
        const body = node.body;
        if (body?.type === 'BlockStatement') {
            const usesT = j(body).find(j.CallExpression, { callee: { name: 't' } }).size() > 0;
            if (!usesT) return;

            const hasHook = j(body).find(j.VariableDeclarator, { id: { name: 't' } }).size() > 0;
            if (!hasHook) {
                let insertIdx = 0;
                for (let i = 0; i < body.body.length; i++) {
                    const stmt = body.body[i];
                    if (stmt.type === 'VariableDeclaration' && j(stmt).toSource().includes('use')) {
                        insertIdx = i + 1;
                    } else if (insertIdx > 0) break;
                }
                body.body.splice(insertIdx, 0, j.template.statement([adapter.getHook()]));
            }
        }
    });
  }

  return {
    source: root.toSource(),
    keys: extractedKeys
  };
}
