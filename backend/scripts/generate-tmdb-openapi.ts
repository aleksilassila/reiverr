import { generateApi } from 'swagger-typescript-api';
import * as path from 'path';

console.log(path.join(require.main.path, '..', 'plugins'));
generateApi({
  name: 'tmdb.v3.openapi.ts',
  url: 'https://developer.themoviedb.org/openapi/64542913e1f86100738e227f', // https://developer.themoviedb.org/openapi
  output: path.join(__dirname, '..', 'src', 'tmdb'),
  // generateClient: true,
  // generateRouteTypes: false,
  // sortTypes: true,
  httpClientType: 'axios',
});
