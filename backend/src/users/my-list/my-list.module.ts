import { Module } from '@nestjs/common';
import { MyListController } from './my-list.controller';
import { MyListService } from './my-list.service';
import { myListProviders } from './my-list.providers';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [MyListController],
  providers: [MyListService, ...myListProviders],
})
export class MyListModule {}
