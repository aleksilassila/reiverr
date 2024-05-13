import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CsnInstance, CsnInvite, CsnPeer } from './csn.entity';
import {
  CSN_INSTANCE_REPOSITORY,
  CSN_INVITE_REPOSITORY,
  CSN_PEER_REPOSITORY,
} from './csn.providers';

@Injectable()
export class CsnService {
  constructor(
    @Inject(CSN_INVITE_REPOSITORY)
    private csnInviteRepository: Repository<CsnInvite>,

    @Inject(CSN_PEER_REPOSITORY)
    private csnPeerRepository: Repository<CsnPeer>,

    @Inject(CSN_INSTANCE_REPOSITORY)
    private csnInstanceRepository: Repository<CsnInstance>,
  ) {}

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

  async createInvite() {
    const invite = this.csnInviteRepository.create();
    invite.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    return this.csnInviteRepository.save(invite);
  }

  private async getInvite(inviteId: string) {
    return this.csnInviteRepository.findOneBy({ id: inviteId });
  }

  // async joinInvite(host: string, port: number, inviteId: string) {
  //   const instance = await this.getInstance();
  //
  //   const client = ClientProxyFactory.create({
  //     transport: Transport.TCP,
  //     options: {
  //       host,
  //       port,
  //     },
  //   });
  //
  //   await client.connect();
  //
  //   if (!instance) {
  //     throw new NotFoundException();
  //   }
  //
  //   const apiKey: string | undefined = await axios
  //     .get<string>(`${baseUrl}/csn/peer`, {
  //       params: {
  //         inviteId,
  //         baseUrl: instance.baseUrl,
  //       },
  //     })
  //     .then((res) => res.data)
  //     .catch(() => undefined);
  //
  //   if (!apiKey) {
  //     return;
  //   }
  //
  //   const peer = this.csnPeerRepository.create();
  //   peer.baseUrl = baseUrl;
  //   peer.apiKey = apiKey;
  //   peer.instance = instance;
  //
  //   return this.csnPeerRepository.save(peer);
  // }

  // Someone accepted our invite
  // async acceptInvite(inviteId: string, baseUrl: string) {
  //   const instance = await this.getInstance();
  //
  //   const peer = this.csnPeerRepository.create();
  //   peer.baseUrl = baseUrl;
  //   peer.apiKey = Math.random().toString(36).substring(2, 15);
  //   peer.instance = instance;
  //
  //   return this.csnPeerRepository.save(peer);
  // }

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
