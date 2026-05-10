/**
 * Professional Scanner v4
 * Advanced filtering for technical strings and CSS classes
 */
export function shouldIgnore(text: string): boolean {
  if (!text) return true;
  
  const trimmed = text.trim();
  
  // 1. Minimum length
  if (trimmed.length < 2) return true;
  
  // 2. Purely numeric or single word lowercase (likely code/id)
  if (/^\d+$/.test(trimmed)) return true;

  // 3. Technical prefixes
  if (/^[.#\[\]{}()>+~^$|]/.test(trimmed)) return true;

  // 4. File paths and URLs
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^[\/\.][\w\/\.-]+\.\w+$/.test(trimmed)) return true;

  // 5. Tailwind / CSS Class detection
  // Strings with many spaces, no punctuation, and starting with common tailwind prefixes
  const tailwindPrefixes = ['flex', 'grid', 'bg-', 'text-', 'p-', 'm-', 'w-', 'h-', 'border-', 'rounded-'];
  const words = trimmed.split(/\s+/);
  if (words.length > 2 && tailwindPrefixes.some(p => words.some(w => w.startsWith(p)))) {
      // If it looks like a list of classes and has no sentence-like punctuation
      if (!/[\.\?\!:]/.test(trimmed)) return true;
  }

  // 6. Common technical words
  const technicalWords = new Set([
    'undefined', 'null', 'nan', 'true', 'false', 
    'post', 'get', 'utf-8', 'application/json',
    'localhost', 'env', 'node_modules', 'public',
    'use client', 'use server', 'content-type',
    'id', 'class', 'classname', 'style', 'key', 'ref'
  ]);
  
  if (technicalWords.has(trimmed.toLowerCase())) return true;

  // 7. Code patterns
  if (!trimmed.includes(' ') && trimmed.length > 8) {
      if (/([a-z][A-Z])/.test(trimmed) || /_/.test(trimmed)) return true;
  }

  return false;
}
