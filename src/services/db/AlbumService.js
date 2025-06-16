const { nanoid } = require('nanoid');
const pool = require('./BasePool');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { camelCaseKeys } = require('../../utils');

class AlbumService {
  constructor() {
    this.pool = pool;
  }

  async getAlbums() {
    const result = await this.pool.query('SELECT * FROM album');
    return result.rows.map(camelCaseKeys);
  }

  async getAlbumById(id) {
    const query = {
      text: `
        SELECT 
          a.id AS album_id,
          a.name AS album_name,
          a.year AS album_year,
          a.cover AS cover_url,
          s.id AS song_id,
          s.title AS song_title,
          s.performer AS song_performer
        FROM album a
        LEFT JOIN song s ON s.album_id = a.id
        WHERE a.id = $1
      `,
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const { rows } = result;
    const album = {
      id: rows[0].album_id,
      name: rows[0].album_name,
      coverUrl: rows[0].cover_url,
      year: rows[0].album_year,
      songs: rows
        .filter((row) => row.song_id !== null)
        .map((row) => ({
          id: row.song_id,
          title: row.song_title,
          performer: row.song_performer,
        })),
    };

    return album;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO album (id, name, year) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE album SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM album WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async updateAlbumCover(id, coverUrl) {
    const query = {
      text: 'UPDATE album SET cover = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      values: [coverUrl, id],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }
}

module.exports = AlbumService;
