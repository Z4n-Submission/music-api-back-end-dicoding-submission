const AlbumHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'album',
  version: '1.0.0',
  register: async (server, { albumService, storageService, validator }) => {
    const albumHandler = new AlbumHandler(
      albumService,
      storageService,
      validator
    );
    server.route(routes(albumHandler));
  },
};
