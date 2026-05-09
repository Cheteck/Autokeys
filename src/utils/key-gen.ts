import slugifyLib from 'slugify';
import { createHash } from 'node:crypto';

export interface KeyGenOptions {
  strategy?: 'slug' | 'hash';
  maxLength?: number;
  prefix?: string;
}

export function generateKey(text: string, options: KeyGenOptions = {}): string {
  const { strategy = 'slug', maxLength = 50, prefix = '' } = options;

  let key = '';
  const cleanText = text.trim();

  if (strategy === 'hash') {
    key = createHash('md5').update(cleanText).digest('hex').substring(0, 8);
  } else {
    key = (slugifyLib as any).default ? (slugifyLib as any).default(cleanText, {
      lower: true,
      replacement: '_',
      strict: true,
      locale: 'fr'
    }) : (slugifyLib as any)(cleanText, {
      lower: true,
      replacement: '_',
      strict: true
    });
    
    key = key.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  }

  if (!key || key.length < 2) {
    key = 'text_' + createHash('md5').update(cleanText).digest('hex').substring(0, 6);
  }

  const finalKey = prefix + key.substring(0, maxLength);
  return finalKey;
}
