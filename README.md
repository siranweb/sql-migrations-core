# SQL Migrations Core
[![npm](https://img.shields.io/npm/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![node](https://img.shields.io/node/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![npm](https://img.shields.io/npm/l/sql-migrations-core.svg?maxAge=1000)](https://github.com/siranweb/sql-migrations-core/LICENSE.md)

**Database framework-agnostic** package for DIY migrations solutions with **zero dependencies**, written in TypeScript.

With `sql-migrations-core` you can write sql migrations as you want. Use **ANY** database framework and prepare CLI as you feel comfortable.

## Table of Contents
TODO

## Installation
Install with `npm`:
```bash
npm i sql-migrations-core
```

Or with `yarn`:
```bash
yarn add sql-migrations-core
```

...Or with `pnpm`:
```bash
pnpm add sql-migrations-core
```

## Usage
Minimal configuration looks like this:

```ts
const migrationsCore = MigrationsCore.create({
  path: path.join('..', 'path/to/migrations/dir'),
  sqlActions: {
    async createMigrationTable() {
      // TODO implement
    },
    async getMigrationsNames() {
      // TODO implement
      return [];
    },
    async migrateDown(migrations) {
      // TODO implement
    },
    async migrateUp(migrations) {
      // TODO implement
    },
  },
});
```

There is a trade-off - you can use any db framework, but you need to implement SQL queries by yourself. For example, with [kysely](https://github.com/kysely-org/kysely):
```ts
import { db } from './database';

// Probably you'll want to move SQL logic to repository.
// In this example I'm just showing a minimal SQL implementation.

const migrationsCore = MigrationsCore.create({
  path: path.join('/migrations'),
  sqlActions: {
    async createMigrationTable() {
      await db.schema.createTable('__migrations')
        .ifNotExists()
        .addColumn('name', 'varchar', (cb) => cb.notNull().unique())
        .addColumn('migrated_at', 'timestamp', (cb) =>
          cb.notNull().defaultTo(sql`now()`)
        )
        .execute()
    },
    
    async getMigrationsNames() {
      const records = await db.selectFrom('__migrations')
        .select('name')
        .execute();
      return records.map(r => r.name);
    },
    
    async migrateDown(migrations) {
      await db.transaction().execute(async (trx) => {
        for (const migration of migrations) {
          await trx.deleteFrom('__migrations')
            .where({ name: migration.name })
            .execute();
          await sql`${migration.sql}`.execute(trx);
        }
      })
    },
    
    async migrateUp(migrations) {
      await db.transaction().execute(async (trx) => {
        for (const migration of migrations) {
          await trx.insertInto('__migrations')
            .values({ name: migration.name })
            .execute();
          await sql`${migration.sql}`.execute(trx);
        }
      })
    },
  },
});
```
See other examples [here](./examples/migrations-core).

## Migration files
Migrations core creates 2 migration files - up and down. It uses `{timestamp}-${title}${postfix}`
format (name of migration is `{timestamp}-{title}`):
```ts
await migrationsCore.create('example');

// Will create something like this
// ./migrations/1718394484921-example.down.sql
// ./migrations/1718394484921-example.up.sql
```

## CLI
There is no out-of-box CLI solution, so you need implement one by yourself. For example, create migration file:

```ts
import { migrationsCore } from './migrations-core';
import path from 'node:path';

const migrationsPath = path.join('./migrations');
migrationsCore.create(process.args[2]);
```
Usage:
```
node ./scripts/migrations-create.js example
```
See other CLI examples [here](./examples/cli).


## API
TODO
