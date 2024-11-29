import { MigrationFile } from './migration-file';
import { MigrationDirection, Postfix } from '../types/shared';
import fsp from 'fs/promises';
import path from 'path';
import { ascSort, descSort } from '../utils/sorting';
import { MigrationFileNotFoundError } from '../errors/migration-file-not-found.error';
import { IMigrationFilesSequence } from './types/migration-files-sequence.interface';
import { getNumPrefix } from '../utils/split';

export class MigrationFilesSequence implements IMigrationFilesSequence {
  private currentIdx = -1;

  public static async from(
    source: string,
    direction: MigrationDirection,
    options: MigrationFilesSequenceOptions,
  ): Promise<MigrationFilesSequence> {
    const fileNames = await this.getFileNames(source, direction, options);
    const filePaths = fileNames.map((fileName) => path.join(source, fileName));
    const migrationFiles = filePaths.map((filePath) => MigrationFile.create(filePath, options));
    return new MigrationFilesSequence(migrationFiles);
  }

  constructor(private readonly files: MigrationFile[]) {}

  public setCursor(migrationName?: string): void {
    if (typeof migrationName !== 'string') {
      this.currentIdx = -1;
      return;
    }

    const idx = this.files.findIndex((migrationFile) => migrationFile.name === migrationName);
    if (idx === -1) {
      throw new MigrationFileNotFoundError(migrationName);
    }
    this.currentIdx = idx;
  }

  public current(): MigrationFile | null {
    const migrationFile = this.files[this.currentIdx];
    if (!migrationFile) {
      return null;
    }

    return migrationFile;
  }

  public next(): void {
    this.currentIdx++;
  }

  private static async getFileNames(
    source: string,
    direction: MigrationDirection,
    options: MigrationFilesSequenceOptions,
  ): Promise<string[]> {
    const postfix = options.postfix[direction];
    const fileNames = await fsp.readdir(source);

    return fileNames
      .filter((fileName) => fileName.endsWith(postfix))
      .sort((a, b) => {
        const func = direction === 'up' ? ascSort : descSort;
        return func(getNumPrefix(a), getNumPrefix(b));
      });
  }
}

export type MigrationFilesSequenceOptions = {
  postfix: Postfix;
};
