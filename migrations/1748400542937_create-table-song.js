/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
const up = (pgm) => {
  pgm.createTable('song', {
    id: {
      type: 'varchar(50)',
      notNull: true,
      primaryKey: true,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    year: {
      type: 'integer',
      notNull: true,
    },
    genre: {
      type: 'varchar(100)',
      notNull: true,
    },
    performer: {
      type: 'varchar(100)',
      notNull: true,
    },
    duration: {
      type: 'integer',
      notNull: false, // optional
    },
    album_id: {
      type: 'varchar(50)',
      references: '"album"',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      notNull: false, // karena albumId optional
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
const down = (pgm) => {
  pgm.dropTable('song', {
    ifExists: true,
  });
};

module.exports = {
  shorthands,
  up,
  down,
};
