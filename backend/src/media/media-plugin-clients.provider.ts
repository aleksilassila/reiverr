import {
  ClientOptions,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

export const MEDIA_PLUGIN_CLIENTS = 'MEDIA_PLUGIN_CLIENTS';

export const mediaPluginClientsProvider = {
  provide: MEDIA_PLUGIN_CLIENTS,
  useFactory: () => {
    const configs: ClientOptions[] = [
      {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
    ];

    return configs.map((config) => ClientProxyFactory.create(config));
  },
  inject: [],
};
