const AlbumLikesHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albumLikes',
  version: '1.0.0',
  register: async (server, { service }) => {
    const handler = new AlbumLikesHandler(service);
    server.route(routes(handler));
  },
};
