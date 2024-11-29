import { IMigrationsStorageAdapter } from '../../../lib/migrations-storage/types/migrations-storage.interface';
import { MigrationsStorage } from '../../../lib/migrations-storage';

describe('MigrationsStore', () => {
  const adapter: IMigrationsStorageAdapter = {
    async createMigrationsTable(): Promise<void> {},
    async migrateDown(): Promise<void> {},
    async migrateUp(): Promise<void> {},
    async getMigrationsNames(): Promise<string[]> {
      return [];
    },
  };

  const getMigrationsNamesSpy = jest.spyOn(adapter, 'getMigrationsNames');
  const migrateUpSpy = jest.spyOn(adapter, 'migrateUp');
  const migrateDownSpy = jest.spyOn(adapter, 'migrateDown');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initTable(): should be executed without errors', async () => {
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.initTable()).resolves.not.toThrow();
  });

  it('getMigrationsNames(): should return migration names in correct order', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1-example', '123-example', '2-example']);
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.getMigrationsNames()).resolves.toEqual([
      '1-example',
      '2-example',
      '123-example',
    ]);
  });

  it('getLatestMigrationName(): should return latest migration name', async () => {
    getMigrationsNamesSpy.mockResolvedValue(['1-example', '123-example', '2-example']);
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.getLatestMigrationName()).resolves.toBe('123-example');
  });

  it('getLatestMigrationName(): should return null if no migrations', async () => {
    getMigrationsNamesSpy.mockResolvedValue([]);
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.getLatestMigrationName()).resolves.toBe(null);
  });

  it('executeMigration(): should execute up migration', async () => {
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.executeMigration('1-example', '', 'up')).resolves.not.toThrow();
    expect(migrateUpSpy).toHaveBeenCalledWith('1-example', '');
    expect(migrateDownSpy).not.toHaveBeenCalled();
  });

  it('executeMigration(): should execute down migration', async () => {
    const migrationsStore = new MigrationsStorage(adapter);
    await expect(migrationsStore.executeMigration('1-example', '', 'down')).resolves.not.toThrow();
    expect(migrateDownSpy).toHaveBeenCalledWith('1-example', '');
    expect(migrateUpSpy).not.toHaveBeenCalled();
  });
});
