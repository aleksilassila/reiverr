import { Controller, Get, Post, Query } from '@nestjs/common';
import { CsnService, PeerConnection } from './csn.service';
import { JellyfinItem } from '../types';

@Controller('csn')
export class CsnController {
  constructor(private csnService: CsnService) {
    csnService.emitter.on('connect', this.handleConnect);
    csnService.emitter.on('disconnect', this.handleDisconnect);
    csnService.emitter.on('library-items', this.handleLibraryItems);
  }

  // @UseGuards(AuthGuard)
  @Post('peer')
  async addPeer(@Query('host') host: string, @Query('port') port: number) {
    await this.csnService.addPeer(host, Number(port));
  }

  // @UseGuards(AuthGuard)
  @Post('configure')
  async configureInstance(
    @Query('host') host: string,
    @Query('port') port: number,
  ) {
    await this.csnService.updateInstance(host, Number(port));
  }

  @Get('peers')
  async getPeers() {
    const out = {};
    Array.from(this.csnService.connections.keys()).forEach((key) => {
      out[key] = this.csnService.connections.get(key).peer;
    });
    return out;
  }

  @Get('peers/library-items')
  async getPeerLibraryItems() {
    return Array.from(this.csnService.peerJellyfinItems.entries()).map(
      ([id, items]) => ({
        peerId: id,
        items,
      }),
    );
  }

  handleConnect = async (connection: PeerConnection) => {
    console.log('Connected to peer', connection.peer.id);

    const libraryItems = await this.csnService.getLibraryItems(connection.peer);
    await connection.send('library-items', libraryItems);
  };

  handleDisconnect = async (connection: PeerConnection) => {
    console.log('Disconnected from', connection.peer.id);
  };

  handleLibraryItems = async (
    connection: PeerConnection,
    items: JellyfinItem[],
  ) => {
    console.log('Peer has following items', connection.peer.id, items.length);
    this.csnService.peerJellyfinItems.set(connection.peer.id, items || []);
  };
}
