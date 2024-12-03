import { IMigrationsStorageAdapter } from '../../migrations-storage/types/migrations-storage.interface';
import { MigrationStep } from '../../types/shared';

export interface IMigrationsCore {
  /**
   * Initialization method. Used to init table in database.
   * Should be called after MigrationsCore instance created.
   */
  init(): Promise<void>;

  /**
   * Creates empty up and down migration files.
   * @param title Part of migration name.
   */
  createEmptyMigrationFiles(title: string): Promise<string>;

  /**
   * Executes one next up migration if possible.
   * @param [options] Migration options.
   */
  up(options?: MigrateOptions): Promise<MigrationStep | null>;

  /**
   * Executes one current down migration if possible.
   * @param [options] Migration options.
   */
  down(options?: MigrateOptions): Promise<MigrationStep | null>;

  /**
   * Executes all up migrations starting from last executed.
   * @param [options] Migration options.
   */
  upToLatest(options?: MigrateOptions): Promise<MigrationStep[]>;

  /**
   * Executes all down migrations starting from last executed.
   * @param [options] Migration options.
   */
  drop(options?: MigrateOptions): Promise<MigrationStep[]>;

  /**
   * Compares migrations and migrations files and executes up/down
   * migrations to synchronize them.
   * @param [options] Migration options.
   */
  sync(options?: MigrateOptions): Promise<MigrationStep[]>;

  /**
   * Executes migrations by given steps.
   * @param migrationsSteps Migrations steps to execute up/down.
   */
  run(migrationsSteps: MigrationStep[]): Promise<void>;
}

export type MigrationsCoreConfig = {
  /**
   * Path to migrations directory.
   */
  migrationsDir: string;

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

  /**
   * Custom logger.
   * If not provided - default `logger` will be used.
   */
  logger?: IMigrationsLogger;
};

export type MigrateOptions = {
  /**
   * Emulate migrations without actually applying them to database.
   * Useful to check steps before their launch.
   */
  dry?: boolean;
};

export interface IMigrationsLogger {
  info(msg: string): void;
}
