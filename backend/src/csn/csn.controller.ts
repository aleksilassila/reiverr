import { Controller, Get, Post, Query } from '@nestjs/common';
import { CsnService } from './csn.service';
import { CsnPeer } from './csn.entity';

@Controller('csn')
export class CsnController {
  constructor(private csnService: CsnService) {
    csnService.emitter.on('connect', this.handleConnect);
    csnService.emitter.on('disconnect', this.handleDisconnect);
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
  async getPeerIds() {
    return Array.from(this.csnService.connections.keys()).map(
      (peer) => peer.id,
    );
  }

  async handleConnect(peer: CsnPeer) {
    console.log('Connected to peer', peer.id);
  }

  async handleDisconnect(peer: CsnPeer) {
    console.log('Disconnected from peer', peer.id);
  }
}
