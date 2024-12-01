import { MigrationFile } from './migration-file';
import { MigrationDirection, Postfix } from '../types/shared';
import fsp from 'fs/promises';
import path from 'path';
import { ascSort, descSort } from '../utils/sorting';
import { MigrationFileNotFoundError } from '../errors/migration-file-not-found.error';
import { IMigrationFilesSequence } from './types/migration-files-sequence.interface';
import { getNumPrefix } from '../utils/split';

export class MigrationFilesSequence implements IMigrationFilesSequence {
  private currentIdx = 0;

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

  public to(migrationName: string): void {
    const idx = this.files.findIndex((migrationFile) => migrationFile.name === migrationName);
    if (idx === -1) {
      throw new MigrationFileNotFoundError(migrationName);
    }
    this.currentIdx = idx;
  }

  public rewind(): void {
    this.currentIdx = 0;
  }

  get current(): MigrationFile | undefined {
    const migrationFile = this.files[this.currentIdx];
    if (!migrationFile) {
      return undefined;
    }

    return migrationFile;
  }

  public next(): IteratorResult<MigrationFile> {
    if (this.currentIdx <= this.files.length - 1) {
      return { done: false, value: this.files[this.currentIdx++] };
    } else {
      return { done: true, value: undefined };
    }
  }

  public [Symbol.iterator](): Iterator<MigrationFile> {
    return {
      next: this.next.bind(this),
    };
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
