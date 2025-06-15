class ExportsHandler {
  constructor(exportService, playlistService, validator) {
    this.exportService = exportService;
    this.playlistService = playlistService;
    this.validator = validator;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    console.log(request.params);

    const { playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this.playlistService.verifyPlaylistAccess(playlistId, owner);
    this.validator.validateExportPlaylistPayload(request.payload);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this.exportService.sendMessage(
      'export:playlist',
      JSON.stringify(message)
    );

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
