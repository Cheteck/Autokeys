import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * i18next-inspired Merger
 * Handles active keys and archives unused ones to _old.json
 */
export async function mergeMessages(outDir: string, locale: string, currentKeys: Record<string, string>) {
  const activePath = path.join(outDir, `${locale}.json`);
  const oldPath = path.join(outDir, `${locale}_old.json`);
  
  let existingActive = {};
  let existingOld = {};
  
  try {
    existingActive = JSON.parse(await fs.readFile(activePath, 'utf-8'));
  } catch {}
  
  try {
    existingOld = JSON.parse(await fs.readFile(oldPath, 'utf-8'));
  } catch {}

  const nextActive: Record<string, string> = {};
  const nextOld: Record<string, string> = { ...existingOld };

  // Keys that are in current extraction stay or become active
  for (const [key, val] of Object.entries(currentKeys)) {
      nextActive[key] = val;
  }

  // Keys that were active but are no longer extracted move to _old
  for (const [key, val] of Object.entries(existingActive)) {
      if (!nextActive[key]) {
          nextOld[key] = val as string;
      }
  }

  // Clean up _old: if a key returned to active, remove from _old
  for (const key of Object.keys(nextActive)) {
      delete nextOld[key];
  }

  await fs.mkdir(outDir, { recursive: true });
  
  // Sort keys alphabetically (i18next-cli style)
  const sortedActive = Object.keys(nextActive).sort().reduce((acc, k) => ({ ...acc, [k]: nextActive[k] }), {});
  const sortedOld = Object.keys(nextOld).sort().reduce((acc, k) => ({ ...acc, [k]: nextOld[k] }), {});

  await fs.writeFile(activePath, JSON.stringify(sortedActive, null, 2));
  
  if (Object.keys(sortedOld).length > 0) {
      await fs.writeFile(oldPath, JSON.stringify(sortedOld, null, 2));
  }
  
  return activePath;
}
