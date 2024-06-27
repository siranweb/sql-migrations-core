import fsp from 'fs/promises';

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