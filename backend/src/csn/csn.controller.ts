import { Controller, Post, Query } from '@nestjs/common';
import { CsnService } from './csn.service';
import * as net from 'node:net';
import { EventEmitter } from 'events';
import { CsnInstance, CsnPeer } from './csn.entity';

@Controller('csn')
export class CsnController {
  constructor(private csnService: CsnService) {
    this.emitter = new EventEmitter();
    this.emitter.on('*', (...args) => console.log('event', args));

    this.server = net.createServer((socket) => {
      // const closeTimeout = setTimeout(() => socket.end(), 5000);
      //
      // socket.on('data', () => clearTimeout(closeTimeout));
      this.handleSocket(socket);
    });

    this.server.listen(9495, '0.0.0.0');
  }

  emitter: EventEmitter;
  server: net.Server;
  connections = new Map<CsnPeer, net.Socket>();
  connectionAttempts = new Map<
    string,
    {
      host: string;
      port: number;
    }
  >();

  // @UseGuards(AuthGuard)
  @Post('join')
  async joinNetwork(@Query('host') host: string, @Query('port') port: number) {
    console.log('calling createConnection', host, port);
    await this.createPeer(host, Number(port));
  }

  // @UseGuards(AuthGuard)
  @Post('configure')
  async configureInstance(
    @Query('host') host: string,
    @Query('port') port: number,
  ) {
    await this.csnService.updateInstance(host, Number(port));
  }

  // @UseGuards(AuthGuard)
  // @Get('invite/:inviteId')
  // @ApiOkResponse({ description: 'Join Invite' })
  // async joinInvite(
  //   @Param('inviteId') inviteId: string,
  //   @Query() host: string,
  //   @Query() port: number,
  // ) {
  //   const peer = await this.csnService.joinInvite(host, port, inviteId);
  //
  //   if (!peer) {
  //     throw new NotFoundException();
  //   }
  // }

  async handleSocket(socket: net.Socket, _peer?: CsnPeer) {
    const instance = await this.csnService.getInstance();
    let peer: CsnPeer | undefined = _peer;

    if (!instance) {
      console.error('Cannot find CSN instance');
      socket.end();
      return;
    }

    socket.on('close', () => {
      console.log('connection closed');
      if (peer) {
        this.connections.delete(peer);
        this.emitter.emit('disconnect', peer);
      }
    });

    socket.on('data', async (data) => {
      console.log('data', data.toString());

      if (!peer) {
        try {
          const { event, payload } = JSON.parse(data.toString());

          if (event === 'authenticate') {
            console.log('authenticating', payload);
            peer = await this.csnService.getPeerByApiKey(payload);

            if (!peer) {
              console.error(
                `Cannot authenticate peer: Invalid credentials`,
                data.toString(),
              );
              socket.end();
              return;
            } else {
              this.connections.set(peer, socket);
              this.emitter.emit('connect', peer);
            }
          } else if (event === 'join') {
            const { host, port, apiKey } = payload;
            console.log('got join request', host, port, apiKey);

            // TODO: User has to confirm the new connection

            socket.end(() => this.confirmJoin(host, port, apiKey));
            return;
          } else if (event === 'confirm-join') {
            console.log('confirm-join', payload);
            const { apiKey } = payload;
            const { host, port } = this.connectionAttempts.get(apiKey);

            if (!host || !port) {
              console.error(
                `Cannot confirm connection: Invalid apiKey`,
                apiKey,
              );
              socket.end();
              return;
            }

            this.connectionAttempts.delete(apiKey);
            peer = await this.csnService.createPeer(host, port, apiKey);
          } else {
            console.log('Unknown event', event, payload);
            socket.end();
          }
        } catch (e) {
          console.error(`Cannot authenticate peer`, data.toString());
          socket.end();
        }
      } else {
        try {
          const { event, payload } = JSON.parse(data.toString());
          this.emitter.emit(event, peer, payload);
        } catch (e) {
          console.error(`Cannot parse message from peer`, data.toString());
          // console.error(`Cannot parse message from peer`, data.toString())
        }
      }
    });
  }

  async confirmJoin(host: string, port: number, apiKey: string) {
    return this.createConnection(host, port).then(
      async ({ send, instance }) => {
        send('confirm-join', { apiKey });
      },
    );
  }

  async createPeer(host: string, port: number) {
    return this.createConnection(host, port).then(
      async ({ send, instance }) => {
        const apiKey = Math.random().toString(36).substr(2, 9);

        this.connectionAttempts.set(apiKey, { host, port });

        send('join', {
          host: instance.host,
          port: instance.port,
          apiKey,
        });
      },
    );
  }

  async joinPeer(peer: CsnPeer) {
    return this.createConnection(peer.host, peer.port, peer).then(
      async ({ peer, send }) => {
        send('authenticate', peer.apiKey);
      },
    );
  }

  async createConnection(host: string, port: number, peer?: CsnPeer) {
    return new Promise<{
      socket: net.Socket;
      instance: CsnInstance;
      peer: CsnPeer;
      send: (event: string, payload: any) => void;
    }>(async (resolve, reject) => {
      const instance = await this.csnService.getInstance();

      const socket = new net.Socket();

      const send = (event: string, payload: any) => {
        socket.write(JSON.stringify({ event, payload }));
      };

      socket.on('error', (e) => {
        console.error('Cannot connect to', host, port, e);
        reject(e);
      });

      console.log('initializing connection to', host, port);
      socket.connect(port, host, async () => {
        console.log('connected to', host, port);
        await this.handleSocket(socket, peer);
        resolve({ socket, instance, peer, send });
      });
    });
  }

  // async createConnection(host: string, port: number, apiKey?: string) {
  //   const instance = await this.csnService.getInstance();
  //
  //   if (!instance) {
  //     throw new Error('Cannot find CSN instance');
  //   }
  //
  //   console.log('Creating connection to', host, port);
  //   const socket = new net.Socket();
  //   socket.connect(port, host, async () => {
  //     const id = Math.random().toString(36).substr(2, 9);
  //     let peer: CsnPeer | undefined = undefined;
  //
  //     this.connections.set(id, socket);
  //
  //     socket.on('close', () => {
  //       console.log('Connection closed to', id, peer);
  //       this.connections.delete(id);
  //       if (peer) {
  //         this.peerConnections.delete(peer);
  //         this.emitter.emit('disconnect', peer);
  //       }
  //     });
  //
  //     if (apiKey) {
  //       const connectionAttempt = this.connectionAttempts.get(apiKey);
  //
  //       if (connectionAttempt) {
  //         console.log('finalizing connection', connectionAttempt);
  //         // Finalize new connection
  //         peer = await this.csnService.createPeer(
  //           connectionAttempt.host,
  //           connectionAttempt.port,
  //           apiKey,
  //         );
  //
  //         if (!peer) return;
  //
  //         this.connectionAttempts.delete(apiKey);
  //         socket.write(
  //           JSON.stringify({
  //             event: 'confirm-join',
  //             payload: { apiKey },
  //           }),
  //         );
  //
  //         this.peerConnections.set(peer, socket);
  //         this.emitter.emit('connect', peer);
  //       } else {
  //         console.log('authenticating', apiKey);
  //         peer = await this.csnService.getPeerByApiKey(apiKey);
  //
  //         if (!peer) {
  //           socket.end();
  //           return;
  //         }
  //
  //         this.peerConnections.set(peer, socket);
  //         this.emitter.emit('connect', peer);
  //       }
  //     } else {
  //       console.log('joining', host, port);
  //       const apiKey = Math.random().toString(36).substr(2, 9);
  //       socket.write(
  //         JSON.stringify({
  //           event: 'join',
  //           payload: { host: instance.host, port: instance.port, apiKey },
  //         }),
  //       );
  //     }
  //
  //     socket.on('data', async (data) => {
  //       if (peer) {
  //         try {
  //           const { event, payload } = JSON.parse(data.toString());
  //           this.emitter.emit(event, peer, payload);
  //         } catch (e) {
  //           // console.error(`Cannot parse message from peer`, data.toString())
  //         }
  //       }
  //     });
  //   });
  // }

  // @Post('invite/:inviteId')
  // acceptInvite()

  // @MessagePattern('ping')
  // async asd(@Payload() data: string, @Ctx() context: TcpContext) {
  //   console.log('ping', data);
  //   console.log('context', context);
  //
  //   return data;
  // }
}
