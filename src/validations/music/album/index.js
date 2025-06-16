const { AlbumPayloadSchema, ImageAlbumCoverSchema } = require('./album');
const InvariantError = require('../../../exceptions/InvariantError');

const AlbumValidator = {
  validateAlbumPayload: (payload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateAlbumCover: (headers) => {
    const validationResult = ImageAlbumCoverSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AlbumValidator;
