const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums/{id}/likes',
    handler: handler.postLikeAlbumHandler,
    options: {
      auth: 'musicapi_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/albums/{id}/likes',
    handler: handler.deleteLikeAlbumHandler,
    options: {
      auth: 'musicapi_jwt',
    },
  },
  {
    method: 'GET',
    path: '/albums/{id}/likes',
    handler: handler.getAlbumLikesHandler,
  },
];

module.exports = routes;
