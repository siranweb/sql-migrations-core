import { Migration, MigrationName } from './shared';

export interface IMigrationsCore {
  /** Run one migration up. */
  up(): Promise<void>;
  /** Run one migration down. */
  down(): Promise<void>;
  /** Run all pending up migrations. */
  toLatest(): Promise<void>;
  /**
   * Run all up/down migrations from current to selected.
   * @param partialMigrationName Accepts partial name of migration,
   * so you don't need to write the whole name.
   */
  to(partialMigrationName: string): Promise<void>;
  /** Runs all down migrations. */
  drop(): Promise<void>;
  /**
   * Create blank migration files in provided path.
   * @param title Migration title or description. Used to create migration name.
   */
  create(title: string): Promise<void>;
}

export type MigrationsCoreConfig = {
  /**
   * Path to migrations directory.
   * If there is no such path - it will be created.
   */
  path: string;
  /** Methods that will be triggered during migrations. */
  actions: MigrationActions;
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
  /** Function that will be triggered to create migration table. */
  createMigrationTable: () => Promise<void>;
  /**
   * Function that will be triggered to up migrations.
   * @param migrations Array of pending up migrations.
   */
  upMigrations: (migrations: Migration[]) => Promise<void>;
  /**
   * Function that will be triggered to down migrations.
   * @param migrations Array of pending down migrations.
   */
  downMigrations: (migrations: Migration[]) => Promise<void>;
  /**
   * Function that will be triggered to get stored migrations.
   * @returns Array of migration names.
   */
  getMigrationNames: () => Promise<MigrationName[]>;
};
