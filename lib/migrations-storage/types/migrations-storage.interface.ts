import { MigrationDirection } from '../../types/shared';

export interface IMigrationsStorage {
  /**
   * Initialize migrations table.
   */
  initTable(): Promise<void>;

  /**
   * Returns sorted executed migration names.
   */
  getMigrationsNames(): Promise<string[]>;

  /**
   * Returns name of the latest executed migration.
   * If no migrations - returns null.
   */
  getLatestMigrationName(): Promise<string | null>;

  /**
   * Executes migration's SQL query.
   * @param name Name of migration.
   * @param sql SQL query.
   * @param direction Migration direction.
   */
  executeMigration(name: string, sql: string, direction: MigrationDirection): Promise<void>;
}

export interface IMigrationsStorageAdapter {
  /**
   * Used to create migrations table.
   * Called every time, so make sure to provide IF NOT EXISTS statement.
   */
  createMigrationsTable(): Promise<void>;

  /**
   * Used to execute up migration.
   * @param name Name of migration.
   * @param sql SQL query.
   */
  migrateUp(name: string, sql: string): Promise<void>;

  /**
   * Used to execute down migration.
   * @param name Name of migration.
   * @param sql SQL query.
   */
  migrateDown(name: string, sql: string): Promise<void>;

  /**
   * Used to retrieve migrations' names.
   */
  getMigrationsNames(): Promise<string[]>;
}
