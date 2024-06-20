import { Migration, MigrationDirection } from './shared';

export interface ILocalMigrations {
  /**
   * Creates migration files (up and down).
   * @param name Name of migration.
   */
  create(name: string): Promise<void>;

  /**
   * Get migration object.
   * @param name Name of migration.
   * @param direction Direction of migration (up, down).
   */
  getMigration(name: string, direction: MigrationDirection): Promise<Migration | null>;

  /**
   * Get next migration name.
   * @param name Name of migration.
   * @param direction Direction of migration (up, down).
   */
  getNextMigrationName(name: string, direction: MigrationDirection): Promise<string | null>;

  /**
   * Get sorted migration names.
   * @param [direction] Returns only migration filenames in provided migration.
   */
  getManyMigrationNames(direction?: MigrationDirection): Promise<string[]>;
}

export type LocalMigrationsConfig = {
  /** Postfix of sql migration files. */
  postfix: Postfix;

  /**
   * Path to migrations directory.
   * If there is no such path - it will be created.
   */
  dirPath: string;
};

export type Postfix = {
  up: string;
  down: string;
};
