import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsnInstance, CsnInvite, CsnPeer } from './csn.entity';
import {
  CSN_INSTANCE_REPOSITORY,
  CSN_INVITE_REPOSITORY,
  CSN_PEER_REPOSITORY,
} from './csn.providers';
import { EventEmitter } from 'events';
import * as net from 'node:net';

type SendFn = (event: string, payload: any) => void;

@Injectable()
export class CsnService {
  constructor(
    @Inject(CSN_INVITE_REPOSITORY)
    private csnInviteRepository: Repository<CsnInvite>,

    @Inject(CSN_PEER_REPOSITORY)
    private csnPeerRepository: Repository<CsnPeer>,

    @Inject(CSN_INSTANCE_REPOSITORY)
    private csnInstanceRepository: Repository<CsnInstance>,
  ) {
    this.emitter = new EventEmitter();

    this.server = net.createServer((socket) => {
      console.log(
        'Got connection from',
        socket.remoteAddress,
        socket.remotePort,
      );

      // const closeTimeout = setTimeout(() => socket.end(), 5000);
      //
      // socket.on('data', () => clearTimeout(closeTimeout));
      this.addSocketListeners(socket)
        // .then(async ({ send }) => {
        //   console.log('Connection ready');
        //   setInterval(() => {
        //     console.log('ping');
        //     send('ping', {});
        //   }, 2000);
        // })
        .catch(console.error);
    });

    this.server.listen(9495, '0.0.0.0');

    setTimeout(async () => {
      const peers = await this.csnPeerRepository.find();

      for (const peer of peers) {
        // new Promise((res, rej) => rej()).catch(console.error);
        if (!this.connections.has(peer)) {
          this.connectPeer(peer).catch(console.error);
        }
      }
    }, Math.random() * 1000);
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

  async confirmJoin(host: string, port: number, apiKey: string) {
    return this.createConnection(host, port).then(async ({ send, socket }) => {
      send('confirm-join', { apiKey });
      const peer = await this.createPeer(host, port, apiKey);
      this.connections.set(peer, socket);
      this.emitter.emit('connect', peer);
      return peer;
    });
  }

  async addPeer(host: string, port: number) {
    return this.createConnection(host, port).then(
      async ({ send, instance }) => {
        console.log('connection created, sending join request');
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

  async connectPeer(peer: CsnPeer) {
    return this.createConnection(peer.host, peer.port, peer)
      .then(async ({ send, socket }) => {
        send('authenticate', peer.apiKey);
        this.connections.set(peer, socket);
        this.emitter.emit('connect', peer);
        return peer;
      })
      .catch(console.error);
  }

  private async createConnection(host: string, port: number, peer?: CsnPeer) {
    return new Promise<{
      socket: net.Socket;
      send: SendFn;
      instance: CsnInstance;
    }>(async (resolve, reject) => {
      const instance = await this.getInstance();
      if (!instance) {
        console.error('Cannot find CSN instance');
        reject();
        return;
      }
      const socket = new net.Socket();

      const send: SendFn = (event, payload) => {
        try {
          socket.write(JSON.stringify({ event, payload }));
        } catch (e) {
          console.error('Cannot send message', e);
        }
      };

      this.addSocketListeners(socket, peer).catch(console.error);

      console.log('initializing connection to', host, port);
      socket.connect(port, host, async () => {
        console.log('connected to', host, port);

        resolve({ socket, send, instance });
      });
    });
  }

  private async addSocketListeners(socket: net.Socket, _peer?: CsnPeer) {
    return new Promise<{
      peer: CsnPeer;
    }>(async (resolve, reject) => {
      const instance = await this.getInstance();
      let peer: CsnPeer | undefined = _peer;

      if (!instance) {
        console.error('Cannot find CSN instance');
        socket.end();
        return;
      }

      socket.on('error', (e) => {
        console.error('connection error', e);
        socket.end();
        reject(e);
      });

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
              peer = await this.getPeerByApiKey(payload);

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
                resolve({ peer });
              }
            } else if (event === 'join') {
              const { host, port, apiKey } = payload;
              console.log('got join request', host, port, apiKey);

              // TODO: User has to confirm the new connection

              socket.end(() =>
                this.confirmJoin(host, port, apiKey)
                  .then((peer) => {
                    resolve({ peer });
                  })
                  .catch(reject),
              );
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
                reject();
                return;
              }

              this.connectionAttempts.delete(apiKey);
              peer = await this.createPeer(host, port, apiKey);
              this.connections.set(peer, socket);
              this.emitter.emit('connect', peer);
              resolve({ peer });
            } else {
              console.log('Unknown event', event, payload);
              socket.end();
              reject();
            }
          } catch (e) {
            console.error(`Cannot authenticate peer`, data.toString());
            socket.end();
            reject(e);
          }
        } else {
          try {
            const { event, payload } = JSON.parse(data.toString());
            this.emitter.emit(event, peer, payload);
          } catch (e) {
            console.error(`Cannot parse message from peer`, data.toString());
            reject(e);
            // console.error(`Cannot parse message from peer`, data.toString())
          }
        }
      });
    });
  }

  async getPeerByApiKey(apiKey: string) {
    return this.csnPeerRepository.findOneBy({ apiKey });
  }

  async getInstance() {
    const instances = await this.csnInstanceRepository.find({});

    if (instances.length > 0) {
      return instances[0];
    }

    const instance = this.csnInstanceRepository.create();
    instance.host = 'localhost';
    instance.port = 9495;
    return this.csnInstanceRepository.save(instance);
  }

  async createPeer(host: string, port: number, apiKey: string) {
    const peer = this.csnPeerRepository.create();
    peer.host = host;
    peer.port = port;
    peer.apiKey = apiKey;

    return this.csnPeerRepository.save(peer);
  }

  async updateInstance(host: string, port: number) {
    const instance = await this.getInstance();

    instance.host = host;
    instance.port = port;

    return this.csnInstanceRepository.save(instance);
  }
}
