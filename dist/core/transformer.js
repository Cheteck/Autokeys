import { generateKey } from '../utils/slugify.js';
import { shouldIgnore } from './scanner.js';
import { getAdapter } from '../adapters/index.js';
import * as pathLib from 'node:path';
export default function transformer(file, api, options) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const { framework = 'react', i18n = 'react-i18next', namespace = true, existingMessages = {} } = options;
    const adapter = getAdapter(framework, i18n);
    let hasChanges = false;
    const extractedKeys = {};
    // Determine prefix based on filename
    const fileName = pathLib.basename(file.path, pathLib.extname(file.path));
    const prefix = namespace ? `${fileName.toLowerCase()}.` : '';
    const getOrGenerateKey = (text) => {
        const trimmed = text.trim();
        for (const [k, v] of Object.entries(extractedKeys)) {
            if (v === text)
                return k;
        }
        for (const [k, v] of Object.entries(existingMessages)) {
            if (v === text)
                return k;
        }
        const key = prefix + generateKey(trimmed);
        extractedKeys[key] = text;
        return key;
    };
    // 1. Find and replace JSX Text with space preservation
    root.find(j.JSXText).forEach((path) => {
        const originalValue = path.node.value;
        const text = originalValue.trim();
        if (shouldIgnore(text))
            return;
        const key = getOrGenerateKey(text);
        // Preserve leading/trailing spaces by checking originalValue
        const leadingSpace = originalValue.match(/^\s+/)?.[0] || '';
        const trailingSpace = originalValue.match(/\s+$/)?.[0] || '';
        const tCall = j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(key)]));
        if (leadingSpace || trailingSpace) {
            // Replace with a sequence of spaces and the translation call
            const nodes = [];
            if (leadingSpace)
                nodes.push(j.jsxText(leadingSpace));
            nodes.push(tCall);
            if (trailingSpace)
                nodes.push(j.jsxText(trailingSpace));
            j(path).replaceWith(nodes);
        }
        else {
            j(path).replaceWith(tCall);
        }
        hasChanges = true;
    });
    // 2. Find and replace String Literals in attributes
    const translatableAttributes = ['placeholder', 'alt', 'title', 'label', 'aria-label'];
    root.find(j.JSXAttribute).forEach((path) => {
        const attrName = path.node.name.name;
        if (typeof attrName === 'string' && translatableAttributes.includes(attrName)) {
            const value = path.node.value;
            if (value && value.type === 'StringLiteral') {
                const text = value.value;
                if (shouldIgnore(text))
                    return;
                const key = getOrGenerateKey(text);
                j(path).replaceWith(j.jsxAttribute(j.jsxIdentifier(attrName), j.jsxExpressionContainer(j.callExpression(j.identifier('t'), [j.stringLiteral(key)]))));
                hasChanges = true;
            }
        }
    });
    // 3. Advanced Template Literals support
    root.find(j.TemplateLiteral).forEach((path) => {
        const { quasis, expressions } = path.node;
        let translationString = '';
        quasis.forEach((quasi, i) => {
            translationString += quasi.value.cooked;
            if (i < expressions.length) {
                translationString += `{${i}}`;
            }
        });
        if (shouldIgnore(translationString.trim()))
            return;
        const key = getOrGenerateKey(translationString);
        const tArgs = [j.stringLiteral(key)];
        if (expressions.length > 0) {
            const props = expressions.map((expr, i) => j.property('init', j.identifier(String(i)), expr));
            tArgs.push(j.objectExpression(props));
        }
        j(path).replaceWith(j.callExpression(j.identifier('t'), tArgs));
        hasChanges = true;
    });
    // 4. Inject Imports and Hooks
    if (hasChanges) {
        const imports = root.find(j.ImportDeclaration);
        const hasI18nImport = imports.filter((p) => p.node.source.value.includes(i18n)).size() > 0;
        if (!hasI18nImport) {
            const firstNode = root.find(j.Program).get('body', 0);
            if (firstNode.value && firstNode.value.type === 'ExpressionStatement' &&
                firstNode.value.expression.type === 'StringLiteral' &&
                (firstNode.value.expression.value === 'use client' || firstNode.value.expression.value === 'use server')) {
                j(firstNode).insertAfter(adapter.getImport());
            }
            else {
                root.find(j.Program).get('body', 0).insertBefore(adapter.getImport());
            }
        }
        const components = root.find(j.FunctionDeclaration);
        const arrowComponents = root.find(j.VariableDeclarator, {
            init: { type: 'ArrowFunctionExpression' }
        });
        const processComponent = (path) => {
            const node = path.node.init || path.node;
            const body = node.body;
            if (body.type === 'BlockStatement') {
                let hasHook = false;
                const scope = j(body).find(j.VariableDeclarator, { id: { name: 't' } });
                if (scope.size() > 0)
                    hasHook = true;
                if (!hasHook) {
                    let insertIndex = 0;
                    for (let i = 0; i < body.body.length; i++) {
                        const stmt = body.body[i];
                        if (stmt.type === 'VariableDeclaration' &&
                            j(stmt).toSource().includes('use')) {
                            insertIndex = i + 1;
                        }
                        else if (insertIndex > 0) {
                            break;
                        }
                    }
                    body.body.splice(insertIndex, 0, j.template.statement([adapter.getHook()]));
                }
            }
        };
        if (components.size() > 0)
            processComponent(components.at(0).get());
        else if (arrowComponents.size() > 0)
            processComponent(arrowComponents.at(0).get());
    }
    return {
        source: root.toSource(),
        keys: extractedKeys
    };
}
