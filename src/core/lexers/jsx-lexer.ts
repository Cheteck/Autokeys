import jscodeshift from 'jscodeshift';
import { Lexer } from './types.js';
import { shouldIgnore } from '../scanner.js';

export const jsxLexer: Lexer = {
  language: 'jsx',
  extract: (source: string) => {
    const j = jscodeshift.withParser('tsx');
    const root = j(source);
    const keys: Record<string, string> = {};
    
    // Extract JSX Text
    root.find(j.JSXText).forEach(path => {
      const text = path.node.value.trim();
      if (!shouldIgnore(text)) keys[text] = text;
    });

    return keys;
  }
};
