import fsp from 'fs/promises';
import { constants } from 'fs';

export async function checkIsFileExists(filePath: string): Promise<boolean> {
  return await fsp
    .access(filePath, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
