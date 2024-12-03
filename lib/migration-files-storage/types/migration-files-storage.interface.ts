import { MigrationDirection, Postfix } from '../../types/shared';
import { MigrationFilesSequence } from '../migration-files-sequence';
import { MigrationFile } from '../migration-file';

export interface IMigrationFilesStorage {
  /**
   * Creates empty migration files.
   * @param name Migration name.
   */
  createEmptyMigrationFiles(name: string): Promise<void>;

  /**
   * Returns sequence of migrations by direction.
   * If direction is 'up' - takes all up migrations and makes ASC sorting.
   * If direction is 'down' - takes all down migrations and makes DESC sorting.
   * @param direction Migration direction.
   */
  getSequence(direction: MigrationDirection): Promise<MigrationFilesSequence>;

  /**
   * Returns all migrations names with sorting.
   */
  getMigrationsNames(): Promise<string[]>;

  /**
   * Returns MigrationFile if exists. Otherwise, throws error.
   * @param migrationName Name of migration.
   * @param direction Direction of migration.
   */
  getMigrationFile(migrationName: string, direction: MigrationDirection): Promise<MigrationFile>;
}

export type MigrationFilesStorageConfig = {
  postfix: Postfix;
  migrationsDir: string;
};
