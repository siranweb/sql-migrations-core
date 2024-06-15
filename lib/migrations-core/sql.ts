export function createTableIfNotExists(table: string): string {
  return `
    CREATE TABLE IF NOT EXISTS ${table} (
      name varchar,
      migrated_at timestamp not null,
      primary key (name)
    );
  `;
}
