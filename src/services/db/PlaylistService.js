const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistService {
  constructor() {
    this.pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0]?.id) {
      throw new InvariantError('Gagal menambahkan playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT playlists.id, playlists.name, users.username 
        FROM playlists 
        JOIN users ON playlists.owner = users.id 
        WHERE owner = $1
      `,
      values: [owner],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;
    const query = {
      text: `
        INSERT INTO playlist_songs (id, playlist_id, song_id) 
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
        SELECT playlists.id, playlists.name, users.username 
        FROM playlists 
        JOIN users ON playlists.owner = users.id 
        WHERE playlists.id = $1
      `,
      values: [playlistId],
    };

    const querySongs = {
      text: `
        SELECT songs.id, songs.title, songs.performer 
        FROM songs 
        JOIN playlist_songs ON songs.id = playlist_songs.song_id 
        WHERE playlist_songs.playlist_id = $1
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
        DELETE FROM playlist_songs 
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

module.exports = PlaylistService;
