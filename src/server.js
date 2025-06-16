require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const ClientError = require('./exceptions/ClientError');

const authentications = require('./api/authentication');
const AuthenticationsService = require('./services/db/AuthenticationService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validations/authentication');

const user = require('./api/users');
const UserService = require('./services/db/UserService');
const UserValidator = require('./validations/users');

const album = require('./api/music/album');
const AlbumService = require('./services/db/AlbumService');
const AlbumValidator = require('./validations/music/album');

const song = require('./api/music/song');
const SongService = require('./services/db/SongService');
const SongValidator = require('./validations/music/song');

const playlist = require('./api/music/playlist');
const PlaylistService = require('./services/db/PlaylistService');
const PlaylistValidator = require('./validations/music/playlist');

const exportPlaylist = require('./api/export');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validations/export');

const AlbumLikesService = require('./services/db/AlbumLikeService');
const albumLikes = require('./api/music/albumLikes');

const StorageService = require('./services/storage/StorageService');
const CacheService = require('./services/redis/CacheService');

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

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('musicapi_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_EXPIRE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  const cacheService = new CacheService();
  const authenticationService = new AuthenticationsService();
  const userService = new UserService();
  const albumService = new AlbumService();
  const songService = new SongService();
  const playlistService = new PlaylistService();
  const albumLikesService = new AlbumLikesService(cacheService);
  const storageAlbumCoverService = new StorageService('../uploads/cover/album');

  await server.register([
    {
      plugin: authentications,
      options: {
        authenticationsService: authenticationService,
        usersService: userService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: user,
      options: {
        service: userService,
        validator: UserValidator,
      },
    },
    {
      plugin: album,
      options: {
        albumService,
        storageService: storageAlbumCoverService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: song,
      options: {
        service: songService,
        validator: SongValidator,
      },
    },
    {
      plugin: playlist,
      options: {
        service: playlistService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: exportPlaylist,
      options: {
        exportService: ProducerService,
        playlistService,
        validator: ExportsValidator,
      },
    },
    {
      plugin: albumLikes,
      options: {
        service: albumLikesService,
      },
    },
  ]);

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
      const { statusCode, payload } = response.output;

      if (statusCode >= 400 && statusCode < 500) {
        return h
          .response({
            status: 'fail',
            message: payload.message,
          })
          .code(statusCode);
      }

      console.error('SERVER ERROR:', response);
      return h
        .response({
          status: 'error',
          message: 'Maaf, terjadi kegagalan pada server kami',
        })
        .code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
  console.table(
    server.table().map((route) => ({
      method: route.method,
      path: route.path,
    }))
  );
};

init();
