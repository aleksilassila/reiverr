import { generateApi } from 'swagger-typescript-api';
import * as path from 'path';

generateApi({
  name: 'jellyfin.openapi.ts',
  url: 'https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json',
  output: __dirname,
  // generateClient: true,
  // generateRouteTypes: false,
  // sortTypes: true,
  httpClientType: 'axios',
});
