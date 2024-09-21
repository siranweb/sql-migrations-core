import { IMigrationsCore, MigrationsCoreConfig } from './types/migrations-core.interface';
import { ILocalMigrations } from './types/local-migrations.interface';
import { LocalMigrations } from './local-migrations';
import { IStoredMigrations } from './types/stored-migrations.interface';
import { StoredMigrations } from './stored-migrations';
import { executeWithChunks } from '../utils/chunks';
import { Migration, MigrationDirection, MigrationResult, MigrationStatus } from './types/shared';

export class MigrationsCore implements IMigrationsCore {
  private readonly localMigrations: ILocalMigrations;
  private readonly storedMigrations: IStoredMigrations;

  static create(config: MigrationsCoreConfig): MigrationsCore {
    const localMigrations = new LocalMigrations({
      postfix: config.postfix ?? {
        up: '.up.sql',
        down: '.down.sql',
      },
      dirPath: config.path,
    });

    const storedMigrations = new StoredMigrations({
      sqlActions: {
        createTable: config.sqlActions.createMigrationTable.bind(config.sqlActions),
        getLastName: config.sqlActions.getLastMigrationName?.bind(config.sqlActions),
        getNames: config.sqlActions.getMigrationsNames.bind(config.sqlActions),
        migrateDown: config.sqlActions.migrateDown.bind(config.sqlActions),
        migrateUp: config.sqlActions.migrateUp.bind(config.sqlActions),
      },
    });

    return new MigrationsCore(localMigrations, storedMigrations);
  }

  constructor(localMigrations: ILocalMigrations, storedMigrations: IStoredMigrations) {
    this.localMigrations = localMigrations;
    this.storedMigrations = storedMigrations;
  }

  public async createFiles(title: string): Promise<string> {
    const timestamp = Date.now();

    const migrationName = this.makeName(title, timestamp);
    await this.localMigrations.create(migrationName);

    return migrationName;
  }

  public async sync(chunkSize?: number): Promise<MigrationResult[]> {
    await this.storedMigrations.initTable();

    const status = await this.status();
    const unsyncedMigrationsNames = status
      .filter((migrationStatus) => !migrationStatus.synced)
      .map((migrationStatus) => migrationStatus.name);

    await this.migrateBunch(unsyncedMigrationsNames, 'up', chunkSize);

    return [];
  }

  public async status(): Promise<MigrationStatus[]> {
    await this.storedMigrations.initTable();

    const [localMigrationsNames, storedMigrationsNames] = await Promise.all([
      this.localMigrations.getMigrationNames(),
      this.storedMigrations.getMigrationsNames(),
    ]);
    const storedMigrationsNamesSet = new Set(storedMigrationsNames);

    return localMigrationsNames.map((name) => ({
      name,
      synced: storedMigrationsNamesSet.has(name),
    }));
  }

  public async toLatest(chunkSize?: number): Promise<MigrationResult[]> {
    await this.storedMigrations.initTable();

    const latestStoredMigrationName = await this.storedMigrations.getLatestMigrationName();
    const { names, direction } =
      await this.localMigrations.getMigrationNamesSequence(latestStoredMigrationName);

    if (names.length === 0) {
      return [];
    }

    await this.migrateBunch(names, direction, chunkSize);

    return names.map((name) => ({
      name,
      direction,
    }));
  }

  public async to(migrationName: string, chunkSize?: number): Promise<MigrationResult[]> {
    await this.storedMigrations.initTable();

    const latestStoredMigrationName = await this.storedMigrations.getLatestMigrationName();
    const { names, direction } = await this.localMigrations.getMigrationNamesSequence(
      latestStoredMigrationName,
      migrationName,
    );

    if (names.length === 0) {
      return [];
    }

    await this.migrateBunch(names, direction, chunkSize);

    return names.map((name) => ({
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
        names.map((name) => this.localMigrations.getMigration(name, direction)),
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
