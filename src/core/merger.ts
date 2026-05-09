import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function mergeMessages(outDir: string, locale: string, newKeys: Record<string, string>) {
  const filePath = path.join(outDir, `${locale}.json`);
  let existing = {};
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    existing = JSON.parse(data);
  } catch {}

  const merged = { ...existing, ...newKeys };
  
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  
  return filePath;
}
