class AlbumLikesHandler {
  constructor(service) {
    this.service = service;

    this.postLikeAlbumHandler = this.postLikeAlbumHandler.bind(this);
    this.deleteLikeAlbumHandler = this.deleteLikeAlbumHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this.service.likeAlbum(userId, albumId);

    return h
      .response({
        status: 'success',
        message: 'Berhasil menyukai album',
      })
      .code(201);
  }

  async deleteLikeAlbumHandler(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this.service.unlikeAlbum(userId, albumId);

    return {
      status: 'success',
      message: 'Berhasil batal menyukai album',
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;

    const { likes, cache } = await this.service.getAlbumLikesCount(albumId);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });

    if (cache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = AlbumLikesHandler;
