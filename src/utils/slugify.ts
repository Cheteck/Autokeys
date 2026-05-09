import slugifyLib from 'slugify';

export function generateKey(text: string): string {
  const clean = text
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
    
  return (slugifyLib as any).default ? (slugifyLib as any).default(clean, {
    lower: true,
    replacement: '_',
    strict: true
  }).substring(0, 50) : (slugifyLib as any)(clean, {
    lower: true,
    replacement: '_',
    strict: true
  }).substring(0, 50);
}
