/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
const shorthands = undefined;

const up = (pgm) => {
  pgm.createTable('album_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'album(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Prevent duplicate like
  pgm.addConstraint('album_likes', 'unique_album_user_like', {
    unique: ['album_id', 'user_id'],
  });
};

const down = (pgm) => {
  pgm.dropTable('album_likes');
};

module.exports = {
  shorthands,
  up,
  down,
};
