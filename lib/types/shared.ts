export type MigrationDirection = 'up' | 'down';

export type MigrationStep = {
  name: string;
  direction: MigrationDirection;
};

export type Postfix = {
  up: string;
  down: string;
};

export interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}
