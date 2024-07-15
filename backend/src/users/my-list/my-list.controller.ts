import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, GetUser } from '../../auth/auth.guard';
import { ApiOkResponse } from '@nestjs/swagger';
import { MyListItemDto } from './my-list.dtos';
import { MyListService } from './my-list.service';
import { User } from '../user.entity';

@Controller('my-list')
@UseGuards(AuthGuard)
export class MyListController {
  constructor(private myListService: MyListService) {}

  @Get()
  @ApiOkResponse({ type: MyListItemDto, isArray: true })
  async getMyList(@GetUser() user: User): Promise<MyListItemDto[]> {
    return this.myListService.getMyList(user);
  }

  @Post(':tmdbId')
  @ApiOkResponse({ type: MyListItemDto, isArray: true })
  async addToMyList(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
  ): Promise<MyListItemDto[]> {
    return this.myListService.addToMyList(user, tmdbId);
  }

  @Delete(':tmdbId')
  @ApiOkResponse({ type: MyListItemDto, isArray: true })
  async removeFromMyList(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
  ): Promise<MyListItemDto[]> {
    return this.myListService.removeFromMyList(user, tmdbId);
  }
}
