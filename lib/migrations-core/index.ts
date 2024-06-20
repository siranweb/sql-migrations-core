import {
  IMigrationsCore,
  MigrationsCoreConfig,
  MigrationActions,
} from './types/migrations-core.interface';
import { ILocalMigrations } from './types/local-migrations.interface';
import { LocalMigrations } from './local-migrations';
import { IStoredMigrations } from './types/stored-migrations.interface';
import { StoredMigrations } from './stored-migrations';

export class MigrationsCore implements IMigrationsCore {
  private readonly actions: MigrationActions;
  private readonly localMigrations: ILocalMigrations;
  private readonly storedMigrations: IStoredMigrations;

  constructor(config: MigrationsCoreConfig) {
    this.actions = config.sqlActions;

    this.localMigrations = new LocalMigrations({
      postfix: config.postfix ?? {
        up: '.up.sql',
        down: '.down.sql',
      },
      dirPath: config.path,
    });

    this.storedMigrations = new StoredMigrations({
      sqlActions: {
        createTable: config.sqlActions.createMigrationTable,
        getLastName: config.sqlActions.getLastMigrationName,
        getNames: config.sqlActions.getMigrationsNames,
        migrateDown: config.sqlActions.migrateDown,
        migrateUp: config.sqlActions.migrateUp,
      },
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

  public async to(_partialMigrationName: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async down(): Promise<void> {
    await this.storedMigrations.initTable();

    const lastMigrationName = await this.storedMigrations.getLastMigrationName();

    if (!lastMigrationName) {
      // TODO ?
      return;
    }

    const migration = await this.localMigrations.getMigration(lastMigrationName, 'down');

    if (!migration) {
      // TODO ?
      return;
    }

    await this.actions.migrateDown([migration]);
  }

  public async up(): Promise<void> {
    await this.storedMigrations.initTable();

    const lastMigrationName = await this.storedMigrations.getLastMigrationName();

    if (!lastMigrationName) {
      // TODO ?
      return;
    }

    const migration = await this.localMigrations.getNextMigration(lastMigrationName, 'up');

    if (!migration) {
      // TODO ?
      return;
    }

    await this.actions.migrateUp([migration]);
  }

  public async drop(): Promise<void> {
    return Promise.resolve(undefined);
  }

  private makeName(title: string, timestamp: number): string {
    return `${timestamp.toString()}-${title}`;
  }
}
