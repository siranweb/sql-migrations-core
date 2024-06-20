import {
  IMigrationsCore,
  MigrationsCoreConfig,
  MigrationActions,
} from './types/migrations-core.interface';
import { ILocalMigrations } from './types/local-migrations.interface';
import { LocalMigrations } from './local-migrations';
import { MigrationName } from './types/shared';

export class MigrationsCore implements IMigrationsCore {
  private readonly actions: MigrationActions;
  private readonly localMigrations: ILocalMigrations;

  constructor(config: MigrationsCoreConfig) {
    this.actions = config.actions;

    this.localMigrations = new LocalMigrations({
      postfix: config.postfix ?? {
        up: '.up.sql',
        down: '.down.sql',
      },
      dirPath: config.path,
    });
  }

  public async create(title: string): Promise<void> {
    const timestamp = Date.now();

    const migrationName = this.makeName(title, timestamp);
    await this.localMigrations.create(migrationName);
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

    if (!currentMigrationName) {
      // TODO ?
      return;
    }

    const migration = await this.localMigrations.getMigration(currentMigrationName, 'down');

    if (!migration) {
      // TODO ?
      return;
    }

    await this.actions.downMigrations([migration]);
  }

  public async up(): Promise<void> {
    const storedMigrationNames = await this.getStoredMigrationNames();
    const currentMigrationName = storedMigrationNames.at(-1);

    if (!currentMigrationName) {
      // TODO ?
      return;
    }

    const nextMigrationName = await this.localMigrations.getNextMigrationName(
      currentMigrationName,
      'up',
    );

    if (!nextMigrationName) {
      // TODO ?
      return;
    }

    const migration = await this.localMigrations.getMigration(nextMigrationName, 'up');

    if (!migration) {
      // TODO ?
      return;
    }

    await this.actions.upMigrations([migration]);
  }

  public async drop(): Promise<void> {
    return Promise.resolve(undefined);
  }

  private async getStoredMigrationNames(): Promise<MigrationName[]> {
    const stored = await this.actions.getMigrationNames();
    return stored.sort(this.migrationNamesSortFunc);
  }

  private migrationNamesSortFunc(a: string, b: string): number {
    return a < b ? -1 : 1;
  }

  private makeName(title: string, timestamp: number): MigrationName {
    return `${timestamp.toString()}-${title}`;
  }
}
