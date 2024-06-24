import path from 'node:path';
import {
  ILocalMigrations,
  LocalMigrationsConfig,
  MigrationNamesSequence,
  Postfix,
} from './types/local-migrations.interface';
import fsp from 'node:fs/promises';
import { isENOENT } from '../utils/errors';
import { Migration, MigrationDirection } from './types/shared';
import { ascSort } from '../utils/sorting';

export class LocalMigrations implements ILocalMigrations {
  private readonly postfix: Postfix;
  private readonly dirPath: string;

  constructor(config: LocalMigrationsConfig) {
    this.postfix = config.postfix;
    this.dirPath = config.dirPath;
  }

  public async create(name: string): Promise<void> {
    const filenames = [this.makeFilename(name, 'up'), this.makeFilename(name, 'down')];

    const promises = filenames.map((filename) => this.createEmptyMigration(filename));
    await Promise.all(promises);
  }

  public async getNextMigration(
    name: string,
    direction: MigrationDirection,
  ): Promise<Migration | null> {
    const nextMigrationName = await this.getNextMigrationName(name, direction);
    if (!nextMigrationName) {
      return null;
    }

    return this.getMigration(nextMigrationName, direction);
  }

  public async getMigration(
    name: string,
    direction: MigrationDirection,
  ): Promise<Migration | null> {
    const filename = this.makeFilename(name, direction);
    const migrationPath = this.makeMigrationPath(filename);
    const isMigrationExists = await this.checkIsPathExists(migrationPath);

    if (!isMigrationExists) {
      return null;
    }

    return {
      sql: await fsp.readFile(migrationPath, 'utf8'),
      name,
    };
  }

  public async getMigrationNames(): Promise<string[]> {
    const filenames = await fsp.readdir(this.dirPath);
    const names = filenames.map((filename) => this.extractName(filename));
    const uniqueNames = Array.from(new Set(names));
    return this.sortMigrationFilenames(uniqueNames);
  }

  public async getMigrationNamesSequence(
    from?: string,
    to?: string,
  ): Promise<MigrationNamesSequence> {
    const localMigrationsNames = await this.getMigrationNames();

    if (localMigrationsNames.length === 0) {
      return {
        names: [],
        direction: 'up',
      };
    }

    const fromMigrationNameIndex = from ? localMigrationsNames.indexOf(from) : 0;
    const toMigrationNameIndex = to
      ? localMigrationsNames.indexOf(to)
      : localMigrationsNames.length - 1;

    const areFound = fromMigrationNameIndex !== -1 && toMigrationNameIndex !== -1;
    const areSame = fromMigrationNameIndex === toMigrationNameIndex;
    if (!areFound || areSame) {
      return {
        names: [],
        direction: 'up',
      };
    }

    if (fromMigrationNameIndex < toMigrationNameIndex) {
      return {
        names: localMigrationsNames.slice(fromMigrationNameIndex, toMigrationNameIndex + 1),
        direction: 'up',
      };
    } else {
      return {
        names: localMigrationsNames
          .slice(toMigrationNameIndex, fromMigrationNameIndex + 1)
          .reverse(),
        direction: 'down',
      };
    }
  }

  private async getNextMigrationName(
    name: string,
    direction: MigrationDirection,
  ): Promise<string | null> {
    const currentFilename = this.makeFilename(name, direction);
    const currentMigrationPath = this.makeMigrationPath(currentFilename);

    const isCurrentMigrationExists = await this.checkIsPathExists(currentMigrationPath);
    if (!isCurrentMigrationExists) {
      return null;
    }

    const migrationNames = await this.getMigrationNames();
    const currentFilenameIndex = migrationNames.indexOf(name);
    const nextMigrationNameIndex = currentFilenameIndex + 1;
    const nextMigrationName = migrationNames[nextMigrationNameIndex];

    return nextMigrationName ?? null;
  }

  private extractName(filename: string): string {
    let postfixIndex = filename.lastIndexOf(this.postfix.up);
    if (postfixIndex === -1) {
      postfixIndex = filename.lastIndexOf(this.postfix.down);
    }

    return postfixIndex === -1 ? filename : filename.substring(0, postfixIndex);
  }

  private sortMigrationFilenames(filenames: string[]): string[] {
    return [...filenames].sort(ascSort);
  }

  private async createEmptyMigration(filename: string): Promise<void> {
    await fsp.appendFile(this.makeMigrationPath(filename), '');
  }

  private makeFilename(name: string, direction: MigrationDirection): string {
    return `${name}${this.postfix[direction]}`;
  }

  private makeMigrationPath(filename: string): string {
    return path.join(this.dirPath, filename);
  }

  private async checkIsPathExists(path: string): Promise<boolean> {
    try {
      await fsp.access(path, fsp.constants.R_OK);
    } catch (err: unknown) {
      if (!isENOENT(err)) {
        throw err;
      }
      return false;
    }

    return true;
  }
}
