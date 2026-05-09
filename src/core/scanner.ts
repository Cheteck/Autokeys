import { generateKey } from '../utils/slugify.js';

/**
 * Filter to ignore technical strings
 */
export function shouldIgnore(text: string): boolean {
  if (!text || text.length < 2) return true;
  
  // Ignore URLs
  if (/^https?:\/\//.test(text)) return true;
  
  // Ignore purely numerical/technical IDs
  if (/^[a-f0-9-]{8,}$/.test(text)) return true;
  
  // Ignore CSS classes/selectors (rough check)
  if (text.startsWith('.') || text.startsWith('#')) return true;

  // Ignore common technical words
  const blacklist = ['undefined', 'null', 'NaN', 'true', 'false', 'POST', 'GET', 'utf-8'];
  if (blacklist.includes(text)) return true;

  return false;
}

export function extractText(content: string) {
  // This will be used by jscodeshift in the transform step
}
