import { IMigrationsStorageAdapter } from '../../migrations-storage/types/migrations-storage.interface';
import { MigrationResult } from '../../types/shared';

export interface IMigrationsCore {
  /**
   * Creates empty up and down migration files.
   * @param title Part of migration name.
   */
  createEmptyMigrations(title: string): Promise<string>;

  /**
   * Executes one next up migration if possible.
   */
  up(): Promise<MigrationResult | null>;

  /**
   * Executes one current down migration if possible.
   */
  down(): Promise<MigrationResult | null>;

  /**
   * Executes all up migrations starting from last executed.
   */
  sync(): Promise<MigrationResult[]>;
}

export type MigrationsCoreConfig = {
  /**
   * Path to migrations directory.
   * If there is no such path - it will be created.
   */
  dirPath: string;

  /**
   * Adapter for migrations storage.
   * Used to execute sql queries.
   */
  adapter: IMigrationsStorageAdapter;

  /**
   * Postfix of sql migration files.
   * @default '.up.sql', '.down.sql'
   */
  postfix?: {
    up: string;
    down: string;
  };
};
