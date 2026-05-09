import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function createBackup(filePath: string, source: string, backupDir?: string) {
  const fileName = path.basename(filePath);
  const targetDir = backupDir ? path.resolve(backupDir) : path.dirname(filePath);
  const backupPath = path.join(targetDir, `${fileName}.bak`);
  
  if (backupDir) await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(backupPath, source);
  
  return backupPath;
}
