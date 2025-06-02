require('dotenv').config();

const Hapi = require('@hapi/hapi');
const ClientError = require('./exceptions/ClientError');

const user = require('./api/users');
const UserService = require('./services/db/UserService');
const UserValidator = require('./validations/users');

const album = require('./api/music/album');
const AlbumService = require('./services/db/AlbumService');
const AlbumValidator = require('./validations/music/album');

const song = require('./api/music/song');
const SongService = require('./services/db/SongService');
const SongValidator = require('./validations/music/song');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  const userService = new UserService();
  await server.register({
    plugin: user,
    options: {
      service: userService,
      validator: UserValidator,
    },
  });

  const albumService = new AlbumService();
  await server.register({
    plugin: album,
    options: {
      service: albumService,
      validator: AlbumValidator,
    },
  });

  const songService = new SongService();
  await server.register({
    plugin: song,
    options: {
      service: songService,
      validator: SongValidator,
    },
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      console.error('SERVER ERROR:', response);

      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
