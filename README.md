<!-- TOC --><a name="sql-migrations-core"></a>
# [WIP] SQL Migrations Core
[![npm](https://img.shields.io/npm/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![node](https://img.shields.io/node/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![npm](https://img.shields.io/npm/l/sql-migrations-core.svg?maxAge=1000)](https://github.com/siranweb/sql-migrations-core/LICENSE.md)

**Database framework-agnostic** package for DIY migrations solutions with **zero dependencies**, written in TypeScript.

With `sql-migrations-core` you can write sql migrations as you want. Use **ANY** database framework and prepare CLI as you feel comfortable.

## Table of Contents
<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

* [SQL Migrations Core](#sql-migrations-core)
  * [Installation](#installation)
  * [Initialization](#initialization)
  * [Usage](#usage)
  * [Migration files](#migration-files)
  * [CLI](#cli)
* [API](#api)
    * [Creating `migrationsCore` object](#creating-migrationscore-object)
        + [Using `create(config)`](#using-createconfig)
        + [Using `new MigrationsCore()`](#using-new-migrationscore)
    * [Methods of `migrationsCore` object](#methods-of-migrationscore-object)
    * [Methods of `localMigrations` object](#methods-of-localmigrations-object)
    * [Methods of `storedMigrations` object](#methods-of-storedmigrations-object)

<!-- TOC end -->


<!-- TOC --><a name="installation"></a>
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

<!-- TOC --><a name="initialization"></a>
## Initialization
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

<!-- TOC --><a name="usage"></a>
## Usage
After initializing `migrationsCore` you can use methods:
```ts
await migrationsCore.createFiles('example'); // creates blank sql files

await migrationsCore.up(); // one migration up
await migrationsCore.down(); // one migration down
await migrationsCore.sync(); // all pending up migrations
await migrationsCore.drop(); // all down migrations of executed migrations
await migrationsCore.toLatest(); // all pending up migrations from last executed
await migrationsCore.to('123-example'); // all up/down migrations between last executed and provided

await migrationsCore.status(); // get statuses of migrations (name and is synced)
```

Also, you can pass `chunkSize` in some methods to run migrations by chunks in synchronous way:
```ts
await migrationsCore.sync(100); // runs migrations in chunks limit by 100 
```

See [API](#api) for more info.

<!-- TOC --><a name="migration-files"></a>
## Migration files
Migrations core creates 2 migration files - up and down. It uses `{timestamp}-${title}${postfix}`
format (name of migration is `{timestamp}-{title}`):
```ts
await migrationsCore.createFile('example');

// Will create something like this
// ./migrations/1718394484921-example.down.sql
// ./migrations/1718394484921-example.up.sql
```

<!-- TOC --><a name="cli"></a>
## CLI
There is no out-of-box CLI solution, so you need implement one by yourself. For example, create migration file:

```ts
import { migrationsCore } from './migrations-core';
import path from 'node:path';

const migrationsPath = path.join('./migrations');
migrationsCore.createFile(process.args[2]);
```
Usage:
```
node ./scripts/migrations-create.js example
```
See other CLI examples [here](./examples/cli).


<!-- TOC --><a name="api"></a>
# API
There are several classes available to use:
1. `MigrationsCore` - main class that gives access to all needed migration actions.
2. `LocalMigrations` - class used by `MigrationsCore`. Hides all filesystem operations
   to access local migrations. For advanced usage.
3. `StoredMigrations` - class used by `MigrationsCore`. Hides all database operations
   to run migrations and access metadata of executed migrations. For advanced usage.

<!-- TOC --><a name="creating-migrationscore-object"></a>
## Creating `migrationsCore` object
There are two ways to create instance of `MigrationsCore`:
1. Using static `MigrationsCore.create()` method
2. Using `new MigrationsCore()` constructor

<!-- TOC --><a name="using-createconfig"></a>
### Using `create(config)`
`create()` method receives config object and returns instance of `MigrationsCore`.
Actually it's constructor wrapper, which creates `LocalMigrations` and `StoredMigrations`
by itself. Config options are passed to these objects. Config options:
* `path` - **string**, path to migrations directory. Used by `LocalMigrations`.
* `postfix` - **object**, **optional**, custom postfix for migrations files. Used by `LocalMigrations`.
* `postfix.up` - **string**, postfix for up migrations (default: `.up.sql`).
* `postfix.down` - **string**, postfix for down migrations (default: `.down.sql`).
* `sqlActions` - **object**, postfix for down migrations (default: `.down.sql`). Used by `StoredMigrations`.
* `sqlActions.createMigrationTable` - **function**, used to create table before every `StoredMigrations` action.
  Recommended to use with `IF NOT EXISTS` statement.
* `sqlActions.migrateUp` - **function**, used to run up migrations. Receives array of migration objects.
* `sqlActions.migrateDown` - **function**, used to run down migrations. Receives array of migration objects.
* `sqlActions.getMigrationsNames` - **function**, used to get executed migrations names. Should return array of migration names.
* `sqlActions.getLastMigrationName` - **function**, **optional**, used to get last executed migrations name.
  Should return name or null. If function not provided - `getMigrationsNames` used instead.

Example:

```ts
const migrationsCore = MigrationsCore.create({
  path: path.join(__dirname, '../migrations'),
  postfix: {
    up: '.custom.up.sql',
    down: '.custom.down.sql',
  },
  sqlActions: {
    createMigrationTable() { /* ... */ },
    migrateUp(migrations) { /* ... */ },
    migrateDown(migrations) { /* ... */ },
    getMigrationsNames() { /* ... */ },
    getLastMigrationName() { /* ... */ },
  }
});
```

<!-- TOC --><a name="using-new-migrationscore"></a>
### Using `new MigrationsCore()`
For options refer to [Using create()](#using-createconfig) method section.

Example:

```ts
const localMigrations = new LocalMigrations({
  dirPath: path.join(__dirname, '../migrations'),
  postfix: {
    up: '.up.sql',
    down: '.down.sql',
  },
});

const storedMigrations = new StoredMigrations({
  sqlActions: {
    createMigrationTable() { /* ... */
    },
    migrateUp(migrations) { /* ... */
    },
    migrateDown(migrations) { /* ... */
    },
    getMigrationsNames() { /* ... */
    },
    getLastMigrationName() { /* ... */
    },
  }
});

const migrationsCore = new MigrationsCore(localMigrations, storedMigrations);
```

<!-- TOC --><a name="methods-of-migrationscore-object"></a>
## Methods of `migrationsCore` object
See [migrations-core.interface.ts](./lib/migrations-core/types/migrations-core.interface.ts)

<!-- TOC --><a name="methods-of-localmigrations-object"></a>
## Methods of `localMigrations` object
See [local-migrations.interface.ts](./lib/migrations-core/types/local-migrations.interface.ts)

<!-- TOC --><a name="methods-of-storedmigrations-object"></a>
## Methods of `storedMigrations` object
See [stored-migrations.interface.ts](./lib/migrations-core/types/stored-migrations.interface.ts)
