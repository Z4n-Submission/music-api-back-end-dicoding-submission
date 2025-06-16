const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const pool = require('./BasePool');

class AlbumLikesService {
  constructor(cacheService) {
    this.pool = pool;
    this.cacheService = cacheService;
  }

  async likeAlbum(userId, albumId) {
    const albumResult = await this.pool.query({
      text: 'SELECT id FROM album WHERE id = $1',
      values: [albumId],
    });

    if (!albumResult.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const check = await this.pool.query({
      text: 'SELECT id FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    });
    if (check.rowCount) {
      throw new InvariantError('Anda sudah menyukai album ini');
    }

    const id = `like-${nanoid(16)}`;
    await this.pool.query({
      text: 'INSERT INTO album_likes (id, album_id, user_id) VALUES ($1, $2, $3)',
      values: [id, albumId, userId],
    });

    await this.cacheService.delete(`album-likes:${albumId}`);
  }

  async unlikeAlbum(userId, albumId) {
    const result = await this.pool.query({
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    });

    if (!result.rowCount) {
      throw new InvariantError('Anda belum menyukai album ini');
    }

    await this.cacheService.delete(`album-likes:${albumId}`);
  }

  async getAlbumLikesCount(albumId) {
    try {
      const result = await this.cacheService.get(`album-likes:${albumId}`);
      return {
        likes: Number(result),
        cache: true,
      };
    } catch (error) {
      const result = await this.pool.query({
        text: 'SELECT id FROM album_likes WHERE album_id = $1',
        values: [albumId],
      });

      const likes = Number(result.rowCount);
      await this.cacheService.set(`album-likes:${albumId}`, likes, 1800);

      return {
        likes,
        cache: false,
      };
    }
  }
}

module.exports = AlbumLikesService;
