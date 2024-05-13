import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOkResponse } from '@nestjs/swagger';
import { CsnService } from './csn.service';

@Controller('csn')
export class CsnController {
  constructor(private csnService: CsnService) {}

  // User-initiated

  @UseGuards(AuthGuard)
  @Post('invite')
  @ApiOkResponse({ description: 'Invite ID', type: String })
  async createInvite() {
    return await this.csnService.createInvite();
  }

  @UseGuards(AuthGuard)
  @Get('invite/:inviteId')
  @ApiOkResponse({ description: 'Join Invite' })
  async joinInvite(
    @Param('inviteId') inviteId: string,
    @Query() baseUrl: string,
  ) {
    const peer = await this.csnService.joinInvite(baseUrl, inviteId);

    if (!peer) {
      throw new NotFoundException();
    }
  }

  // Server-initiated

  @Post('peer')
  async addPeer(@Query() inviteId: string, @Query() baseUrl: string) {
    const invite = await this.csnService.acceptInvite(inviteId, baseUrl);

    if (!invite) {
      throw new NotFoundException();
    }

    return invite.apiKey;
  }
}
