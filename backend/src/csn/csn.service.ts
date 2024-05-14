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
import { JellyfinItem } from '../types';
import axios from 'axios';
import { JellyfinApi } from '../jellyfin.api';

type SendFn = <P, R>(event: string, payload: P) => Promise<R>;
export type PeerConnection = {
  send: SendFn;
  peer: CsnPeer;
  socket: net.Socket;
};

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
      this.addSocketListeners(socket);
      // .then(async ({ send }) => {
      //   console.log('Connection ready');
      //   setInterval(() => {
      //     console.log('ping');
      //     send('ping', {});
      //   }, 2000);
      // })
    });

    this.server.listen(9495, '0.0.0.0');

    setTimeout(async () => {
      const peers = await this.csnPeerRepository.find();

      for (const peer of peers) {
        // new Promise((res, rej) => rej()).catch(console.error);
        if (!this.connections.has(peer.id)) {
          this.connectPeer(peer).catch(console.error);
        }
      }
    }, Math.random() * 1000);
  }

  emitter: EventEmitter;
  server: net.Server;
  connections = new Map<string, PeerConnection>();
  peerJellyfinItems = new Map<string, JellyfinItem[]>();
  connectionAttempts = new Map<
    string,
    {
      host: string;
      port: number;
    }
  >();

  async confirmJoin(host: string, port: number, apiKey: string) {
    return this.createConnection(host, port).then(async ({ send, socket }) => {
      await send('confirm-join', { apiKey });
      const peer = await this.createPeer(host, port, apiKey);
      const peerConnection = { send, peer, socket };
      this.connections.set(peer.id, peerConnection);
      this.emitter.emit('connect', peerConnection);
      return peer;
    });
  }

  async addPeer(host: string, port: number) {
    return this.createConnection(host, port).then(
      async ({ send, instance }) => {
        console.log('connection created, sending join request');
        const apiKey = Math.random().toString(36).substr(2, 9);

        this.connectionAttempts.set(apiKey, { host, port });

        await send('join', {
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
        await send('authenticate', peer.apiKey);
        const peerConnection = { send, peer, socket };
        this.connections.set(peer.id, peerConnection);
        this.emitter.emit('connect', peerConnection);
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

      await this.addSocketListeners(socket, peer);

      console.log('initializing connection to', host, port);
      socket.connect(port, host, async () => {
        console.log('connected to', host, port);

        resolve({ socket, send: this.send(socket), instance });
      });
    });
  }

  private async addSocketListeners(socket: net.Socket, _peer?: CsnPeer) {
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
    });

    socket.on('close', () => {
      console.log('connection closed');
      const peerConnection = this.connections.get(peer?.id);
      if (peerConnection) {
        this.connections.delete(peer.id);
        this.emitter.emit('disconnect', peerConnection);
      }
    });

    const onJsonData = async (data) => {
      try {
        const { event, payload, id } = data;

        if (event === 'ack') {
          const resolve = CsnService.waitingResponses.get(payload.id);
          if (resolve) resolve();
          return;
        } else {
          console.log('acknowledged', event, payload, id);
          await this.send(socket)('ack', { id });
        }

        const peerConnection = peer && this.connections.get(peer.id);
        if (peerConnection) {
          console.log('Received event, emitting', event, payload);
          this.emitter.emit(event, peerConnection, payload);
          return;
        }
      } catch (e) {
        console.error('Cannot parse message from peer', data, e);
        return;
      }

      // Initialize connection

      try {
        const { event, payload } = data;

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
            const peerConnection = {
              send: this.send(socket),
              peer,
              socket,
            };
            this.connections.set(peer.id, peerConnection);
            this.emitter.emit('connect', peerConnection);
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
            console.error(`Cannot confirm connection: Invalid apiKey`, apiKey);
            socket.end();
            return;
          }

          this.connectionAttempts.delete(apiKey);
          peer = await this.createPeer(host, port, apiKey);
          const peerConnection = { send: this.send(socket), peer, socket };
          this.connections.set(peer.id, peerConnection);
          this.emitter.emit('connect', peerConnection);
        } else {
          console.log('Unknown event', event, payload);
          socket.end();
        }
      } catch (e) {
        console.error(`Cannot authenticate peer`, data.toString());
        socket.end();
      }
    };

    socket.on('data', async (data) => {
      try {
        const text = data.toString();
        const parts = text.split('\n');
        parts
          .filter((p) => p)
          .map((p) => JSON.parse(p))
          .forEach((json) => onJsonData(json));
      } catch (e) {
        console.error(e);
        console.log('data', data.toString(), 'end');
      }
    });
  }

  static waitingResponses: Map<string, (data?: any) => void> = new Map();
  send =
    (socket: net.Socket): SendFn =>
    (event, payload) => {
      try {
        const id = Math.random().toString(36).substr(2, 9);
        socket.write(JSON.stringify({ event, payload, id }) + '\n');

        if (event === 'ack') {
          return Promise.resolve();
        } else {
          return new Promise<any>((res) => {
            const timeout = setTimeout(() => {
              res(undefined);
              console.error(`Could not get response for ${event} ${id}`);
              CsnService.waitingResponses.delete(id);
            }, 5000);

            CsnService.waitingResponses.set(id, (data) => {
              clearTimeout(timeout);
              res(data);
              CsnService.waitingResponses.delete(id);
            });
          });
        }
      } catch (e) {
        console.error('Cannot send message', e);
      }
    };

  async getPeerByApiKey(apiKey: string) {
    return this.csnPeerRepository.findOne({
      where: { apiKey },
      relations: { instance: true },
    });
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

  async getLibraryItems(peer: CsnPeer): Promise<JellyfinItem[]> {
    const instance = await this.csnInstanceRepository.findOne({
      where: { id: peer.instance?.id },
      relations: {
        user: true,
      },
    });

    const user = instance?.user;

    if (!user) return [];

    const jellyfinApi = new JellyfinApi(user);

    const items = await jellyfinApi.getLibraryItems();

    console.log('jellyfinItems', items.length);

    return items;
  }
}
