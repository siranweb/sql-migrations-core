import {
  CreateMigrationsTableFunc,
  GetLastMigrationNameFunc,
  GetMigrationsNamesFunc,
  MigrateDownFunc,
  MigrateUpFunc,
  Migration,
  MigrationDirection,
} from './shared';

export interface IStoredMigrations {
  /**
   * Get migrated names of migrations.
   * @returns Sorted array of migration names.
   */
  getMigrationsNames(): Promise<string[]>;

  /**
   * Get last migrated name of migration.
   * @returns Migration name if exists.
   */
  getLastMigrationName(): Promise<string | null>;

  /**
   * Migrations table initialization.
   */
  initTable(): Promise<void>;

  /**
   * Run migrations in direction.
   * @param migrations Array of migrations.
   * @param direction Direction of migrations.
   */
  migrate(migrations: Migration[], direction: MigrationDirection): Promise<void>;
}

export type StoredMigrationsConfig = {
  sqlActions: SqlActions;
};

export type SqlActions = {
  createTable: CreateMigrationsTableFunc;
  migrateUp: MigrateUpFunc;
  migrateDown: MigrateDownFunc;
  getNames: GetMigrationsNamesFunc;
  getLastName?: GetLastMigrationNameFunc;
};
