const fs = require('fs');
const path = require('path');

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
    this.getAlbumCoverHandler = this.getAlbumCoverHandler.bind(this);
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

  async getAlbumCoverHandler(request, h) {
    const { id: albumId } = request.params;

    const album = await this.albumService.getAlbumById(albumId);

    if (!album.coverUrl) {
      return h
        .response({
          status: 'fail',
          message: 'Album tidak memiliki sampul',
        })
        .code(404);
    }

    const filename = path.basename(album.coverUrl);

    const filePath = path.resolve(
      process.cwd(),
      '../uploads/cover/album',
      filename
    );

    console.log('Resolved file path:', filePath);

    if (!fs.existsSync(filePath)) {
      return h
        .response({
          status: 'fail',
          message: 'File sampul tidak ditemukan',
        })
        .code(404);
    }

    const fileStream = fs.createReadStream(filePath);
    return h.response(fileStream).type('image/jpeg');
  }
}

module.exports = AlbumHandler;
