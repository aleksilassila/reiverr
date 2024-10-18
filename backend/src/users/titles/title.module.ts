import { Module } from '@nestjs/common';
import { TitleService } from './title.service';
import { titleProviders } from './title.providers';
import { TitlesController } from './titles.controller';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [TitleService, ...titleProviders],
  controllers: [TitlesController],
})
export class TitleModule {}
