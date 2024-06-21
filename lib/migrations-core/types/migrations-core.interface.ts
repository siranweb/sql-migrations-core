import {
  CreateMigrationsTableFunc,
  GetLastMigrationNameFunc,
  GetMigrationsNamesFunc,
  MigrateDownFunc,
  MigrateUpFunc,
  MigrationResult,
} from './shared';

export interface IMigrationsCore {
  /**
   * Run one migration up.
   * @returns Result of migration that was executed.
   */
  up(): Promise<MigrationResult | null>;

  /**
   * Run one migration down.
   * @returns Result of migration that was executed.
   */
  down(): Promise<MigrationResult | null>;

  /**
   * Run all pending up migrations.
   * If used with chunks - calls migrate function multiple times one by one.
   * @param [chunkSize] Size of chunk.
   * @returns Results of migrations that were executed.
   */
  toLatest(chunkSize?: number): Promise<MigrationResult[]>;

  /**
   * Run all up or down migrations from current to selected.
   * If used with chunks - calls migrate function multiple times one by one.
   * @param migrationName Name of selected migration.
   * @param [chunkSize] Size of chunk.
   * @returns Results of migrations that were executed.
   */
  to(migrationName: string, chunkSize?: number): Promise<MigrationResult[]>;

  /**
   * Runs all down migrations.
   * If used with chunks - calls migrate function multiple times one by one.
   * @param [chunkSize] Size of chunk.
   * If not provided or `0` - migrations will not be split on chunks.
   * @returns Results of migrations that were executed.
   */
  drop(chunkSize?: number): Promise<MigrationResult[]>;

  /**
   * Create blank migration files in provided path.
   * @param title Migration title or description. Used to create migration name.
   * @returns Name of created migration.
   */
  create(title: string): Promise<string>;
}

export type MigrationsCoreConfig = {
  /**
   * Path to migrations directory.
   * If there is no such path - it will be created.
   */
  path: string;

  /**
   * Methods that will be triggered during migrations.
   */
  sqlActions: MigrationActions;

  /**
   * Postfix of sql migration files.
   * @default '.up.sql', '.down.sql'
   */
  postfix?: {
    up: string;
    down: string;
  };
};

export type MigrationActions = {
  /**
   * Function that will be triggered to create migration table.
   * It will be called before each migration action.
   * Please use `CREATE TABLE IF NOT EXISTS` instruction.
   */
  createMigrationTable: CreateMigrationsTableFunc;

  /**
   * Function that will be triggered to up migrations.
   * @param migrations Array of pending up migrations.
   */
  migrateUp: MigrateUpFunc;

  /**
   * Function that will be triggered to down migrations.
   * @param migrations Array of pending down migrations.
   */
  migrateDown: MigrateDownFunc;

  /**
   * Function that will be triggered to get stored migrations names.
   * @returns Array of migration names.
   */
  getMigrationsNames: GetMigrationsNamesFunc;

  /**
   * Function that will be triggered to get last migration name.
   * If not provided - `getMigrationsNames` will be used instead.
   * @returns Migration name if exists.
   */
  getLastMigrationName?: GetLastMigrationNameFunc;
};
