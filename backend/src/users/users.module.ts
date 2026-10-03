import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { UserSettingsService } from './user-settings.service.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([User]), SettingsModule],
  providers: [UsersService, UserSettingsService],
  controllers: [UsersController],
  exports: [UsersService, UserSettingsService],
})
export class UsersModule {}
