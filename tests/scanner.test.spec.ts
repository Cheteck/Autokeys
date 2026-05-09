import { describe, it, expect } from 'vitest';
import { shouldIgnore } from '../src/core/scanner.js';

describe('Scanner Pro v2', () => {
  it('should ignore URLs', () => {
    expect(shouldIgnore('https://example.com')).toBe(true);
  });

  it('should ignore code directives', () => {
    expect(shouldIgnore('use client')).toBe(true);
    expect(shouldIgnore('use server')).toBe(true);
  });

  it('should ignore file paths', () => {
    expect(shouldIgnore('/src/components/Button.tsx')).toBe(true);
    expect(shouldIgnore('./index.js')).toBe(true);
  });

  it('should extract human readable text', () => {
    expect(shouldIgnore('Bonjour le monde')).toBe(false);
    expect(shouldIgnore('Cliquer ici')).toBe(false);
  });
});
