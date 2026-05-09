import { describe, it, expect } from 'vitest';
import { generateKey } from '../src/utils/key-gen.js';

describe('Key Generator', () => {
  it('should generate a slug for simple text', () => {
    expect(generateKey('Hello World')).toBe('hello_world');
  });

  it('should handle special characters', () => {
    expect(generateKey('Bienvenue, l’ami !')).toBe('bienvenue_lami');
  });

  it('should support hash strategy', () => {
    const hash = generateKey('Hello World', { strategy: 'hash' });
    expect(hash).toHaveLength(8);
    expect(hash).not.toBe('hello_world');
  });

  it('should respect maxLength', () => {
    const longText = 'Ceci est un texte beaucoup trop long pour une simple clé i18n';
    const key = generateKey(longText, { maxLength: 10 });
    expect(key.length).toBeLessThanOrEqual(10);
  });
});
