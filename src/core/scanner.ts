/**
 * Professional Scanner v3
 * Inspired by i18next-cli filtering
 */
export function shouldIgnore(text: string): boolean {
  if (!text) return true;
  
  const trimmed = text.trim();
  
  // 1. Minimum length
  if (trimmed.length < 2) return true;
  
  // 2. Purely numeric
  if (/^\d+$/.test(trimmed)) return true;

  // 3. Technical prefixes (CSS, technical IDs)
  if (/^[.#\[\]{}()>+~^$|]/.test(trimmed)) return true;

  // 4. File paths and URLs
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^[\/\.][\w\/\.-]+\.\w+$/.test(trimmed)) return true;

  // 5. Common technical words
  const technicalWords = new Set([
    'undefined', 'null', 'nan', 'true', 'false', 
    'post', 'get', 'utf-8', 'application/json',
    'localhost', 'env', 'node_modules', 'public',
    'use client', 'use server', 'content-type',
    'id', 'class', 'classname', 'style', 'key'
  ]);
  
  if (technicalWords.has(trimmed.toLowerCase())) return true;

  // 6. Code patterns (no spaces + camelCase/snake_case)
  if (!trimmed.includes(' ') && trimmed.length > 8) {
      if (/([a-z][A-Z])/.test(trimmed) || /_/.test(trimmed)) return true;
  }

  return false;
}

/**
 * Advanced: Plural detection
 */
export function isPluralCandidate(text: string): boolean {
    const pluralKeywords = ['item', 'article', 'échantillon', 'élément', 'message'];
    const lowercase = text.toLowerCase();
    return pluralKeywords.some(kw => lowercase.includes(kw)) && (lowercase.includes('{0}') || lowercase.includes('\${'));
}
