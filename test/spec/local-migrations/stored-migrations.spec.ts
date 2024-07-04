import { StoredMigrations } from '../../../lib/migrations-core/stored-migrations';
import { IStoredMigrations, SqlActions } from '../../../lib/migrations-core/types/stored-migrations.interface';
import { downMigrations, migrationNames, upMigrations } from '../../stubs/migrations';

describe('Stored migrations', () => {
  let storedMigrations: IStoredMigrations;
  let sqlActions: SqlActions;

  beforeEach(() => {
    sqlActions = {
      async createTable() {},
      async migrateUp() {},
      async migrateDown() {},
      async getNames() {
        return [];
      },
    };

    storedMigrations = new StoredMigrations({ sqlActions });
  })

  afterEach(() => {
    jest.clearAllMocks();
  })

  describe('Table creation', () => {
    test('initTable(): Should create table', async () => {
      const createTableMock = jest.spyOn(sqlActions, 'createTable').mockImplementation(async () => {});
      await storedMigrations.initTable();

      expect(createTableMock.mock.calls.length).toBe(1);
    })
  })

  describe('Migrations execution', () => {
    test('migrate(): Should skip migrations execution if not migrations provided', async () => {
      const migrateUpMock = jest.spyOn(sqlActions, 'migrateUp').mockImplementation(async () => {});
      await storedMigrations.migrate([], 'up');

      expect(migrateUpMock.mock.calls.length).toBe(0);
    })

    test('migrate(): Should run up migrations execution', async () => {
      const migrateUpMock = jest.spyOn(sqlActions, 'migrateUp').mockImplementation(async () => {});
      await storedMigrations.migrate(upMigrations, 'up');

      expect(migrateUpMock.mock.calls.length).toBe(1);
      expect(migrateUpMock.mock.calls[0][0]).toBe(upMigrations);
    })

    test('migrate(): Should run down migrations execution', async () => {
      const migrateDownMock = jest.spyOn(sqlActions, 'migrateDown').mockImplementation(async () => {});
      await storedMigrations.migrate(downMigrations, 'down');

      expect(migrateDownMock.mock.calls.length).toBe(1);
      expect(migrateDownMock.mock.calls[0][0]).toBe(downMigrations);
    })
  })

  describe('Migrations names selection', () => {
    test('getMigrationsNames(): Should return ascending-sorted array of names of migrations', async () => {
      const getNamesMock = jest.spyOn(sqlActions, 'getNames').mockImplementation(async () => {
        return [...migrationNames].reverse();
      });
      const names = await storedMigrations.getMigrationsNames();

      expect(getNamesMock.mock.calls.length).toBe(1);
      expect(names).toStrictEqual(migrationNames);
    })

    test('getLatestMigrationName(): Should return latest migration name', async () => {
      const getNamesMock = jest.spyOn(sqlActions, 'getNames').mockImplementation(async () => {
        return [...migrationNames].reverse();
      });
      const name = await storedMigrations.getLatestMigrationName();

      expect(getNamesMock.mock.calls.length).toBe(1);
      expect(name).toStrictEqual(migrationNames.at(-1));
    })

    test('getLatestMigrationName(): Should return null if no migrations found', async () => {
      const getNamesMock = jest.spyOn(sqlActions, 'getNames').mockImplementation(async () => {
        return [];
      });
      const name = await storedMigrations.getLatestMigrationName();

      expect(getNamesMock.mock.calls.length).toBe(1);
      expect(name).toStrictEqual(null);
    })

    test('getLatestMigrationName(): Should return latest migration name with provided sqlActions.getLastName()', async () => {
      sqlActions = {
        async createTable() {},
        async migrateUp() {},
        async migrateDown() {},
        async getNames() {
          return [];
        },
        async getLastName() {
          return null;
        }
      };

      storedMigrations = new StoredMigrations({ sqlActions });

      const getLastNameMock = jest.spyOn(sqlActions, 'getLastName').mockImplementation(async () => {
        return migrationNames.at(-1) ?? null;
      });
      const name = await storedMigrations.getLatestMigrationName();

      expect(getLastNameMock.mock.calls.length).toBe(1);
      expect(name).toStrictEqual(migrationNames.at(-1));
    })
  })
});