export const migrationFileInfo1: MigrationFileInfo = {
  filename: 'first.down.sql',
  name: 'first',
  content: 'drop table if exists "my_table1";',
}

export const migrationFileInfo2: MigrationFileInfo = {
  filename: 'first.up.sql',
  name: 'first',
  content: 'create table if not exists "my_table1" (id int increment primary key);',
}

export const migrationFileInfo3: MigrationFileInfo = {
  filename: 'second.down.sql',
  name: 'second',
  content: 'drop table if exists "my_table2";',
}

export const migrationFileInfo4: MigrationFileInfo = {
  filename: 'second.up.sql',
  name: 'second',
  content: 'create table if not exists "my_table2" (id int primary key);',
}

export const migrationFileInfo5: MigrationFileInfo = {
  filename: 'third.down.sql',
  name: 'third',
  content: 'drop table if exists "my_table3" (id int primary key);',
}

export const migrationFileInfo6: MigrationFileInfo = {
  filename: 'third.up.sql',
  name: 'third',
  content: 'create table if not exists "my_table3" (id int primary key);',
}

export const migrations: MigrationFileInfo[] = [
  migrationFileInfo1,
  migrationFileInfo2,
  migrationFileInfo3,
  migrationFileInfo4,
  migrationFileInfo5,
  migrationFileInfo6,
];
export const migrationNames: string[] = Array.from(
  new Set(migrations.map(migrationInfo => migrationInfo.name))
);

type MigrationFileInfo = {
  content: string;
  filename: string;
  name: string;
};