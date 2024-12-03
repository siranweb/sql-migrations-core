import { MigrationDirection, Postfix } from '../types/shared';
import fsp from 'fs/promises';
import path from 'path';
import { MigrationFilesSequence } from './migration-files-sequence';
import {
  IMigrationFilesStorage,
  MigrationFilesStorageConfig,
} from './types/migration-files-storage.interface';
import { ascSort } from '../utils/sorting';
import { getNumPrefix } from '../utils/split';
import { MigrationFile } from './migration-file';
import { checkIsFileExists } from '../utils/fs';
import { MigrationFileNotFoundError } from '../errors/migration-file-not-found.error';

export class MigrationFilesStorage implements IMigrationFilesStorage {
  private readonly postfix: Postfix;
  private readonly migrationsDir: string;

  constructor(config: MigrationFilesStorageConfig) {
    this.postfix = config.postfix;
    this.migrationsDir = config.migrationsDir;
  }

  public async createEmptyMigrationFiles(name: string): Promise<void> {
    const fileNames = [this.buildFileName(name, 'up'), this.buildFileName(name, 'down')];
    const filePaths = fileNames.map((fileName) => this.buildFilePath(fileName));

    const promises = filePaths.map((filePath) => this.createEmptyFile(filePath));
    await Promise.all(promises);
  }

  public async getSequence(direction: MigrationDirection): Promise<MigrationFilesSequence> {
    const options = {
      postfix: this.postfix,
    };
    return await MigrationFilesSequence.from(this.migrationsDir, direction, options);
  }

  public async getMigrationFile(
    migrationName: string,
    direction: MigrationDirection,
  ): Promise<MigrationFile> {
    const source = path.join(this.migrationsDir, `${migrationName}${this.postfix[direction]}`);
    const isExists = await checkIsFileExists(source);
    if (!isExists) {
      throw new MigrationFileNotFoundError(migrationName);
    }
    return MigrationFile.create(source, { postfix: this.postfix });
  }

  public async getMigrationsNames(): Promise<string[]> {
    const migrationsFileNames = await fsp.readdir(this.migrationsDir);
    const fileNamesSet = new Set(
      migrationsFileNames.map((fileName) => this.getNameFromFileName(fileName)),
    );
    return Array.from(fileNamesSet).sort((a, b) => ascSort(getNumPrefix(a), getNumPrefix(b)));
  }

  private buildFileName(name: string, direction: MigrationDirection): string {
    return `${name}${this.postfix[direction]}`;
  }

  private buildFilePath(filename: string): string {
    return path.join(this.migrationsDir, filename);
  }

  private async createEmptyFile(filePath: string): Promise<void> {
    await fsp.writeFile(filePath, '', 'utf8');
  }

  private getNameFromFileName(fileName: string): string {
    const postfix = fileName.endsWith(this.postfix.up) ? this.postfix.up : this.postfix.down;
    return fileName.split(postfix)[0];
  }
}
