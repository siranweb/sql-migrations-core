# [WIP] SQL Migrations Core
[![npm](https://img.shields.io/npm/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![node](https://img.shields.io/node/v/sql-migrations-core.svg?maxAge=1000)](https://www.npmjs.com/package/sql-migrations-core)
[![npm](https://img.shields.io/npm/l/sql-migrations-core.svg?maxAge=1000)](https://github.com/siranweb/sql-migrations-core/LICENSE.md)

**Database framework-agnostic** package for DIY migrations solutions with **zero dependencies**, written in TypeScript.

With `sql-migrations-core` you can write sql migrations as you want. Use **ANY** SQL database framework and build CLI as you feel comfortable.

## Table of Contents
* [Motivation](#motivation)
* [Installation](#installation)
* [Overview](#overview)
* [Going deeper](#going-deeper)
  * [Configuration](#configuration)
  * [Implementing adapter](#implementing-adapter)
  * [CLI](#cli)
  * [Safe execution](#safe-execution)

## Motivation
* **Out-of-box executing methods**. In addition to simple up/down migrations 
it also supports synchronizing, which is useful when working together.
* **Use plain SQL files**. No need to use framework-specific migrators with custom migrations description.
* **Use any lib/framework for database**. All you need is create custom adapter. Don't worry, it's simple.
* **Custom CLI**. No out-of-box CLI. It will suit if you want to configure your own and make it comfortable.  
* **Easy to integrate**. It will create a separated table for metadata in your database (actually, it's up to you),
so you don't need to use any external applications.
* **No dependencies**. Only needed things are included.

## Installation
Install with `npm`:
```bash
npm i sql-migrations-core
```
...or any other package manager you like.

## Overview
Firstly, you need to create instance of `MigrationsCore`:
```ts
// Path to your local migrations files
const migrationsDir = path.resolve('migrations');

const migrator = MigrationsCore.create({
  // See next sections to learn how to implement adapter
  adapter: new SomeAdapter(),
  migrationsDir,
})

// Should be called before using. It will create table in your database
await migrator.init();
```

Now you need to create your migration files:
```ts
await migrator.createEmptyMigrationFiles('create_some_table');
```
It will create 2 files in your `migrationsDir` by pattern `{timestamp}-{title}{postfix}`.
You can change `postfix` in config. `timestamp` is used for sorted file appearing and minimized change of duplicate.

It will create files like `1733235137318-create_some_table.up.sql` and `1733235137318-create_some_table.down.sql`.
Now, you need to fill them will SQL code.

After finishing with files, just use execution method:
```ts
// Executes one migration up
await migrator.up();
```
...or any other:
```ts
// Execute one migration down
await migrator.down();

// Executes all migrations up from last migrated
await migrator.upToLatest();

// Executes all migrations down from last migrated
await migrator.drop();

// Executes migrations to synchronize with migrations files
// Be careful, it can erase you data! 
await migrator.sync();

// Executes provided migrations
// You want to use it if none of solutions above suits you 
await migrator.run([/* ... */]);
```

You'll want to run it through CLI. See [CLI](#cli) session to learn more.

## Going deeper

### Configuration
You can pass some extra parameters to config:
```ts
const migrationsDir = path.resolve('migrations');

const migrator = MigrationsCore.create({
  adapter: new SomeAdapter(),
  migrationsDir,
  
  // specify custom postfix - '.up.sql' and '.down.sql' by default
  postfix: {
    up: '.up-migration.sql',
    down: '.down-migration.sql',
  },
  
  // provide custom logger - console is used by default
  logger: {
    info: (msg: string) => myLogger.info(msg),
  }
})
```

### Implementing adapter
There is an interface that you needed to be implemented so adapter can be used. Example with `kysely`:

```ts
import { Kysely, sql } from 'kysely';

class KyselyAdapter implements IMigrationsStorageAdapter {
  constructor(private readonly db: Kysely<DB>, private readonly table: string) {}

  async createMigrationsTable(): Promise<void> {
    await this.db.schema
      .createTable(this.table)
      .ifNotExists()
      .addColumn('name', 'varchar', (cb) => cb.notNull().unique())
      .addColumn('migrated_at', 'timestamp', (cb) => cb.notNull().defaultTo(sql`current_timestamp`))
      .execute();
  }

  async getMigrationsNames(): Promise<string[]> {
    const records = await this.db.selectFrom(this.table).select('name').execute();
    return records.map((r) => r.name);
  }

  async migrateUp(name: string, query: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx.insertInto(this.table).values({ name: name }).execute();
      await sql.raw(query).execute(trx);
    })
  }

  async migrateDown(name: string, query: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await this.db.deleteFrom(this.table).where('name', '=', name).execute();
      await sql.raw(query).execute(trx);
    })
  }
}
```

Some implementation points:
1. You need to store executed migrations names in your table. Everything else is optional.
2. Make sure to provide `IF NOT EXISTS` to your `createMigrationsTable()` method.
3. Implement `migrateUp()` and `migrateDown()` with transactions.
4. Actually, it's not necessary to store migrations metadata in table - you
can place it anywhere you want. It's all up to you!

### CLI
You can build simple CLI using Node.js. For example:
```ts
// scripts/migrations/create.js
import { migrator } from '../db/migrator';
import { ask } from '../utils';

const title = await ask('Enter migration title:');
await migrator.createEmptyMigrationFiles(title);
```

And execute with your runner:
```shell
node scripts/migrations/create.js
```

### Safe execution
If you want to check which migrations will be executed - you can
use `dry` option and return of execution methods.
It will emulate process without actual executing triggering:
```ts
const steps = await migrator.upToLatest({ dry: true });

console.log(steps);
// [
// { name: '1-example', direction: 'up' },
// { name: '2-example', direction: 'up' },
// ]
```


It can be very useful with `sync()` method and your CLI:
```ts
// scripts/migrations/sync.js
import { migrator } from '../db/migrator';
import { ask } from '../utils';

const steps = await migrator.sync({ dry: true });
const isDataLossPossible = steps.some(step => step.direction === 'down');

if (isDataLossPossible) {
  console.log(steps);
  const result = await ask('Possible data loss. Continue?');
  if (result !== 'yes') {
    return;
  }
}

await migrator.sync();
```

Keep in mind that it's not doing anything with database or SQL. It's just an emulation.
