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
   * @returns Migration object if exists.
   */
  getMigration(name: string, direction: MigrationDirection): Promise<Migration | null>;

  /**
   * Get next migration object.
   * @param name Name of migration.
   * @param direction Direction of migration (up, down).
   * @returns Migration object if exists.
   */
  getNextMigration(name: string, direction: MigrationDirection): Promise<Migration | null>;

  /**
   * Get migrations names.
   */
  getMigrationNames(): Promise<string[]>;
}

export type LocalMigrationsConfig = {
  postfix: Postfix;
  dirPath: string;
};

export type Postfix = {
  up: string;
  down: string;
};
