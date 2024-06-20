export type MigrationDirection = 'up' | 'down';
export type Migration = {
  sql: string;
  name: string;
};

export type CreateMigrationsTableFunc = () => Promise<void>;
export type MigrateUpFunc = (migrations: Migration[]) => Promise<void>;
export type MigrateDownFunc = (migrations: Migration[]) => Promise<void>;
export type GetMigrationsNamesFunc = () => Promise<string[]>;
export type GetLastMigrationNameFunc = () => Promise<string | null>;
