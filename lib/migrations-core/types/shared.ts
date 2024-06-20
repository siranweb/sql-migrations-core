export type MigrationName = string;
export type Filename = string;
export type Filepath = string;
export type MigrationDirection = 'up' | 'down';
export type Migration = {
  sql: string;
  name: string;
};
