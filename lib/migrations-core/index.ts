import { IMigrationsCore, MigrationsCoreConfig } from './types/migrations-core.interface';
import { ILocalMigrations } from './types/local-migrations.interface';
import { LocalMigrations } from './local-migrations';
import { IStoredMigrations } from './types/stored-migrations.interface';
import { StoredMigrations } from './stored-migrations';
import { executeWithChunks } from '../utils/chunks';
import { Migration, MigrationDirection, MigrationResult } from './types/shared';

export class MigrationsCore implements IMigrationsCore {
  private readonly localMigrations: ILocalMigrations;
  private readonly storedMigrations: IStoredMigrations;

  constructor(config: MigrationsCoreConfig) {
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

  public async create(title: string): Promise<string> {
    const timestamp = Date.now();

    const migrationName = this.makeName(title, timestamp);
    await this.localMigrations.create(migrationName);

    return migrationName;
  }

  public async toLatest(): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async to(migrationName: string, chunkSize?: number): Promise<MigrationResult[]> {
    const latestStoredMigrationName = await this.storedMigrations.getLatestMigrationName();
    const localMigrationsNames = await this.localMigrations.getMigrationNames();

    const selectedMigrationNameIndex = localMigrationsNames.indexOf(migrationName);
    if (selectedMigrationNameIndex === -1) {
      throw new Error(); // TODO
    }

    const latestStoredMigrationNameIndex = latestStoredMigrationName
      ? localMigrationsNames.indexOf(latestStoredMigrationName)
      : -1;

    if (selectedMigrationNameIndex === latestStoredMigrationNameIndex) {
      return [];
    }

    let migrationNames: string[];
    let direction: MigrationDirection;
    if (selectedMigrationNameIndex > latestStoredMigrationNameIndex) {
      migrationNames = localMigrationsNames.slice(
        latestStoredMigrationNameIndex + 1,
        selectedMigrationNameIndex + 1,
      );
      direction = 'up';
    } else {
      migrationNames = localMigrationsNames.slice(
        selectedMigrationNameIndex + 1,
        latestStoredMigrationNameIndex + 1,
      );
      direction = 'down';
    }

    await this.migrateBunch(migrationNames, direction, chunkSize);

    return migrationNames.map((name) => ({
      name,
      direction,
    }));
  }

  public async down(): Promise<MigrationResult | null> {
    await this.storedMigrations.initTable();

    const latestMigrationName = await this.storedMigrations.getLatestMigrationName();
    if (!latestMigrationName) return null;

    const migration = await this.localMigrations.getMigration(latestMigrationName, 'down');
    if (!migration) return null;

    await this.storedMigrations.migrate([migration], 'down');

    return {
      name: migration.name,
      direction: 'down',
    };
  }

  public async up(): Promise<MigrationResult | null> {
    await this.storedMigrations.initTable();

    const latestMigrationName = await this.storedMigrations.getLatestMigrationName();
    if (!latestMigrationName) return null;

    const migration = await this.localMigrations.getNextMigration(latestMigrationName, 'up');
    if (!migration) return null;

    await this.storedMigrations.migrate([migration], 'up');

    return {
      name: migration.name,
      direction: 'up',
    };
  }

  public async drop(chunkSize?: number): Promise<MigrationResult[]> {
    await this.storedMigrations.initTable();

    const storedMigrationsNames = await this.storedMigrations.getMigrationsNames();
    if (storedMigrationsNames.length === 0) return [];

    await this.migrateBunch(storedMigrationsNames, 'down', chunkSize);

    return storedMigrationsNames.map((name) => ({
      name,
      direction: 'down',
    }));
  }

  private async migrateBunch(
    names: string[],
    direction: MigrationDirection,
    chunkSize?: number,
  ): Promise<void> {
    await executeWithChunks(names, chunkSize ?? 0, async (names) => {
      const migrations = await Promise.all(
        names.map((name) => this.localMigrations.getMigration(name, 'down')),
      );

      const existMigrations = migrations.filter((migration) => !!migration) as Migration[];

      const areMigrationsMissing = existMigrations.length !== migrations.length;
      if (areMigrationsMissing) {
        throw new Error(); // TODO error
      }

      await this.storedMigrations.migrate(existMigrations, direction);
    });
  }

  private makeName(title: string, timestamp: number): string {
    return `${timestamp.toString()}-${title}`;
  }
}
