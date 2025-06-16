class AlbumHandler {
  constructor(albumService, storageService, validator) {
    this.albumService = albumService;
    this.storageService = storageService;
    this.validator = validator;

    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
  }

  async getAlbumsHandler() {
    const albums = await this.albumService.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this.albumService.getAlbumById(id);

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async postAlbumHandler(request, h) {
    this.validator.validateAlbumPayload(request.payload);

    const albumId = await this.albumService.addAlbum(request.payload);
    console.log(`Album dengan id ${albumId} berhasil ditambahkan`);

    return h
      .response({
        status: 'success',
        message: 'Album berhasil ditambahkan',
        data: {
          albumId,
        },
      })
      .code(201);
  }

  async putAlbumByIdHandler(request) {
    this.validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this.albumService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this.albumService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id: albumId } = request.params;

    this.validator.validateAlbumCover(cover.hapi.headers);

    const fileLocation = await this.storageService.writeFile(cover, cover.hapi);

    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/uploads/cover/album/${fileLocation}`;
    await this.albumService.updateAlbumCover(albumId, coverUrl);

    return h
      .response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      })
      .code(201);
  }
}

module.exports = AlbumHandler;
