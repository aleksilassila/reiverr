import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserServiceError, UsersService } from './users.service';
import {
  UserAccessControl,
  GetAuthUser,
  OptionalAccessControl,
} from '../auth/auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateUserDto,
  MovieUserDataDto,
  SeriesUserDataDto,
  UpdateUserDto,
  UserDto,
} from './user.dto';
import { User } from './user.entity';
import { ApiException } from '@nanogiants/nestjs-swagger-api-exception-decorator';
import { LibraryService } from './library/library.service';
import { PlayStateService } from './play-state/play-state.service';
import { PlayState } from './play-state/play-state.entity';
import { PlayStateDto } from './play-state/play-state.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private libraryService: LibraryService,
    private playStateService: PlayStateService,
  ) {}

  // @UseGuards(AuthGuard)
  // @Get()
  // @ApiOkResponse({ description: 'User found', type: UserDto })
  // @ApiException(() => NotFoundException, { description: 'User not found' })
  // async getProfile(@GetUser() user: User): Promise<UserDto> {
  //   console.log(user);
  //
  //   if (!user) {
  //     throw new NotFoundException();
  //   }
  //
  //   return UserDto.fromEntity(user);
  // }

  @UseGuards(UserAccessControl)
  @Get('')
  @ApiOkResponse({
    description: 'All users found',
    type: UserDto,
    isArray: true,
  })
  async findAllUsers(@GetAuthUser() callerUser: User): Promise<UserDto[]> {
    if (!callerUser.isAdmin) {
      throw new UnauthorizedException();
    }

    const users = await this.usersService.findAll();

    return users.map((user) => UserDto.fromEntity(user));
  }

  @UseGuards(UserAccessControl)
  @Get(':id')
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async findUserById(
    @Param('id') id: string,
    @GetAuthUser() callerUser: User,
  ): Promise<UserDto> {
    if (!callerUser.isAdmin && callerUser.id !== id) {
      throw new NotFoundException();
    }

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return UserDto.fromEntity(user);
  }

  // @Get('isSetupDone')
  // @ApiOkResponse({ description: 'Setup done', type: Boolean })
  // async isSetupDone() {
  //   return this.userService.noPreviousAdmins();
  // }

  @UseGuards(OptionalAccessControl)
  @Post()
  @ApiOkResponse({ description: 'User created', type: UserDto })
  @ApiException(() => UnauthorizedException, { description: 'Unauthorized' })
  @ApiException(() => BadRequestException)
  async createUser(
    @Body()
    userCreateDto: CreateUserDto,
    @GetAuthUser() callerUser: User | undefined,
  ) {
    const canCreateUser =
      (await this.usersService.noPreviousAdmins()) || callerUser?.isAdmin;

    if (!canCreateUser) throw new UnauthorizedException();

    const user = await this.usersService.create(userCreateDto).catch((e) => {
      if (e === UserServiceError.UsernameRequired)
        throw new BadRequestException('Username is required');
      else throw new InternalServerErrorException();
    });

    return UserDto.fromEntity(user);
  }

  @UseGuards(UserAccessControl)
  @Put(':id')
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetAuthUser() callerUser: User,
  ): Promise<UserDto> {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    const user = await this.usersService.findOne(id);

    const updated = await this.usersService
      .update(user, callerUser, updateUserDto)
      .catch((e) => {
        console.error(e);
        if (e === UserServiceError.PasswordMismatch) {
          throw new BadRequestException('Password mismatch');
        } else throw new InternalServerErrorException();
      });

    return UserDto.fromEntity(updated);
  }

  @UseGuards(UserAccessControl)
  @Delete(':id')
  @ApiOkResponse({ description: 'User deleted' })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async deleteUser(@Param('id') id: string, @GetAuthUser() callerUser: User) {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    await this.usersService.remove(id);
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/movie/tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'User movie data found',
    type: MovieUserDataDto,
  })
  async getUserMovieData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService.findMoviePlayState(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playState: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'User series data found',
    type: SeriesUserDataDto,
  })
  async getSeriesUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService.findSeriesPlayStates(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playStates: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/tmdb/:tmdbId/season/:season/episode/:episode')
  @ApiOkResponse({
    description: 'User series data found',
    type: MovieUserDataDto,
  })
  async getEpisodeUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<MovieUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService
      .findSeriesPlayStates(userId, tmdbId, season, episode)
      .then((states) =>
        states.find((s) => s.season === season && s.episode === episode),
      );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playState: playState,
    };
  }
}
