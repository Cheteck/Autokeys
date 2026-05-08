import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function mergeMessageFile(outDir: string, locale: string, newKeys: Record<string, string>) {
  const filePath = path.join(outDir, `${locale}.json`);
  await fs.mkdir(outDir, { recursive: true });

  let existing: Record<string, any> = {};
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    existing = JSON.parse(data);
  } catch {}

  const merged = { ...existing, ...newKeys };
  
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  return filePath;
}
