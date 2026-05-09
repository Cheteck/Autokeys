/**
 * Professional Scanner v2
 * Advanced filtering for technical strings
 */
export function shouldIgnore(text: string): boolean {
  if (!text) return true;
  
  const trimmed = text.trim();
  
  // 1. Minimum length (ignore single chars/empty)
  if (trimmed.length < 2) return true;
  
  // 2. Technical: purely numeric
  if (/^\d+$/.test(trimmed)) return true;

  // 3. Technical: URLs and paths
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^[\/\.][\w\/\.-]+\.\w+$/.test(trimmed)) return true; // File paths
  
  // 4. Technical: IDs / UUIDs / Hex
  if (/^[a-f0-9-]{8,}$/i.test(trimmed)) return true;
  if (/^0x[a-f0-9]+$/i.test(trimmed)) return true;

  // 5. Technical: Selectors / Symbols
  if (/^[.#\[\]{}()>+~^$|]+/.test(trimmed)) return true;

  // 6. Keywords / Diresctives
  const blacklist = [
    'undefined', 'null', 'nan', 'true', 'false', 
    'post', 'get', 'utf-8', 'application/json',
    'localhost', 'env', 'node_modules', 'public',
    'use client', 'use server', 'content-type'
  ];
  if (blacklist.includes(trimmed.toLowerCase())) return true;

  // 7. Code-like: CamelCase or snake_case without spaces (likely vars)
  if (!trimmed.includes(' ') && trimmed.length > 8 && (/([a-z][A-Z])/.test(trimmed) || /_/.test(trimmed))) return true;

  return false;
}
