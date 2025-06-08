const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const pool = require('./BasePool');

class Playlistervice {
  constructor() {
    this.pool = pool;
  }

  async verifyPlaylistAccess(playlistId, owner) {
    const query = {
      text: 'SELECT owner FROM playlist WHERE id = $1',
      values: [playlistId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO public.playlist (id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0]?.id) {
      throw new InvariantError('Gagal menambahkan playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylist(owner) {
    const query = {
      text: `
        SELECT playlist.id, playlist.name, users.username 
        FROM playlist 
        JOIN users ON playlist.owner = users.id 
        WHERE owner = $1
      `,
      values: [owner],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlist WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const songCheckQuery = {
      text: 'SELECT id FROM song WHERE id = $1',
      values: [songId],
    };

    const songResult = await this.pool.query(songCheckQuery);
    if (!songResult.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const id = `playlist-song-${nanoid(16)}`;
    const query = {
      text: `
        INSERT INTO song_playlist (id, playlist_id, song_id) 
        VALUES ($1, $2, $3) RETURNING id
      `,
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rows[0]?.id) {
      throw new InvariantError('Gagal menambahkan lagu ke dalam playlist');
    }
  }

  async getSongsFromPlaylist(playlistId) {
    const queryPlaylist = {
      text: `
        SELECT playlist.id, playlist.name, users.username 
        FROM playlist 
        JOIN users ON playlist.owner = users.id 
        WHERE playlist.id = $1
      `,
      values: [playlistId],
    };

    const querySongs = {
      text: `
        SELECT song.id, song.title, song.performer 
        FROM song 
        JOIN song_playlist ON song.id = song_playlist.song_id 
        WHERE song_playlist.playlist_id = $1
      `,
      values: [playlistId],
    };

    const playlistResult = await this.pool.query(queryPlaylist);
    if (!playlistResult.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsResult = await this.pool.query(querySongs);
    return {
      ...playlistResult.rows[0],
      songs: songsResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: `
        DELETE FROM song_playlist 
        WHERE playlist_id = $1 AND song_id = $2 
        RETURNING id
      `,
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError(
        'Lagu gagal dihapus dari playlist. ID tidak ditemukan'
      );
    }
  }
}

module.exports = Playlistervice;
