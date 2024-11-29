import { MigrationDirection, Postfix } from '../types/shared';
import fsp from 'fs/promises';
import path from 'path';
import { MigrationFilesSequence } from './migration-files-sequence';
import { IMigrationFilesStorage } from './types/migration-files-storage.interface';

export class MigrationFilesStorage implements IMigrationFilesStorage {
  private readonly postfix: Postfix;
  private readonly dirPath: string;

  constructor(config: MigrationFilesStorageConfig) {
    this.postfix = config.postfix;
    this.dirPath = config.dirPath;
  }

  public async createEmptyMigrations(name: string): Promise<void> {
    const fileNames = [this.buildFileName(name, 'up'), this.buildFileName(name, 'down')];
    const filePaths = fileNames.map((fileName) => this.buildFilePath(fileName));

    const promises = filePaths.map((filePath) => this.createEmptyFile(filePath));
    await Promise.all(promises);
  }

  public async getSequence(direction: MigrationDirection): Promise<MigrationFilesSequence> {
    const options = {
      postfix: this.postfix,
    };
    return await MigrationFilesSequence.from(this.dirPath, direction, options);
  }

  private buildFileName(name: string, direction: MigrationDirection): string {
    return `${name}${this.postfix[direction]}`;
  }

  private buildFilePath(filename: string): string {
    return path.join(this.dirPath, filename);
  }

  private async createEmptyFile(filePath: string): Promise<void> {
    await fsp.writeFile(filePath, '', 'utf8');
  }
}

export type MigrationFilesStorageConfig = {
  postfix: Postfix;
  dirPath: string;
};
