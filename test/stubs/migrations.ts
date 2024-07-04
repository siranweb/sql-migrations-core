import { Migration } from '../../lib/migrations-core/types/shared';

export const migrationFileInfo1: MigrationFileInfo = {
  filename: '1-first.down.sql',
  name: '1-first',
  content: 'drop table if exists "my_table1";',
}

export const migrationFileInfo2: MigrationFileInfo = {
  filename: '1-first.up.sql',
  name: '1-first',
  content: 'create table if not exists "my_table1" (id int increment primary key);',
}

export const migrationFileInfo3: MigrationFileInfo = {
  filename: '2-second.down.sql',
  name: '2-second',
  content: 'drop table if exists "my_table2";',
}

export const migrationFileInfo4: MigrationFileInfo = {
  filename: '2-second.up.sql',
  name: '2-second',
  content: 'create table if not exists "my_table2" (id int primary key);',
}

export const migrationFileInfo5: MigrationFileInfo = {
  filename: '3-third.down.sql',
  name: '3-third',
  content: 'drop table if exists "my_table3" (id int primary key);',
}

export const migrationFileInfo6: MigrationFileInfo = {
  filename: '3-third.up.sql',
  name: '3-third',
  content: 'create table if not exists "my_table3" (id int primary key);',
}

export const migration1: Migration = {
  sql: migrationFileInfo1.content,
  name: migrationFileInfo1.name,
}

export const migration2: Migration = {
  sql: migrationFileInfo2.content,
  name: migrationFileInfo2.name,
}

export const migration3: Migration = {
  sql: migrationFileInfo3.content,
  name: migrationFileInfo3.name,
}

export const migration4: Migration = {
  sql: migrationFileInfo4.content,
  name: migrationFileInfo4.name,
}

export const migration5: Migration = {
  sql: migrationFileInfo5.content,
  name: migrationFileInfo5.name,
}

export const migration6: Migration = {
  sql: migrationFileInfo6.content,
  name: migrationFileInfo6.name,
}

export const migrationsInfos: MigrationFileInfo[] = [
  migrationFileInfo1,
  migrationFileInfo2,
  migrationFileInfo3,
  migrationFileInfo4,
  migrationFileInfo5,
  migrationFileInfo6,
];

export const migrations: Migration[] = [
  migration1,
  migration2,
  migration3,
  migration4,
  migration5,
  migration6,
];

export const upMigrations: Migration[] = [
  migration2,
  migration4,
  migration6,
];

export const downMigrations: Migration[] = [
  migration5,
  migration3,
  migration1,
];

export const migrationNames: string[] = Array.from(
  new Set(migrationsInfos.map(migrationInfo => migrationInfo.name))
);

type MigrationFileInfo = {
  content: string;
  filename: string;
  name: string;
};