import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  Filename,
  Filepath,
  IMigrationsCore,
  MigrationDirection,
  MigrationName,
  MigrationsCoreConfig,
  MigrationActions,
} from './types/migrations-core.interface';
import { isENOENT } from '../utils/errors';

export class MigrationsCore implements IMigrationsCore {
  private readonly dirPath: string;
  private readonly upPostfix: string;
  private readonly downPostfix: string;
  private readonly actions: MigrationActions;

  constructor(config: MigrationsCoreConfig) {
    this.dirPath = config.path;
    this.actions = config.actions;
    this.upPostfix = config.postfix?.up ?? '.up.sql';
    this.downPostfix = config.postfix?.down ?? '.down.sql';
  }

  public async create(title: string): Promise<void> {
    const timestamp = Date.now();

    await this.createMigrationFiles([
      this.buildFilename('up', title, timestamp),
      this.buildFilename('down', title, timestamp),
    ]);
  }

  public async toLatest(): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async to(_partialMigrationName: MigrationName): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async down(): Promise<void> {
    const storedMigrationNames = await this.getStoredMigrationNames();
    const currentMigrationName = storedMigrationNames.at(-1);

    const currentMigrationFilename = await this.getLocalMigrationFilename(
      'down',
      currentMigrationName,
    );

    if (!currentMigrationFilename) {
      // TODO no migrations log?
      return;
    }

    const migrationFilepath = this.getMigrationPath(currentMigrationFilename);
    const fileContent = await fsp.readFile(migrationFilepath, 'utf8');

    await this.actions.downMigrations([
      {
        sql: fileContent,
        name: this.getMigrationNameByFilename(currentMigrationFilename),
      },
    ]);
  }

  public async up(): Promise<void> {
    const storedMigrationNames = await this.getStoredMigrationNames();
    const currentMigrationName = storedMigrationNames.at(-1);

    const nextMigrationFilename = await this.getNextLocalMigrationFilename(
      'up',
      currentMigrationName,
    );

    if (!nextMigrationFilename) {
      // TODO no migrations log?
      return;
    }

    const migrationFilepath = this.getMigrationPath(nextMigrationFilename);
    const fileContent = await fsp.readFile(migrationFilepath, 'utf8');

    await this.actions.upMigrations([
      {
        sql: fileContent,
        name: this.getMigrationNameByFilename(nextMigrationFilename),
      },
    ]);
  }

  public async drop(): Promise<void> {
    return Promise.resolve(undefined);
  }

  private async createMigrationFiles(filenames: string[]): Promise<void> {
    try {
      await fsp.access(this.dirPath, fsp.constants.W_OK);
    } catch (err: unknown) {
      if (!isENOENT(err)) {
        throw err;
      }

      await fsp.mkdir(this.dirPath, { recursive: true });
    }

    await Promise.all(
      filenames.map((fileName) => fsp.appendFile(path.join(this.dirPath, fileName), '')),
    );
  }

  private getPostfix(direction: MigrationDirection): string {
    return direction === 'up' ? this.upPostfix : this.downPostfix;
  }

  private async getStoredMigrationNames(): Promise<MigrationName[]> {
    const stored = await this.actions.getMigrationNames();
    return stored.sort(this.migrationNamesSortFunc);
  }

  private async getLocalMigrationFilenames(direction?: MigrationDirection): Promise<Filename[]> {
    const filenames = await fsp.readdir(this.dirPath);
    const filtered = direction
      ? filenames.filter((filename) => filename.endsWith(this.getPostfix(direction)))
      : filenames;
    return filtered.sort(this.migrationNamesSortFunc);
  }

  private async getLocalMigrationFilename(
    direction: MigrationDirection,
    migrationName?: string,
  ): Promise<Filename | null> {
    if (migrationName === undefined) {
      return null;
    }
    const filename = this.buildFilenameByName(migrationName, direction);
    try {
      await fsp.access(this.getMigrationPath(filename), fsp.constants.R_OK);
    } catch (err: unknown) {
      if (!isENOENT(err)) {
        throw err;
      }
      return null;
    }

    return filename;
  }

  private async getNextLocalMigrationFilename(
    direction: MigrationDirection,
    migrationName?: MigrationName,
  ): Promise<Filename | null> {
    const localMigrationFilenames = await this.getLocalMigrationFilenames(direction);

    const migrationFilename = migrationName
      ? this.buildFilenameByName(migrationName, direction)
      : null;
    const filenameIndex =
      migrationFilename === null ? -1 : localMigrationFilenames.indexOf(migrationFilename);

    const nextMigrationFilenameIndex = filenameIndex + 1;
    const nextMigrationFilename = localMigrationFilenames[nextMigrationFilenameIndex];

    if (!nextMigrationFilename) {
      return null;
    }

    try {
      await fsp.access(this.getMigrationPath(nextMigrationFilename), fsp.constants.R_OK);
    } catch (err: unknown) {
      if (!isENOENT(err)) {
        throw err;
      }
      return null;
    }

    return nextMigrationFilename;
  }

  private getMigrationPath(filename: Filename): Filepath {
    return path.join(this.dirPath, filename);
  }

  private migrationNamesSortFunc(a: string, b: string): number {
    return a < b ? -1 : 1;
  }

  private getMigrationNameByFilename(filename: Filename): MigrationName {
    let postfixIndex = filename.lastIndexOf(this.getPostfix('up'));
    if (postfixIndex === -1) {
      postfixIndex = filename.lastIndexOf(this.getPostfix('down'));
    }

    if (postfixIndex !== -1) {
      return filename.substring(0, postfixIndex);
    } else {
      return filename;
    }
  }

  private buildFilenameByName(
    migrationName: MigrationName,
    direction: MigrationDirection,
  ): Filename {
    return `${migrationName}${this.getPostfix(direction)}`;
  }

  private buildFilename(direction: MigrationDirection, title: string, timestamp: number): Filename {
    return `${timestamp.toString()}-${title}${this.getPostfix(direction)}`;
  }
}
