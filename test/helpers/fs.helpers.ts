import fsp from 'fs/promises';
import path from 'path';
import * as fs from 'fs';

export const QUERY_CONTENT = 'QUERY CONTENT';

export async function rmDirSafe(path: string): Promise<void> {
  try {
    await fsp.rmdir(path, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

export async function mkDirSafe(path: string): Promise<void> {
  try {
    await fsp.mkdir(path, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

export function checkIsExists(path: string): boolean {
  return fs.existsSync(path);
}

export async function createFile(dir: string, fileName: string): Promise<string> {
  const filePath = path.join(dir, fileName);
  await fsp.writeFile(filePath, QUERY_CONTENT, 'utf8');
  return filePath;
}
